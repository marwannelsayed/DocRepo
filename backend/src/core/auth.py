from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from ..repositories.user_repository import UserRepository
import os
from dotenv import load_dotenv

load_dotenv()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Environment-based password hashing optimization
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    # Production: More secure but slower (12 rounds)
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
else:
    # Development: Faster but still secure (6 rounds for very fast testing)
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=6)

# HTTP Bearer for token
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    import time
    start_time = time.time()
    result = pwd_context.verify(plain_password, hashed_password)
    end_time = time.time()
    
    # Log performance for debugging
    duration = end_time - start_time
    print(f"🔒 Password verification took {duration:.3f} seconds (bcrypt rounds: {pwd_context.bcrypt__rounds if hasattr(pwd_context, 'bcrypt__rounds') else 'default'})")
    
    return result


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return {"email": email}
    except JWTError:
        raise credentials_exception


def get_current_user(token_data: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Get current authenticated user"""
    user_repo = UserRepository(db)
    user = user_repo.get_user_with_details(token_data["email"])
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Get current active user"""
    if not current_user.get("is_active", False):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# Legacy functions for compatibility
def authenticate_user(email: str, password: str, db: Session):
    """Authenticate user - legacy function for compatibility"""
    user_repo = UserRepository(db)
    user = user_repo.get_user_by_email(email)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user
