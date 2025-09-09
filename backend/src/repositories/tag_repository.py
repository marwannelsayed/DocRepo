from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from ..models.tag import Tag
import uuid


class TagRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_tags(self) -> List[dict]:
        """Get all tags"""
        query = text("SELECT tag_id, name FROM tags ORDER BY name")
        results = self.db.execute(query).fetchall()
        return [{"tag_id": str(result[0]), "name": result[1]} for result in results]  # Convert UUID to string

    def get_tag_by_name(self, name: str) -> Optional[Tag]:
        """Get tag by name"""
        return self.db.query(Tag).filter(Tag.name == name).first()

    def create_tag(self, name: str) -> Tag:
        """Create a new tag"""
        tag = Tag(tag_id=str(uuid.uuid4()), name=name)
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def get_or_create_tag(self, name: str) -> Tag:
        """Get existing tag or create new one"""
        tag = self.get_tag_by_name(name)
        if not tag:
            tag = self.create_tag(name)
        return tag

    def get_tags_by_names(self, tag_names: List[str]) -> List[Tag]:
        """Get tags by list of names, create missing ones"""
        tags = []
        for name in tag_names:
            tag = self.get_or_create_tag(name)
            tags.append(tag)
        return tags
