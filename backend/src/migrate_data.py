#!/usr/bin/env python3
"""
Data migration script to copy data from dbclient database to backend database
This script will ensure the backend database has the same data as your dbclient database.
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from database import DATABASE_URL

# Source data from your dbclient database
DEPARTMENTS_DATA = [
    {
        "department_id": "550e8400-e29b-41d4-a716-446655440101",
        "name": "Finance", 
        "code": "FIN",
        "description": "Financial department managing budgets and reports",
        "created_at": "2025-09-08 06:47:16.995159",
        "updated_at": "2025-09-08 06:47:16.995159"
    },
    {
        "department_id": "550e8400-e29b-41d4-a716-446655440102",
        "name": "Legal",
        "code": "LEG", 
        "description": "Legal department handling contracts and compliance",
        "created_at": "2025-09-08 06:47:16.995159",
        "updated_at": "2025-09-08 06:47:16.995159"
    },
    {
        "department_id": "550e8400-e29b-41d4-a716-446655440103",
        "name": "Human Resources",
        "code": "HR",
        "description": "Human resources managing personnel", 
        "created_at": "2025-09-08 06:47:16.995159",
        "updated_at": "2025-09-08 06:47:16.995159"
    },
    {
        "department_id": "550e8400-e29b-41d4-a716-446655440104",
        "name": "Information Technology",
        "code": "IT",
        "description": "IT department managing technology",
        "created_at": "2025-09-08 06:47:16.995159", 
        "updated_at": "2025-09-08 06:47:16.995159"
    },
    {
        "department_id": "550e8400-e29b-41d4-a716-446655440105",
        "name": "Marketing",
        "code": "MKT",
        "description": "Marketing department handling promotions",
        "created_at": "2025-09-08 06:47:16.995159",
        "updated_at": "2025-09-08 06:47:16.995159"
    }
]

ROLES_DATA = [
    {
        "role_id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Manager",
        "description": "Department manager with full access",
        "created_at": "2025-09-08 06:50:11.413386",
        "updated_at": "2025-09-08 06:50:11.413386"
    },
    {
        "role_id": "550e8400-e29b-41d4-a716-446655440002", 
        "name": "Senior Analyst",
        "description": "Senior analyst with read/write access",
        "created_at": "2025-09-08 06:50:11.413386",
        "updated_at": "2025-09-08 06:50:11.413386"
    },
    {
        "role_id": "550e8400-e29b-41d4-a716-446655440003",
        "name": "Analyst", 
        "description": "Junior analyst with limited access",
        "created_at": "2025-09-08 06:50:11.413386",
        "updated_at": "2025-09-08 06:50:11.413386"
    },
    {
        "role_id": "550e8400-e29b-41d4-a716-446655440004",
        "name": "Administrator",
        "description": "System administrator",
        "created_at": "2025-09-08 06:50:11.413386", 
        "updated_at": "2025-09-08 06:50:11.413386"
    },
    {
        "role_id": "550e8400-e29b-41d4-a716-446655440005",
        "name": "Viewer",
        "description": "Read-only access user",
        "created_at": "2025-09-08 06:50:11.413386",
        "updated_at": "2025-09-08 06:50:11.413386"
    }
]

def migrate_data():
    """Migrate data from dbclient to backend database."""
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.begin() as conn:  # Use transaction
            print("🔄 Starting data migration...")
            
            # Clear existing data
            print("Clearing existing departments and roles...")
            conn.execute(text("DELETE FROM departments"))
            conn.execute(text("DELETE FROM roles"))
            
            # Insert departments
            print("Inserting departments...")
            for dept in DEPARTMENTS_DATA:
                conn.execute(text("""
                    INSERT INTO departments (department_id, name, code, description, created_at, updated_at)
                    VALUES (:department_id, :name, :code, :description, :created_at, :updated_at)
                """), dept)
            
            # Insert roles
            print("Inserting roles...")
            for role in ROLES_DATA:
                conn.execute(text("""
                    INSERT INTO roles (role_id, name, description, created_at, updated_at)
                    VALUES (:role_id, :name, :description, :created_at, :updated_at)
                """), role)
            
            # Verify data
            dept_count = conn.execute(text("SELECT COUNT(*) FROM departments")).fetchone()[0]
            role_count = conn.execute(text("SELECT COUNT(*) FROM roles")).fetchone()[0]
            
            print(f"✅ Migration successful!")
            print(f"   - Departments: {dept_count}")
            print(f"   - Roles: {role_count}")
            
            return True
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_data():
    """Verify the migrated data."""
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            print("\n🔍 Verifying migrated data...")
            
            # Check departments
            result = conn.execute(text("SELECT name, code FROM departments ORDER BY name"))
            departments = result.fetchall()
            print("Departments:")
            for dept in departments:
                print(f"  - {dept[0]} ({dept[1]})")
            
            # Check roles
            result = conn.execute(text("SELECT name FROM roles ORDER BY name"))
            roles = result.fetchall()
            print("Roles:")
            for role in roles:
                print(f"  - {role[0]}")
                
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 DocRepo Data Migration")
    print("=" * 50)
    print("This will copy data from your dbclient database to the backend database.")
    print("")
    
    if migrate_data():
        verify_data()
        print("\n🎉 Data migration complete!")
        print("Your backend endpoints should now have the correct data.")
        print("\nTest the endpoints:")
        print("- curl http://localhost:8080/departments")
        print("- curl http://localhost:8080/roles")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
