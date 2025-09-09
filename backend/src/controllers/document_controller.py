from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.document_service import DocumentService
from ..schemas import DocumentCreate, DocumentResponse, DocumentVersionResponse
from ..core.auth import get_current_active_user
from pathlib import Path
from typing import List, Optional

document_router = APIRouter(prefix="/documents", tags=["documents"])


@document_router.post("", response_model=DocumentResponse)
async def create_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tags: str = Form(""),  # Comma-separated tags
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new document"""
    try:
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
        
        document_service = DocumentService(db)
        result = document_service.create_document(
            title=title,
            description=description,
            tags=tag_list,
            file=file,
            current_user_id=current_user["user_id"]
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create document: {str(e)}")


@document_router.get("", response_model=List[DocumentResponse])
async def get_documents(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get documents with optional search and filtering"""
    try:
        document_service = DocumentService(db)
        documents = document_service.get_documents(
            search=search,
            tag_filter=tag,
            limit=limit,
            offset=offset
        )
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")


@document_router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific document"""
    try:
        document_service = DocumentService(db)
        document = document_service.get_document_details(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return document
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch document: {str(e)}")


@document_router.get("/{document_id}/versions", response_model=List[DocumentVersionResponse])
async def get_document_versions(
    document_id: str,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all versions of a document"""
    try:
        document_service = DocumentService(db)
        
        # Check if document exists
        document = document_service.get_document_details(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        versions = document_service.get_document_versions(document_id)
        return versions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch document versions: {str(e)}")


@document_router.put("/{document_id}/versions/{version_id}/set-current")
async def set_current_version(
    document_id: str,
    version_id: str,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Set a specific version as the current version"""
    try:
        document_service = DocumentService(db)
        
        # Check if document exists
        document = document_service.get_document_details(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        success = document_service.set_current_version(document_id, version_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to set current version")
        
        return {"message": "Current version updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set current version: {str(e)}")


@document_router.put("/{document_id}")
async def update_document(
    document_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tags: str = Form(""),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update document details and optionally add a new version"""
    try:
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
        
        document_service = DocumentService(db)
        
        # Check if document exists
        document = document_service.get_document_details(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        result = document_service.update_document(
            document_id=document_id,
            title=title,
            description=description,
            tags=tag_list,
            current_user_id=current_user["user_id"],
            file=file
        )
        
        if not result:
            raise HTTPException(status_code=400, detail="Failed to update document")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update document: {str(e)}")


@document_router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a document"""
    try:
        document_service = DocumentService(db)
        
        # Check if document exists
        document = document_service.get_document_details(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        success = document_service.delete_document(document_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to delete document")
        
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")


@document_router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download the current version of a document"""
    try:
        document_service = DocumentService(db)
        version_info = document_service.get_document_for_download(document_id)
        
        if not version_info:
            raise HTTPException(status_code=404, detail="Document not found")
        
        file_path = Path(version_info["file_path"])
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on server")
        
        return FileResponse(
            path=str(file_path),
            filename=version_info["file_name"],
            media_type=version_info["file_type"] or 'application/octet-stream'
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download document: {str(e)}")


@document_router.get("/{document_id}/versions/{version_id}/download")
async def download_document_version(
    document_id: str,
    version_id: str,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download a specific version of a document"""
    try:
        document_service = DocumentService(db)
        version_info = document_service.get_document_for_download(document_id, version_id)
        
        if not version_info:
            raise HTTPException(status_code=404, detail="Document version not found")
        
        file_path = Path(version_info["file_path"])
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on server")
        
        return FileResponse(
            path=str(file_path),
            filename=version_info["file_name"],
            media_type=version_info["file_type"] or 'application/octet-stream'
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download document version: {str(e)}")
