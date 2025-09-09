-- DocRepo Database Setup Script
-- This script will create a fresh database with all required tables and sample data

-- Drop existing database and recreate (run these commands manually if needed)
-- DROP DATABASE IF EXISTS docrepo;
-- CREATE DATABASE docrepo;

-- Connect to the docrepo database before running the rest of this script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS user_document_permissions CASCADE;
DROP TABLE IF EXISTS document_audit CASCADE;
DROP TABLE IF EXISTS document_permissions CASCADE;
DROP TABLE IF EXISTS document_tags CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Create departments table
CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create roles table
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(department_id),
    role_id UUID NOT NULL REFERENCES roles(role_id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create documents table
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(user_id),
    current_version_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create document_versions table
CREATE TABLE document_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(document_id),
    version_number INTEGER NOT NULL DEFAULT 1,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    checksum VARCHAR(64),
    uploaded_by UUID NOT NULL REFERENCES users(user_id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50),
    is_current BOOLEAN DEFAULT TRUE,
    CONSTRAINT positive_version_number CHECK (version_number > 0)
);

-- Create tags table
CREATE TABLE tags (
    tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create document_tags table (many-to-many relationship)
CREATE TABLE document_tags (
    document_id UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES users(user_id),
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (document_id, tag_id)
);

-- Create document_permissions table
CREATE TABLE document_permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    role_id UUID REFERENCES roles(role_id),
    department_id UUID REFERENCES departments(department_id),
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('read', 'write', 'admin')),
    granted_by UUID NOT NULL REFERENCES users(user_id),
    granted_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create document_audit table
CREATE TABLE document_audit (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create user_document_permissions table
CREATE TABLE user_document_permissions (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('read', 'write', 'admin')),
    granted_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, document_id)
);

-- Add foreign key constraint for current_version_id after document_versions table is created
ALTER TABLE documents ADD CONSTRAINT documents_current_version_id_fkey 
    FOREIGN KEY (current_version_id) REFERENCES document_versions(version_id);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_is_current ON document_versions(is_current);
CREATE INDEX idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX idx_document_tags_tag_id ON document_tags(tag_id);
CREATE INDEX idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX idx_document_audit_document_id ON document_audit(document_id);
CREATE INDEX idx_document_audit_timestamp ON document_audit(timestamp);

-- Insert default departments
INSERT INTO departments (department_id, name, description) VALUES
    (uuid_generate_v4(), 'Information Technology', 'IT Department - Software Development and Infrastructure'),
    (uuid_generate_v4(), 'Human Resources', 'HR Department - Employee Management and Relations'),
    (uuid_generate_v4(), 'Finance', 'Finance Department - Financial Planning and Accounting'),
    (uuid_generate_v4(), 'Marketing', 'Marketing Department - Brand Management and Sales');

-- Insert default roles
INSERT INTO roles (role_id, name, description, permissions) VALUES
    (uuid_generate_v4(), 'Administrator', 'Full system access with all permissions', 'all'),
    (uuid_generate_v4(), 'Manager', 'Department management with elevated permissions', 'read,write,manage_department'),
    (uuid_generate_v4(), 'Employee', 'Standard employee access', 'read,write_own'),
    (uuid_generate_v4(), 'Guest', 'Read-only access for external users', 'read'),
    (uuid_generate_v4(), 'Analyst', 'Data analysis and reporting access', 'read,write,report');

-- Insert default tags
INSERT INTO tags (tag_id, name, description) VALUES
    (uuid_generate_v4(), 'Technical', 'Technical documentation and specifications'),
    (uuid_generate_v4(), 'Assessment', 'Assessment reports and evaluations'),
    (uuid_generate_v4(), 'Policy', 'Company policies and procedures'),
    (uuid_generate_v4(), 'Training', 'Training materials and documentation'),
    (uuid_generate_v4(), 'Report', 'Various reports and analytics'),
    (uuid_generate_v4(), 'Contract', 'Contracts and legal documents'),
    (uuid_generate_v4(), 'Meeting', 'Meeting notes and minutes'),
    (uuid_generate_v4(), 'Proposal', 'Project proposals and plans');

-- Create a default admin user (password: admin123)
-- Note: This password hash is for 'admin123' - change it in production!
INSERT INTO users (user_id, email, password_hash, first_name, last_name, department_id, role_id) 
SELECT 
    uuid_generate_v4(),
    'admin@docrepo.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/UFcHXYgNiEksRGrz6',  -- admin123
    'System',
    'Administrator',
    d.department_id,
    r.role_id
