# Document Repository Management System

A full-stack document manageme## 📋 Prerequisites

### For Docker (Recommended)
1. **Docker** and **Docker Compose** installed
2. **Git** (for version control)

### For Manual Installation
1. **Python 3.12+** installed
2. **Node.js 18+** and npm installed
3. **PostgreSQL 12+** database server running
4. **Git** (for version control)

## 🚀 Quick Start with Docker

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DocRepo
```

### 2. Setup Environment
```bash
# Create environment file from example
make setup
# or manually: cp .env.example .env

# Edit .env file with your configuration
# Minimum required changes:
# - Set POSTGRES_PASSWORD to a secure password
# - Set SECRET_KEY to a secure random string
```

### 3. Start Development Environment
```bash
# Start all services
make dev-up

# Or using docker-compose directly
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8088
- **API Documentation**: http://localhost:8088/docs
- **Database**: localhost:5432

### 5. Other Docker Commands
```bash
# View logs
make logs

# Stop services
make dev-down

# Restart services
make restart

# Clean up everything
make clean

# Production deployment
make prod-up
```

## 🐳 Docker Commands Reference

| Command | Description |
|---------|-------------|
| `make setup` | Create .env file from example |
| `make dev-up` | Start development environment |
| `make dev-down` | Stop development environment |
| `make prod-up` | Start production environment |
| `make prod-down` | Stop production environment |
| `make logs` | Show service logs |
| `make clean` | Clean up containers and volumes |
| `make rebuild` | Rebuild and restart services |
| `make db-shell` | Access database shell |

## 🛠 Manual Installation & Setup

### Prerequisitesith FastAPI (Python) backend and React (JavaScript) frontend, featuring advanced document versioning, user management, and Docker containerization.

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login with JWT tokens
- Role-based access control (Administrator, Manager, Employee, Guest)
- Department-based organization
- Secure password hashing with bcrypt
- Optimized authentication (~200ms response time)

### 📄 Document Management
- Upload documents with metadata (title, description, tags)
- Advanced document versioning with version history
- Document update with new file versions
- Search documents by title, description, or tags
- Document deletion with proper cascade handling
- File type and size tracking
- Document audit trails and permissions
- Tag-based categorization

### 👥 User Management
- Multi-department support (IT, HR, Finance, Marketing)
- Role-based permissions
- User profile management
- Department and role administration

### 🎨 Modern User Interface
- Material-UI v7.3+ components with latest React 19
- Responsive design for desktop and mobile
- Intuitive navigation and search functionality
- File upload with drag-and-drop support
- Document versioning interface
- Consistent form styling and layouts

### 🐳 Docker Support
- Complete Docker containerization
- Production and development environments
- Docker Compose orchestration
- Automatic database initialization
- Health checks and service dependencies
- Volume persistence for data and uploads

## 🛠 Technology Stack

### Backend (Production-Optimized)
- **FastAPI**: Modern Python web framework with async support
- **SQLAlchemy**: Advanced ORM with complex relationships
- **PostgreSQL**: Primary database with foreign key constraints
- **JWT**: Secure authentication tokens
- **Pydantic v2**: Advanced data validation and serialization
- **Uvicorn**: High-performance ASGI server
- **Bcrypt**: Password hashing optimization
- **Python 3.12+**: Latest Python features

### Frontend (Modern React)
- **React 19**: Latest React with concurrent features
- **Material-UI v7.3+**: Modern component library
- **React Router v7.8+**: Advanced routing
- **Axios**: HTTP client with interceptors
- **Context API**: Global state management
- **Modern ES6+**: Latest JavaScript features

### Architecture
- **Modular Structure**: Controllers, Services, Repositories pattern
- **Lazy Loading**: Optimized startup performance
- **CORS Protection**: Cross-origin security
- **Environment Configuration**: Secure .env management

## 📋 Prerequisites

1. **Python 3.13+** installed
2. **Node.js 18+** and npm installed
3. **PostgreSQL 12+** database server running
4. **Git** (for version control)

