from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.user_service import UserService
from ..schemas import UserCreate, UserLogin, Token, UserResponse
from ..core.auth import get_current_active_user

auth_router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


@auth_router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        user_service = UserService(db)
        result = user_service.register_user(user_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@auth_router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    import time
    start_time = time.time()
    print(f"🔍 Login request started for: {user_data.email}")
    
    try:
        db_start = time.time()
        user_service = UserService(db)
        db_time = time.time() - db_start
        print(f"🔍 UserService created in {db_time:.3f}s")
        
        auth_start = time.time()
        result = user_service.authenticate_user(user_data.email, user_data.password)
        auth_time = time.time() - auth_start
        print(f"🔍 Authentication took {auth_time:.3f}s")
        
        if not result:
            print(f"🔍 Authentication failed for {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        total_time = time.time() - start_time
        print(f"🔍 Total login time: {total_time:.3f}s")
        return result
    except ValueError as e:
        print(f"🔍 ValueError in login: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔍 Exception in login: {e}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@auth_router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    try:
        user_service = UserService(db)
        user_info = user_service.get_current_user(current_user["email"])
        
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user info: {str(e)}")