FROM departments d, roles r 
WHERE d.name = 'Information Technology' AND r.name = 'Administrator';

-- Display setup completion message
-- 1. Get all documents accessible to a user in their department
SELECT DISTINCT 
    d.document_id,
    d.title,
    d.description,
    d.created_at,
    dv.file_name,
    dv.file_size,
    CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name
FROM documents d
JOIN document_versions dv ON d.current_version_id = dv.version_id
JOIN users creator ON d.created_by = creator.user_id
JOIN users u ON u.user_id = $1  -- Parameter: user_id
LEFT JOIN document_permissions dp ON d.document_id = dp.document_id 
    AND dp.department_id = u.department_id 
    AND dp.is_active = TRUE
    AND (dp.expires_at IS NULL OR dp.expires_at > CURRENT_TIMESTAMP)
LEFT JOIN user_document_permissions udp ON d.document_id = udp.document_id 
    AND udp.user_id = u.user_id 
    AND udp.is_active = TRUE
    AND (udp.expires_at IS NULL OR udp.expires_at > CURRENT_TIMESTAMP)
WHERE d.is_deleted = FALSE
    AND (
        -- Document creator has access
        d.created_by = u.user_id
        -- Department has permission
        OR dp.permission_id IS NOT NULL
        -- User has specific permission (and it's not denied)
        OR (udp.user_permission_id IS NOT NULL AND udp.permission_type != 'deny')
        -- No restrictions means public within organization
        OR NOT EXISTS (
            SELECT 1 FROM document_permissions dp2 
            WHERE dp2.document_id = d.document_id AND dp2.is_active = TRUE
        )
    )
    -- Exclude if user is specifically denied
    AND NOT EXISTS (
        SELECT 1 FROM user_document_permissions udp2 
        WHERE udp2.document_id = d.document_id 
            AND udp2.user_id = u.user_id 
            AND udp2.permission_type = 'deny'
            AND udp2.is_active = TRUE
    )
ORDER BY d.created_at DESC;

-- 2. Get the 10 most recently uploaded documents tagged as "Finance"
SELECT DISTINCT
    d.document_id,
    d.title,
    d.description,
    dv.uploaded_at,
    dv.file_name,
    dv.file_size,
    CONCAT(uploader.first_name, ' ', uploader.last_name) as uploaded_by_name,
    dept.name as department_name
FROM documents d
JOIN document_versions dv ON d.current_version_id = dv.version_id
JOIN document_tags dt ON d.document_id = dt.document_id
JOIN tags t ON dt.tag_id = t.tag_id
JOIN users uploader ON dv.uploaded_by = uploader.user_id
JOIN departments dept ON uploader.department_id = dept.department_id
WHERE t.name = 'Finance'
    AND d.is_deleted = FALSE
    AND t.is_active = TRUE
ORDER BY dv.uploaded_at DESC
LIMIT 10;

-- 3. Find all versions of a given document (by document ID)
SELECT 
    dv.version_id,
    dv.version_number,
    dv.file_name,
    dv.file_path,
    dv.file_type,
    dv.file_size,
    dv.checksum,
    dv.uploaded_at,
    dv.status,
    dv.is_current,
    CONCAT(uploader.first_name, ' ', uploader.last_name) as uploaded_by_name,
    dept.name as uploader_department
FROM document_versions dv
JOIN users uploader ON dv.uploaded_by = uploader.user_id
JOIN departments dept ON uploader.department_id = dept.department_id
WHERE dv.document_id = $1  -- Parameter: document_id
ORDER BY dv.version_number DESC;

-- 4. Get the number of documents uploaded by each department in the last 30 days
SELECT 
    dept.name as department_name,
    dept.code as department_code,
    COUNT(DISTINCT d.document_id) as documents_count,
    COUNT(dv.version_id) as total_versions_uploaded
FROM departments dept
LEFT JOIN users u ON dept.department_id = u.department_id
LEFT JOIN document_versions dv ON u.user_id = dv.uploaded_by
    AND dv.uploaded_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
LEFT JOIN documents d ON dv.document_id = d.document_id
    AND d.is_deleted = FALSE
WHERE dept.is_active = TRUE
GROUP BY dept.department_id, dept.name, dept.code
ORDER BY documents_count DESC, dept.name;