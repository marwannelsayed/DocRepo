from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from ..models.role import Role


class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_roles(self) -> List[dict]:
        """Get all roles"""
        query = text("SELECT role_id, name, description FROM roles ORDER BY name")
        results = self.db.execute(query).fetchall()
        return [
            {
                "role_id": str(result[0]), 
                "name": result[1],
                "description": result[2]
            } 
            for result in results
        ]  # Convert UUID to string

    def get_role_by_id(self, role_id: str) -> Role:
        """Get role by ID"""
        return self.db.query(Role).filter(Role.role_id == role_id).first()