## 🗄 Database Setup

1. Install and start PostgreSQL
2. Create a database named `document_repository`
3. Run the database schema (if you have the SQL file):
   ```sql
   -- Execute document_repository_setup.sql
   ```

## 🚀 Installation & Setup

### 1. Clone/Download the Project
```bash
# If using git
git clone <repository-url>
cd DocRepo

# Or extract the downloaded files to DocRepo folder
```

### 2. Backend Setup
```bash
cd backend

# Install Python dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose passlib python-multipart python-dotenv pydantic

# Create .env file
cp .env.example .env  # or create manually
```

### 3. Frontend Setup
```bash
cd frontend

# Install Node.js dependencies
npm install
```

### 4. Environment Configuration

#### Backend (.env file)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/document_repository
SECRET_KEY=your-super-secret-jwt-key-here-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Frontend (.env file)
```bash
REACT_APP_API_URL=http://localhost:8088
```

## 🚀 Running the Application

### Option 1: Using the Startup Scripts
```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

### Option 2: Manual Startup

#### Start Backend (Production Optimized)
```bash
cd backend
python main_production_fast.py
# Or alternatively:
# uvicorn main_production_fast:app --host 127.0.0.1 --port 8088 --reload
```

#### Start Frontend (in a new terminal)
```bash
cd frontend
npm start
```

## 🌐 Access Points

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8088
- **API Documentation**: http://localhost:8088/docs
- **Alternative API Docs**: http://localhost:8088/redoc

## 📊 Default Test Data

The system includes predefined reference data:

### Departments
- Information Technology
- Human Resources  
- Finance
- Marketing

### Roles
- Administrator (Full access)
- Manager (Department management)
- Employee (Basic access)
- Guest (Read-only)

### Getting Started
Register new users through the interface or use any sample data if available.

## 📖 Usage Guide

### 1. User Registration
- Navigate to http://localhost:3000
- Click "Sign Up" 
- Fill in user details and select department/role
- Submit to create account and auto-login

### 2. User Login
- Enter email and password
- Click "Sign In"
- Redirected to documents page upon success

### 3. Upload Documents
- Click "Upload Document" button
- Select file using file picker or drag-and-drop
- Enter title and description
- Add tags (comma-separated, optional)
- Click "Upload Document"

### 4. Update Documents
- Click the three-dot menu on any document
- Select "Edit" or update option
- Modify title, description, tags
- Optionally upload new file version
- Changes create new version while preserving history

### 5. Search & Browse Documents
- Use search bar to find documents by title/description
- Browse all documents in grid view
- Click "View" to see document details
- Click "Versions" to see complete version history

### 6. Document Version Management
- View all versions of a document
- See version numbers and upload dates
- Current version is clearly marked
- Complete audit trail of changes

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Documents
- `GET /api/documents` - List documents (with search and filtering)
- `POST /api/documents` - Upload new document
- `GET /api/documents/{id}` - Get document details
- `PUT /api/documents/{id}` - Update document (with optional new version)
- `DELETE /api/documents/{id}` - Delete document and all versions
- `GET /api/documents/{id}/versions` - Get document version history
- `PUT /api/documents/{id}/versions/{version_id}/set-current` - Set specific version as current

### Reference Data
- `GET /api/departments` - List all departments
- `GET /api/roles` - List all roles
- `GET /api/tags` - List all available tags

### Additional Features
- Search with query parameters: `?search=keyword&tag=tagname&limit=50&offset=0`
- Pagination support on all list endpoints
- Advanced filtering by department, role, and tags

## 📁 Project Structure

```
DocRepo/
├── backend/
│   ├── main_production_fast.py    # Optimized FastAPI application entry point
│   ├── src/
│   │   ├── core/
│   │   │   ├── database.py         # Database configuration and session management
│   │   │   └── auth.py            # JWT authentication utilities
│   │   ├── models/
│   │   │   ├── user.py            # User and related models
│   │   │   ├── document.py        # Document and DocumentVersion models
│   │   │   ├── tag.py             # Tag and DocumentTag models
│   │   │   └── __init__.py
│   │   ├── controllers/
│   │   │   ├── auth_controller.py  # Authentication endpoints
│   │   │   ├── document_controller.py # Document management endpoints
│   │   │   ├── tag_controller.py   # Tag management endpoints
│   │   │   ├── department_controller.py # Department endpoints
│   │   │   └── role_controller.py  # Role management endpoints
│   │   ├── services/
│   │   │   ├── document_service.py # Document business logic
│   │   │   ├── user_service.py     # User management logic
│   │   │   └── tag_service.py      # Tag management logic
│   │   ├── repositories/
│   │   │   ├── document_repository.py # Document data access
│   │   │   ├── user_repository.py  # User data access
│   │   │   └── tag_repository.py   # Tag data access
│   │   ├── schemas.py              # Pydantic models for API
│   │   └── migrate_data.py         # Database migration utilities
│   ├── uploads/                    # Document file storage
│   ├── .env                        # Environment variables
│   └── .gitignore                  # Git ignore rules
├── frontend/
│   ├── public/                     # Static files
│   ├── src/
│   │   ├── components/             # Reusable React components
│   │   ├── pages/
│   │   │   ├── Login.js           # Login page
│   │   │   ├── Register.js        # Registration page
│   │   │   └── Documents.js       # Main documents page
│   │   ├── services/
│   │   │   └── api.js             # API service layer
│   │   ├── context/
│   │   │   └── AuthContext.js     # Authentication context
│   │   └── App.js                 # Main application component
│   ├── package.json               # Node.js dependencies
│   └── .env                       # Frontend environment variables
├── start.bat                      # Windows startup script
├── start.sh                       # Linux/Mac startup script
└── README.md                      # This documentation
```

## 🔧 Development

### Backend Development
- FastAPI provides automatic API documentation at `/docs`
- Use `/docs` endpoint for interactive API testing
- Modular architecture with Controllers → Services → Repositories
- Database changes require careful foreign key constraint handling
- Optimized for production with lazy loading and fast startup

### Frontend Development
- React 19 development server supports hot reloading
- Material-UI provides consistent design system
- Add new pages in `src/pages/`
- Add new components in `src/components/`
- Context API for state management

### Database Development
- Complex relationships with proper foreign key constraints
- Document versioning with audit trails
- Cascade deletion with dependency management
- Automated cleanup of inconsistent data

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Security**: Bcrypt hashing with optimization
- **CORS Protection**: Cross-origin request security
- **SQL Injection Prevention**: SQLAlchemy ORM protection
- **Input Validation**: Pydantic v2 comprehensive validation
- **Environment Security**: Secure .env configuration
- **File Upload Security**: Type and size validation
- **Database Security**: Foreign key constraints and referential integrity

## ⚡ Performance Optimizations

- **Backend**: Optimized FastAPI startup (~200ms authentication)
- **Database**: Efficient queries with proper indexing
- **Frontend**: React 19 concurrent features
- **Lazy Loading**: On-demand module loading
- **Version Management**: Efficient document version handling
- **Memory Management**: Proper cleanup and garbage collection

## 🔄 Recent Improvements

- **Document Update Fix**: Resolved duplicate documents issue during updates
- **Version Consistency**: Ensured single current version per document
- **Foreign Key Handling**: Proper cascade deletion sequence
- **UI Consistency**: Fixed dropdown menu sizing issues
- **Security**: Comprehensive .gitignore for sensitive files
- **Performance**: Authentication response time optimization

## 🔮 Future Enhancements

### Immediate Roadmap
- **File Download**: Direct document download functionality
- **OpenSearch Integration**: Advanced full-text search capabilities
- **Document Preview**: In-browser document viewing
- **Permissions System**: Granular document access controls

### Advanced Features
- **Document Sharing**: Share documents with external users
- **Approval Workflows**: Document approval and review processes
- **Email Notifications**: Real-time update notifications
- **Document Analytics**: Usage and access analytics
- **Cloud Storage**: Integration with AWS S3, Azure Blob
- **API Rate Limiting**: Enhanced security and performance
- **Audit Reports**: Comprehensive audit trail reporting
- **Mobile App**: Native mobile application

### Technical Improvements
- **Containerization**: Docker and Kubernetes deployment
- **Microservices**: Split into microservice architecture
- **Caching**: Redis integration for performance
- **Message Queue**: Background task processing
- **Monitoring**: Application performance monitoring
- **CI/CD**: Automated testing and deployment
- **Load Balancing**: High availability setup

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: Could not connect to database
   ```
   **Solution**: 
   - Ensure PostgreSQL is running on correct port
   - Check database credentials in .env file
   - Verify database `document_repository` exists
   - Test connection: `psql -h localhost -U username -d document_repository`

