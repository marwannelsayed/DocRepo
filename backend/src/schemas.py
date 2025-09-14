from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    department_id: str
    role_id: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    first_name: str
    last_name: str
    department_name: str
    role_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Document schemas
class DocumentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class DocumentResponse(BaseModel):
    document_id: str
    title: str
    description: Optional[str]
    created_by: str
    creator_name: str
    department_name: str
    created_at: datetime
    current_version: Optional[dict] = None
    tags: List[str] = []

    class Config:
        from_attributes = True

class DocumentSearch(BaseModel):
    query: Optional[str] = None
    tags: Optional[List[str]] = []
    uploader: Optional[str] = None

# Document Version schemas
class DocumentVersionResponse(BaseModel):
    version_id: str
    version_number: int
    file_name: str
    file_size: int
    file_type: str
    uploaded_by: str
    uploader_name: str
    uploaded_at: datetime
    is_current: bool

    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

# Tag schemas
class TagResponse(BaseModel):
    tag_id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Department schemas
class DepartmentResponse(BaseModel):
    department_id: str
    name: str
    code: str
    description: Optional[str]

    class Config:
        from_attributes = True

# Role schemas
class RoleResponse(BaseModel):
    role_id: str
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True
