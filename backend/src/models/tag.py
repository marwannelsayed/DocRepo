from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from .base import Base

# Association table for many-to-many relationship between documents and tags
document_tags = Table(
    'document_tags',
    Base.metadata,
    Column('document_tag_id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column('document_id', UUID(as_uuid=True), ForeignKey('documents.document_id'), nullable=False),
    Column('tag_id', UUID(as_uuid=True), ForeignKey('tags.tag_id'), nullable=False),
    Column('added_by', UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False),
    Column('added_at', DateTime, default=datetime.utcnow)
)

class Tag(Base):
    __tablename__ = "tags"
    
    tag_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(String(255))  # Add description field to match DB
    color = Column(String(7))  # Hex color code
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)  # Add updated_at to match DB
    is_active = Column(Boolean, default=True)
    
    # Relationships
    documents = relationship("Document", secondary=document_tags, back_populates="tags")

# Create an alias for the association table to use in imports
DocumentTag = document_tags
