from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from ..models.department import Department


class DepartmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_departments(self) -> List[dict]:
        """Get all departments"""
        query = text("SELECT department_id, name, code, description FROM departments ORDER BY name")
        results = self.db.execute(query).fetchall()
        return [
            {
                "department_id": str(result[0]), 
                "name": result[1],
                "code": result[2],
                "description": result[3]
            } 
            for result in results
        ]  # Convert UUID to string

    def get_department_by_id(self, department_id: str) -> Department:
        """Get department by ID"""
        return self.db.query(Department).filter(Department.department_id == department_id).first()
