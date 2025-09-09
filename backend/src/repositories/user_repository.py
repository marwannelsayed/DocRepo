from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from ..models.user import User
from ..models.department import Department
from ..models.role import Role


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user_data: dict) -> User:
        """Create a new user"""
        db_user = User(**user_data)
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.user_id == user_id).first()

    def get_user_with_details(self, email: str) -> Optional[dict]:
        """Get user with department and role details"""
        query = text("""
            SELECT 
                u.user_id, u.email, u.first_name, u.last_name, u.is_active, u.created_at,
                d.name as department_name, r.name as role_name
            FROM users u
            JOIN departments d ON u.department_id = d.department_id
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.email = :email
        """)
        result = self.db.execute(query, {"email": email}).fetchone()
        if result:
            return {
                "user_id": str(result[0]),  # Convert UUID to string
                "email": result[1],
                "first_name": result[2],
                "last_name": result[3],
                "is_active": result[4],
                "created_at": result[5],
                "department_name": result[6],
                "role_name": result[7]
            }
        return None

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user by email and password"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        # Note: Password verification should be done in the service layer
        return user
