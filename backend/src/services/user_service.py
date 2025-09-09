from sqlalchemy.orm import Session
from ..repositories.user_repository import UserRepository
from ..repositories.department_repository import DepartmentRepository
from ..repositories.role_repository import RoleRepository
from ..core.auth import get_password_hash, verify_password, create_access_token
from ..schemas import UserCreate, UserResponse
from typing import Optional
import uuid


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.department_repo = DepartmentRepository(db)
        self.role_repo = RoleRepository(db)

    def register_user(self, user_data: UserCreate) -> dict:
        """Register a new user"""
        # Check if user already exists
        existing_user = self.user_repo.get_user_by_email(user_data.email)
        if existing_user:
            raise ValueError("Email already registered")
        
        # Validate department and role
        department = self.department_repo.get_department_by_id(user_data.department_id)
        if not department:
            raise ValueError("Invalid department")
        
        role = self.role_repo.get_role_by_id(user_data.role_id)
        if not role:
            raise ValueError("Invalid role")
        
        # Create user
        hashed_password = get_password_hash(user_data.password)
        user_dict = {
            "user_id": str(uuid.uuid4()),
            "email": user_data.email,
            "password_hash": hashed_password,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "department_id": user_data.department_id,
            "role_id": user_data.role_id,
            "is_active": True
        }
        
        db_user = self.user_repo.create_user(user_dict)
        
        # Create access token
        access_token = create_access_token(data={"sub": db_user.email})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": self.user_repo.get_user_with_details(db_user.email)
        }

    def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """Authenticate user and return token"""
        import time
        
        print(f"🔍 Starting authentication for: {email}")
        
        # Get user from database
        db_start = time.time()
        user = self.user_repo.get_user_by_email(email)
        db_time = time.time() - db_start
        print(f"🔍 Database query took: {db_time:.3f}s")
        
        if not user:
            print(f"🔍 User not found: {email}")
            return None
            
        # Verify password (this is where bcrypt optimization should help)
        pwd_start = time.time()
        password_valid = verify_password(password, user.password_hash)
        pwd_time = time.time() - pwd_start
        print(f"🔍 Password verification took: {pwd_time:.3f}s")
        
        if not password_valid:
            print(f"🔍 Invalid password for: {email}")
            return None
        
        if not user.is_active:
            print(f"🔍 User account deactivated: {email}")
            raise ValueError("User account is deactivated")
        
        # Create token
        token_start = time.time()
        access_token = create_access_token(data={"sub": user.email})
        token_time = time.time() - token_start
        print(f"🔍 Token creation took: {token_time:.3f}s")
        
        # Get user details (this might be slow due to joins)
        details_start = time.time()
        user_details = self.user_repo.get_user_with_details(user.email)
        details_time = time.time() - details_start
        print(f"🔍 User details query took: {details_time:.3f}s")
        
        print(f"🔍 Authentication successful for: {email}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_details
        }

    def get_current_user(self, email: str) -> Optional[dict]:
        """Get current user details"""
        return self.user_repo.get_user_with_details(email)
