from sqlalchemy.orm import Session
from sqlalchemy import text
from ..repositories.document_repository import DocumentRepository
from ..repositories.tag_repository import TagRepository
from fastapi import UploadFile
from pathlib import Path
from typing import List, Optional, Dict, Any
import uuid
import shutil
import os
import hashlib


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.document_repo = DocumentRepository(db)
        self.tag_repo = TagRepository(db)
        self.upload_dir = Path("uploads")
        self.upload_dir.mkdir(exist_ok=True)
        
        # Clean up any duplicate current versions on initialization
        self.document_repo.cleanup_current_versions()

    def create_document(self, title: str, description: Optional[str], 
                       tags: List[str], file: UploadFile, 
                       current_user_id: str) -> dict:
        """Create a new document with file upload"""
        # Create document
        document_id = str(uuid.uuid4())
        document_data = {
            "document_id": document_id,
            "title": title,
            "description": description,
            "created_by": current_user_id
        }
        
        db_document = self.document_repo.create_document(document_data)
        
        # Handle file upload
        file_path = self._save_uploaded_file(file, document_id)
        
        # Calculate file checksum
        file_checksum = self._calculate_file_hash(file_path)
        
        # Create first version
        version_data = {
            "version_id": str(uuid.uuid4()),
            "document_id": document_id,
            "version_number": 1,
            "file_name": file.filename,
            "file_path": str(file_path),
            "file_type": file.content_type,
            "file_size": file.size if hasattr(file, 'size') else 0,
            "checksum": file_checksum,
            "uploaded_by": current_user_id,
            "is_current": True
        }
        
        self.document_repo.create_document_version(version_data)
        
        # Handle tags
        if tags:
            tag_objects = self.tag_repo.get_tags_by_names(tags)
            tag_ids = [tag.tag_id for tag in tag_objects]
            self.document_repo.add_document_tags(document_id, tag_ids, current_user_id)
        
        return self.get_document_details(document_id)

    def get_documents(self, search: Optional[str] = None, 
                     tag_filter: Optional[str] = None,
                     limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get documents with search and filter"""
        documents = self.document_repo.get_documents_with_details(
            search=search, tag_filter=tag_filter, limit=limit, offset=offset
        )
        
        # Add tags to each document
        for doc in documents:
            doc["tags"] = self.document_repo.get_document_tags(doc["document_id"])
        
        return documents

    def get_document_details(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed document information"""
        document = self.document_repo.get_document_with_details(document_id)
        if not document:
            return None
        
        # Get current version
        versions = self.document_repo.get_document_versions(document_id)
        current_version = next((v for v in versions if v["is_current"]), None)
        
        # Get tags
        tags = self.document_repo.get_document_tags(document_id)
        
        document["current_version"] = current_version
        document["tags"] = tags
        
        return document

    def get_document_versions(self, document_id: str) -> List[Dict[str, Any]]:
        """Get all versions of a document"""
        return self.document_repo.get_document_versions(document_id)

    def set_current_version(self, document_id: str, version_id: str) -> bool:
        """Set a specific version as current"""
        return self.document_repo.set_current_version(document_id, version_id)

    def update_document(self, document_id: str, title: str, 
                       description: Optional[str], tags: List[str],
                       current_user_id: str, file: Optional[UploadFile] = None) -> Optional[Dict[str, Any]]:
        """Update document details and optionally add new version"""
        # Update basic info
        update_data = {"title": title, "description": description}
        success = self.document_repo.update_document(document_id, update_data)
        
        if not success:
            return None
        
        # Handle new file version
        if file:
            file_path = self._save_uploaded_file(file, document_id)
            
            # Calculate file checksum
            file_checksum = self._calculate_file_hash(file_path)
            
            # Get next version number
            versions = self.document_repo.get_document_versions(document_id)
            next_version = max([v["version_number"] for v in versions], default=0) + 1
            
            # Create new version
            version_data = {
                "version_id": str(uuid.uuid4()),
                "document_id": document_id,
                "version_number": next_version,
                "file_name": file.filename,
                "file_path": str(file_path),
                "file_type": file.content_type,
                "file_size": file.size if hasattr(file, 'size') else 0,
                "checksum": file_checksum,
                "uploaded_by": current_user_id,
                "is_current": False  # Initially set to false
            }
            
            new_version = self.document_repo.create_document_version(version_data)
            
            # Now set this version as current (this will automatically set others to false)
            self.document_repo.set_current_version(document_id, version_data["version_id"])
            
            # Ensure consistency
            self.document_repo.ensure_single_current_version(document_id)
        
        # Update tags - simple approach: remove all and re-add
        # Note: In production, you might want a more sophisticated approach
        if tags:
            tag_objects = self.tag_repo.get_tags_by_names(tags)
            tag_ids = [tag.tag_id for tag in tag_objects]
            # Remove existing tags and add new ones
            # This would require additional repository methods for tag management
        
        return self.get_document_details(document_id)

    def delete_document(self, document_id: str) -> bool:
        """Delete document and clean up files"""
        # Get document versions to clean up files
        versions = self.document_repo.get_document_versions(document_id)
        
        # Delete the document from database
        success = self.document_repo.delete_document(document_id)
        
        if success:
            # Clean up files
            for version in versions:
                file_path = Path(version["file_path"])
                if file_path.exists():
                    try:
                        file_path.unlink()
                    except Exception:
                        pass  # Log error in production
        
        return success

    def get_document_for_download(self, document_id: str, 
                                version_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get document version for download"""
        return self.document_repo.get_document_version_for_download(document_id, version_id)

    def _save_uploaded_file(self, file: UploadFile, document_id: str) -> Path:
        """Save uploaded file to disk"""
        # Create document-specific directory
        doc_dir = self.upload_dir / document_id
        doc_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = doc_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return file_path

    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate MD5 hash of file"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
