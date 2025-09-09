from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, BigInteger, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from .base import Base

class Document(Base):
    __tablename__ = "documents"
    
    document_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    current_version_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    created_by_user = relationship("User", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document", order_by="DocumentVersion.version_number.desc()")
    tags = relationship("Tag", secondary="document_tags", back_populates="documents")
    permissions = relationship("DocumentPermission", back_populates="document")
    audit_entries = relationship("DocumentAudit", back_populates="document")


class DocumentVersion(Base):
    __tablename__ = "document_versions"
    
    version_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.document_id"), nullable=False)
    version_number = Column(Integer, nullable=False, default=1)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    file_type = Column(String(100))
    checksum = Column(String(64))  # SHA-256 hash (renamed from file_hash to match DB)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50))  # Add status column to match DB
    is_current = Column(Boolean, default=True)
    
    # Add constraint to ensure only one current version per document
    __table_args__ = (
        CheckConstraint('version_number > 0', name='positive_version_number'),
    )
    
    # Relationships
    document = relationship("Document", back_populates="versions")
    uploaded_by_user = relationship("User")


class DocumentPermission(Base):
    __tablename__ = "document_permissions"
    
    permission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.document_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.department_id"), nullable=True)
    permission_type = Column(String(20), nullable=False)  # 'read', 'write', 'admin'
    granted_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    granted_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    document = relationship("Document", back_populates="permissions")
    user = relationship("User", foreign_keys=[user_id], back_populates="permissions")
    department = relationship("Department", back_populates="permissions")
    granted_by_user = relationship("User", foreign_keys=[granted_by])


class DocumentAudit(Base):
    __tablename__ = "document_audit"
    
    audit_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.document_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    action = Column(String(50), nullable=False)  # 'create', 'update', 'delete', 'download', 'view'
    details = Column(Text)  # JSON string with additional details
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45))  # Support IPv6
    user_agent = Column(String(500))
    
    # Relationships
    document = relationship("Document", back_populates="audit_entries")
    user = relationship("User", back_populates="audit_entries")
