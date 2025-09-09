from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.role_service import RoleService
from ..schemas import RoleResponse
from typing import List

role_router = APIRouter(prefix="/roles", tags=["roles"])


@role_router.get("", response_model=List[RoleResponse])
async def get_roles(
    db: Session = Depends(get_db)
):
    """Get all roles (public endpoint for registration)"""
    try:
        role_service = RoleService(db)
        roles = role_service.get_all_roles()
        return roles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch roles: {str(e)}")
