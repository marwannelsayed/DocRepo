from sqlalchemy.orm import Session
from ..repositories.tag_repository import TagRepository
from typing import List


class TagService:
    def __init__(self, db: Session):
        self.db = db
        self.tag_repo = TagRepository(db)

    def get_all_tags(self) -> List[dict]:
        """Get all available tags"""
        return self.tag_repo.get_all_tags()
