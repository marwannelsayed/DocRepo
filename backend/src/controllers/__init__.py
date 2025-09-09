from .auth_controller import auth_router
from .document_controller import document_router
from .tag_controller import tag_router
from .department_controller import department_router
from .role_controller import role_router

__all__ = [
    "auth_router",
    "document_router",
    "tag_router",
    "department_router", 
    "role_router"
]