2. **Backend Import/Module Errors**
   ```
   ModuleNotFoundError: No module named 'src'
   ```
   **Solution**:
   - Ensure all Python packages are installed: `pip install -r requirements.txt`
   - Run from correct directory: `cd backend && python main_production_fast.py`
   - Check Python path and virtual environment

3. **Frontend Build/Start Errors**
   ```
   npm ERR! Missing script: start
   ```
   **Solution**:
   - Run `npm install` to install dependencies
   - Check Node.js version: `node --version` (requires 18+)
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

4. **CORS Errors in Browser**
   ```
   Access to fetch blocked by CORS policy
   ```
   **Solution**:
   - Verify API URL in frontend .env: `REACT_APP_API_URL=http://localhost:8088`
   - Check backend CORS configuration allows frontend origin
   - Ensure both servers are running on correct ports

5. **Document Upload/Update Issues**
   ```
   Failed to upload document / Duplicate documents appearing
   ```
   **Solution**:
   - Check file size limits and supported formats
   - Verify uploads directory exists and has write permissions
   - Recent fix should resolve duplicate document issues
   - Check browser console and backend logs for specific errors

6. **Authentication Issues**
   ```
   Invalid token / Authentication failed
   ```
   **Solution**:
   - Check SECRET_KEY in backend .env (minimum 32 characters)
   - Verify token expiration settings
   - Clear browser localStorage and re-login
   - Check JWT configuration and algorithm settings

