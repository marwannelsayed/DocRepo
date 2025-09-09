from sqlalchemy.orm import Session
from ..repositories.role_repository import RoleRepository
from typing import List


class RoleService:
    def __init__(self, db: Session):
        self.db = db
        self.role_repo = RoleRepository(db)

    def get_all_roles(self) -> List[dict]:
        """Get all roles"""
        return self.role_repo.get_all_roles()
