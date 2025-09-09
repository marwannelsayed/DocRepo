#!/usr/bin/env python3
"""
Database Reset and Setup Tool for DocRepo
This script will drop and recreate the database with fresh data
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
import os

# Database configuration
DB_HOST = "localhost"
DB_PORT = "5432"
DB_USER = "postgres"
DB_PASSWORD = "M2002FoAFG"
DB_NAME = "docrepo"

def connect_postgres():
    """Connect to PostgreSQL server (not to specific database)"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database="postgres"  # Connect to default postgres database
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        return conn
    except Exception as e:
        print(f"❌ Error connecting to PostgreSQL: {e}")
        return None

def connect_docrepo():
    """Connect to the docrepo database"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return conn
    except Exception as e:
        print(f"❌ Error connecting to docrepo database: {e}")
        return None

def drop_and_create_database():
    """Drop and recreate the docrepo database"""
    conn = connect_postgres()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Terminate all connections to the database
        cur.execute(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{DB_NAME}'
            AND pid <> pg_backend_pid()
        """)
        
        # Drop database if exists
        cur.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
        print(f"🗑️  Dropped database '{DB_NAME}'")
        
        # Create new database
        cur.execute(f"CREATE DATABASE {DB_NAME}")
        print(f"🆕 Created database '{DB_NAME}'")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error recreating database: {e}")
        return False

def run_setup_script():
    """Run the SQL setup script"""
    conn = connect_docrepo()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Read and execute the SQL setup script
        script_path = "database_setup.sql"
        if not os.path.exists(script_path):
            print(f"❌ Setup script not found: {script_path}")
            return False
        
        with open(script_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # Split script into individual statements and execute
        statements = sql_script.split(';')
        
        for i, statement in enumerate(statements):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cur.execute(statement)
                    # Fetch results for SELECT statements
                    if statement.upper().strip().startswith('SELECT'):
                        results = cur.fetchall()
                        if results:
                            for row in results:
                                print(f"  {row}")
                except Exception as e:
                    print(f"⚠️  Warning executing statement {i+1}: {e}")
                    continue
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Database setup script executed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error running setup script: {e}")
        return False

def verify_setup():
    """Verify that the database was set up correctly"""
    conn = connect_docrepo()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Check tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = cur.fetchall()
        
        print(f"\n📊 Database Tables Created ({len(tables)}):")
        for table in tables:
            print(f"  ✓ {table[0]}")
        
        # Check data
        cur.execute("SELECT COUNT(*) FROM departments")
        dept_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM roles")
        role_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM tags")
        tag_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM users")
        user_count = cur.fetchone()[0]
        
        print(f"\n📈 Initial Data:")
        print(f"  ✓ Departments: {dept_count}")
        print(f"  ✓ Roles: {role_count}")
        print(f"  ✓ Tags: {tag_count}")
        print(f"  ✓ Users: {user_count}")
        
        # Show admin user
        cur.execute("""
            SELECT u.email, u.first_name, u.last_name, d.name as department, r.name as role
            FROM users u
            JOIN departments d ON u.department_id = d.department_id
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.email = 'admin@docrepo.com'
        """)
        admin = cur.fetchone()
        if admin:
            print(f"\n👤 Admin User Created:")
            print(f"  Email: {admin[0]}")
            print(f"  Name: {admin[1]} {admin[2]}")
            print(f"  Department: {admin[3]}")
            print(f"  Role: {admin[4]}")
            print(f"  Password: admin123")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error verifying setup: {e}")
        return False

def main():
    """Main function to reset the database"""
    print("🚀 DocRepo Database Reset Tool")
    print("=" * 50)
    
    # Confirm reset
    confirm = input("⚠️  This will DELETE ALL DATA and recreate the database. Continue? (yes/no): ")
    if confirm.lower() not in ['yes', 'y']:
        print("❌ Reset cancelled.")
        return
    
    print("\n🔄 Starting database reset process...")
    
    # Step 1: Drop and recreate database
    if not drop_and_create_database():
        print("❌ Failed to recreate database. Exiting.")
        return
    
    # Step 2: Run setup script
    if not run_setup_script():
        print("❌ Failed to run setup script. Exiting.")
        return
    
    # Step 3: Verify setup
    if not verify_setup():
        print("❌ Failed to verify setup.")
        return
    
    print("\n🎉 Database reset completed successfully!")
    print("\n🔑 Login Information:")
    print("  Email: admin@docrepo.com")
    print("  Password: admin123")
    print("\n💡 You can now:")
    print("  1. Start the backend server")
    print("  2. Login with the admin credentials")
    print("  3. Upload test documents")
    print("  4. Test all functionality")

if __name__ == "__main__":
    main()