### Advanced Debugging

#### Backend Logs
```bash
cd backend
python main_production_fast.py
# Check terminal output for detailed error messages
```

#### Frontend Debugging
- Open browser Developer Tools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for API request/response details
- Check Application tab for localStorage/session data

#### Database Debugging
```sql
-- Check database connections
SELECT * FROM pg_stat_activity WHERE datname = 'document_repository';

-- Check document version consistency
SELECT document_id, COUNT(*) as current_versions 
FROM document_versions 
WHERE is_current = true 
GROUP BY document_id 
HAVING COUNT(*) > 1;

-- Check foreign key constraints
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint 
WHERE contype = 'f';
```

## 📞 Support & Contributing

### Getting Help
1. **Documentation**: Check this README and API docs at `/docs`
2. **Logs**: Review console/terminal logs for error details
3. **Database**: Verify PostgreSQL connectivity and data integrity
4. **Dependencies**: Ensure all prerequisites are properly installed

### Contributing
1. **Code Style**: Follow existing patterns and structure
2. **Testing**: Test thoroughly before committing changes
3. **Documentation**: Update README for significant changes
4. **Security**: Follow security best practices for all contributions

### Project Status
- **Current Version**: Production-ready with advanced features
- **Architecture**: Modular, scalable, and maintainable
- **Performance**: Optimized for real-world usage
- **Security**: Enterprise-grade security implementations

---

**Note**: This document management system is production-ready with enterprise-grade features. The architecture supports scaling, security, and advanced document management workflows. For production deployment, consider additional monitoring, backup strategies, and infrastructure scaling based on usage requirements.

**Last Updated**: September 2025 - Reflecting current optimized state with all recent improvements and fixes.
