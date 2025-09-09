from sqlalchemy.orm import Session
from ..repositories.department_repository import DepartmentRepository
from typing import List


class DepartmentService:
    def __init__(self, db: Session):
        self.db = db
        self.department_repo = DepartmentRepository(db)

    def get_all_departments(self) -> List[dict]:
        """Get all departments"""
        return self.department_repo.get_all_departments()
