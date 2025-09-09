from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.tag_service import TagService
from ..schemas import TagResponse
from ..core.auth import get_current_active_user
from typing import List

tag_router = APIRouter(prefix="/tags", tags=["tags"])


@tag_router.get("", response_model=List[TagResponse])
async def get_tags(
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all available tags"""
    try:
        tag_service = TagService(db)
        tags = tag_service.get_all_tags()
        return tags
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tags: {str(e)}")
