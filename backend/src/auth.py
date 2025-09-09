from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.database import get_db
from models import User
from schemas import TokenData
import os

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user by email and password."""
    result = db.execute(text("SELECT user_id, email, password_hash, first_name, last_name, department_id, role_id, is_active, created_at, updated_at FROM users WHERE email = :email"), 
                       {"email": email}).fetchone()
    if not result:
        return False
    
    # Create a User-like object with the fetched data
    class UserData:
        def __init__(self, row):
            self.user_id = str(row[0])
            self.email = row[1]
            self.password_hash = row[2]
            self.first_name = row[3]
            self.last_name = row[4]
            self.department_id = str(row[5])
            self.role_id = str(row[6])
            self.is_active = row[7]
            self.created_at = row[8]
            self.updated_at = row[9]
    
    user = UserData(result)
    if not verify_password(password, user.password_hash):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    result = db.execute(text("SELECT user_id, email, password_hash, first_name, last_name, department_id, role_id, is_active, created_at, updated_at FROM users WHERE email = :email"), 
                       {"email": token_data.email}).fetchone()
    if not result:
        raise credentials_exception
    
    # Create a User-like object with the fetched data
    class UserData:
        def __init__(self, row):
            self.user_id = str(row[0])
            self.email = row[1]
            self.password_hash = row[2]
            self.first_name = row[3]
            self.last_name = row[4]
            self.department_id = str(row[5])
            self.role_id = str(row[6])
            self.is_active = row[7]
            self.created_at = row[8]
            self.updated_at = row[9]
    
    return UserData(result)

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
