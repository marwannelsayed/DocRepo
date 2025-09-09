from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.department_service import DepartmentService
from ..schemas import DepartmentResponse
from typing import List

department_router = APIRouter(prefix="/departments", tags=["departments"])


@department_router.get("", response_model=List[DepartmentResponse])
async def get_departments(
    db: Session = Depends(get_db)
):
    """Get all departments (public endpoint for registration)"""
    try:
        department_service = DepartmentService(db)
        departments = department_service.get_all_departments()
        return departments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch departments: {str(e)}")
