#!/usr/bin/env python3
"""
PRODUCTION FAST SERVER - Optimized startup with lazy loading
"""
import time
import uvicorn
from contextlib import asynccontextmanager

# Fast imports first
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Global variables for lazy loading
routers_loaded = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern FastAPI lifespan events - replaces on_event."""
    global routers_loaded
    
    # Startup
    print("🚀 Server starting up...")
    startup_time = time.time()
    
    if not routers_loaded:
        print("📦 Loading routers...")
        load_start = time.time()
        
        # Import and load routers
        from src.controllers.auth_controller import auth_router
        from src.controllers.document_controller import document_router
        from src.controllers.tag_controller import tag_router
        from src.controllers.department_controller import department_router
        from src.controllers.role_controller import role_router
        
        # Include routers with API prefix
        app.include_router(auth_router, prefix="/api")
        app.include_router(document_router, prefix="/api")
        app.include_router(tag_router, prefix="/api")
        app.include_router(department_router, prefix="/api")
        app.include_router(role_router, prefix="/api")
        
        routers_loaded = True
        load_time = time.time() - load_start
        print(f"✅ Routers loaded in {load_time:.3f}s")
    
    total_startup = time.time() - startup_time
    print(f"🎯 Total startup time: {total_startup:.3f}s")
    
    yield  # Server is running
    
    # Shutdown
    print("🛑 Server shutting down...")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Document Repository API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS - Updated for React on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # React dev server - MAIN
        "http://127.0.0.1:3000",    # React alternative
        "http://localhost:8080",    # Test server
        "http://127.0.0.1:8080",    # Test server alternative
        "http://localhost:8088",    # Backend itself
        "http://127.0.0.1:8088",    # Backend alternative
        "*"                         # Allow all for debugging
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Fast health checks (no database imports needed)
@app.get("/")
async def root():
    """Lightning-fast health check."""
    return {
        "message": "Document Repository API is running",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "document-repository"}

@app.get("/api/health")
async def api_health():
    """API health check - test if routers are loaded."""
    return {
        "status": "ok", 
        "routers_loaded": routers_loaded,
        "api_ready": True
    }

# Database health check (lazy loaded)
@app.get("/api/db-health")
async def database_health():
    """Database health check - only loads DB when needed."""
    try:
        from src.core.database import get_db
        from sqlalchemy.orm import Session
        from sqlalchemy import text
        
        # Get database session
        db_gen = get_db()
        db: Session = next(db_gen)
        
        # Quick query
        result = db.execute(text("SELECT 1")).fetchone()
        
        # Cleanup
        try:
            next(db_gen)
        except StopIteration:
            pass
            
        return {"status": "ok", "database": "connected", "test_query": "passed"}
        
    except Exception as e:
        return {"status": "error", "database": "disconnected", "error": str(e)}

if __name__ == "__main__":
    print("🚀 Starting PRODUCTION FAST server...")
    from src.core.config import Settings
    settings = Settings()
    
    uvicorn.run(
        "main_production_fast:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        workers=1,
        log_level="info",
        access_log=False,
    )
