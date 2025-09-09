from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from typing import List, Optional, Dict, Any
from ..models.document import Document, DocumentVersion
from ..models.tag import Tag, DocumentTag
from pathlib import Path
import uuid


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_document(self, document_data: dict) -> Document:
        """Create a new document"""
        db_document = Document(**document_data)
        self.db.add(db_document)
        self.db.commit()
        self.db.refresh(db_document)
        return db_document

    def create_document_version(self, version_data: dict) -> DocumentVersion:
        """Create a new document version"""
        db_version = DocumentVersion(**version_data)
        self.db.add(db_version)
        self.db.commit()
        self.db.refresh(db_version)
        return db_version

    def get_document_by_id(self, document_id: str) -> Optional[Document]:
        """Get document by ID"""
        return self.db.query(Document).filter(Document.document_id == document_id).first()

    def get_documents_with_details(self, search: Optional[str] = None, 
                                 tag_filter: Optional[str] = None,
                                 limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get documents with creator and department details"""
        base_query = """
            SELECT DISTINCT
                d.document_id, d.title, d.description, d.created_by, d.created_at,
                u.first_name || ' ' || u.last_name as creator_name,
                dept.name as department_name,
                dv.version_id, dv.version_number, dv.file_name, dv.file_type, dv.file_size,
                dv.uploaded_at, dv.is_current
            FROM documents d
            JOIN users u ON d.created_by = u.user_id
            JOIN departments dept ON u.department_id = dept.department_id
            LEFT JOIN document_versions dv ON d.document_id = dv.document_id AND dv.is_current = true
        """
        
        conditions = []
        params = {}
        
        if search:
            conditions.append("(d.title ILIKE :search OR d.description ILIKE :search)")
            params["search"] = f"%{search}%"
        
        if tag_filter:
            base_query += """
                JOIN document_tags dt ON d.document_id = dt.document_id
                JOIN tags t ON dt.tag_id = t.tag_id
            """
            conditions.append("t.name = :tag_filter")
            params["tag_filter"] = tag_filter
        
        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
        
        base_query += " ORDER BY d.created_at DESC LIMIT :limit OFFSET :offset"
        params.update({"limit": limit, "offset": offset})
        
        results = self.db.execute(text(base_query), params).fetchall()
        
        documents = []
        for result in results:
            doc_dict = {
                "document_id": str(result[0]),  # Convert UUID to string
                "title": result[1],
                "description": result[2],
                "created_by": str(result[3]),  # Convert UUID to string
                "created_at": result[4],
                "creator_name": result[5],
                "department_name": result[6],
                "current_version": None,
                "tags": []
            }
            
            if result[7]:  # version_id exists
                doc_dict["current_version"] = {
                    "version_id": str(result[7]),  # Convert UUID to string
                    "version_number": result[8],
                    "file_name": result[9],
                    "file_type": result[10],
                    "file_size": result[11],
                    "uploaded_at": result[12],
                    "is_current": result[13]
                }
            
            documents.append(doc_dict)
        
        return documents

    def get_document_with_details(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get single document with all details"""
        query = text("""
            SELECT 
                d.document_id, d.title, d.description, d.created_by, d.created_at,
                u.first_name || ' ' || u.last_name as creator_name,
                dept.name as department_name
            FROM documents d
            JOIN users u ON d.created_by = u.user_id
            JOIN departments dept ON u.department_id = dept.department_id
            WHERE d.document_id = :document_id
        """)
        
        result = self.db.execute(query, {"document_id": document_id}).fetchone()
        if not result:
            return None
        
        return {
            "document_id": str(result[0]),  # Convert UUID to string
            "title": result[1],
            "description": result[2],
            "created_by": str(result[3]),  # Convert UUID to string
            "created_at": result[4],
            "creator_name": result[5],
            "department_name": result[6]
        }

    def get_document_versions(self, document_id: str) -> List[Dict[str, Any]]:
        """Get all versions of a document"""
        query = text("""
            SELECT dv.version_id, dv.version_number, dv.file_name, dv.file_type, dv.file_size, 
                   dv.uploaded_at, dv.is_current, dv.file_path, dv.uploaded_by,
                   CONCAT(u.first_name, ' ', u.last_name) as uploader_name
            FROM document_versions dv
            LEFT JOIN users u ON dv.uploaded_by = u.user_id
            WHERE dv.document_id = :document_id
            ORDER BY dv.version_number DESC
        """)
        
        results = self.db.execute(query, {"document_id": document_id}).fetchall()
        return [
            {
                "version_id": str(result[0]),  # Convert UUID to string
                "version_number": result[1],
                "file_name": result[2],
                "file_type": result[3],
                "file_size": result[4],
                "uploaded_at": result[5],
                "is_current": result[6],
                "file_path": result[7],
                "uploaded_by": str(result[8]) if result[8] else None,  # Convert UUID to string
                "uploader_name": result[9] if result[9] else "Unknown"
            }
            for result in results
        ]

    def get_document_version_for_download(self, document_id: str, version_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get document version for download"""
        if version_id:
            query = text("""
                SELECT dv.version_id, dv.file_name, dv.file_path, dv.file_type
                FROM document_versions dv
                WHERE dv.version_id = :version_id AND dv.document_id = :document_id
            """)
            result = self.db.execute(query, {
                "version_id": version_id,
                "document_id": document_id
            }).fetchone()
        else:
            query = text("""
                SELECT dv.version_id, dv.file_name, dv.file_path, dv.file_type
                FROM document_versions dv
                WHERE dv.document_id = :document_id AND dv.is_current = true
            """)
            result = self.db.execute(query, {"document_id": document_id}).fetchone()
        
        if result:
            return {
                "version_id": result[0],
                "file_name": result[1],
                "file_path": result[2],
                "file_type": result[3]
            }
        return None

    def set_current_version(self, document_id: str, version_id: str) -> bool:
        """Set a specific version as current"""
        try:
            # First, set all versions to not current
            self.db.execute(
                text("UPDATE document_versions SET is_current = false WHERE document_id = :document_id"),
                {"document_id": document_id}
            )
            
            # Then set the specified version as current (only if version_id is provided)
            if version_id:
                result = self.db.execute(
                    text("UPDATE document_versions SET is_current = true WHERE version_id = :version_id AND document_id = :document_id"),
                    {"version_id": version_id, "document_id": document_id}
                )
                self.db.commit()
                return result.rowcount > 0
            else:
                # If no version_id provided, just commit the changes (all set to false)
                self.db.commit()
                return True
        except Exception:
            self.db.rollback()
            return False

    def ensure_single_current_version(self, document_id: str) -> bool:
        """Ensure only one version is marked as current for a document"""
        try:
            # Find all current versions for this document
            current_versions = self.db.execute(
                text("SELECT version_id FROM document_versions WHERE document_id = :document_id AND is_current = true ORDER BY version_number DESC"),
                {"document_id": document_id}
            ).fetchall()
            
            if len(current_versions) > 1:
                # Set all to false first
                self.db.execute(
                    text("UPDATE document_versions SET is_current = false WHERE document_id = :document_id"),
                    {"document_id": document_id}
                )
                # Set only the latest one as current
                self.db.execute(
                    text("UPDATE document_versions SET is_current = true WHERE version_id = :version_id"),
                    {"version_id": current_versions[0][0]}
                )
                self.db.commit()
                return True
            elif len(current_versions) == 0:
                # If no current version, set the latest one as current
                latest_version = self.db.execute(
                    text("SELECT version_id FROM document_versions WHERE document_id = :document_id ORDER BY version_number DESC LIMIT 1"),
                    {"document_id": document_id}
                ).fetchone()
                if latest_version:
                    self.db.execute(
                        text("UPDATE document_versions SET is_current = true WHERE version_id = :version_id"),
                        {"version_id": latest_version[0]}
                    )
                    self.db.commit()
                return True
            
            return True  # Already consistent
        except Exception:
            self.db.rollback()
            return False

    def cleanup_current_versions(self) -> bool:
        """Fix any documents that have multiple current versions"""
        try:
            # Get all documents that have multiple current versions
            duplicate_docs = self.db.execute(
                text("""
                    SELECT document_id 
                    FROM document_versions 
                    WHERE is_current = true 
                    GROUP BY document_id 
                    HAVING COUNT(*) > 1
                """)
            ).fetchall()
            
            # Fix each document
            for doc in duplicate_docs:
                self.ensure_single_current_version(doc[0])
            
            return True
        except Exception:
            return False

    def update_document(self, document_id: str, update_data: dict) -> bool:
        """Update document details"""
        try:
            result = self.db.execute(
                text("UPDATE documents SET title = :title, description = :description WHERE document_id = :document_id"),
                {
                    "title": update_data.get("title"),
                    "description": update_data.get("description"),
                    "document_id": document_id
                }
            )
            self.db.commit()
            return result.rowcount > 0
        except Exception:
            self.db.rollback()
            return False

    def delete_document(self, document_id: str) -> bool:
        """Delete document and all its versions"""
        try:
            # Delete document audit entries first
            self.db.execute(
                text("DELETE FROM document_audit WHERE document_id = :document_id"),
                {"document_id": document_id}
            )
            
            # Delete document permissions
            self.db.execute(
                text("DELETE FROM document_permissions WHERE document_id = :document_id"),
                {"document_id": document_id}
            )
            
            # Delete document tags
            self.db.execute(
                text("DELETE FROM document_tags WHERE document_id = :document_id"),
                {"document_id": document_id}
            )
            
            # Clear current_version_id reference first to avoid foreign key constraint
            self.db.execute(
                text("UPDATE documents SET current_version_id = NULL WHERE document_id = :document_id"),
                {"document_id": document_id}
            )
            
            # Now delete document versions
            self.db.execute(
                text("DELETE FROM document_versions WHERE document_id = :document_id"),
                {"document_id": document_id}
            )
            
            # Finally delete document
            result = self.db.execute(
                text("DELETE FROM documents WHERE document_id = :document_id"),
                {"document_id": document_id}
            )
            
            self.db.commit()
            return result.rowcount > 0
        except Exception as e:
            self.db.rollback()
            print(f"Error deleting document: {e}")  # Add logging for debugging
            return False

    def add_document_tags(self, document_id: str, tag_ids: List[str], added_by: str) -> None:
        """Add tags to a document"""
        import uuid
        for tag_id in tag_ids:
            self.db.execute(
                text("""INSERT INTO document_tags (document_tag_id, document_id, tag_id, added_by) 
                        VALUES (:document_tag_id, :document_id, :tag_id, :added_by) 
                        ON CONFLICT DO NOTHING"""),
                {
                    "document_tag_id": str(uuid.uuid4()),
                    "document_id": document_id, 
                    "tag_id": tag_id,
                    "added_by": added_by
                }
            )
        self.db.commit()

    def get_document_tags(self, document_id: str) -> List[str]:
        """Get tags for a document"""
        query = text("""
            SELECT t.name
            FROM tags t
            JOIN document_tags dt ON t.tag_id = dt.tag_id
            WHERE dt.document_id = :document_id
            ORDER BY t.name
        """)
        
        results = self.db.execute(query, {"document_id": document_id}).fetchall()
        return [result[0] for result in results]
