#!/usr/bin/env python3
"""
Database Query Tool for DocRepo
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import sys

def connect_to_db():
    """Connect to the PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            'postgresql://postgres:M2002FoAFG@localhost:5432/docrepo',
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def list_tables():
    """List all tables in the database"""
    conn = connect_to_db()
    if not conn:
        return
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = cur.fetchall()
        
        print("📊 Available Tables:")
        print("=" * 40)
        for table in tables:
            print(f"  - {table['table_name']}")
        
        cur.close()
        conn.close()
        print()
        
    except Exception as e:
        print(f"Error listing tables: {e}")

def run_query(query, description="Query"):
    """Run a SQL query and display results"""
    conn = connect_to_db()
    if not conn:
        return
    
    try:
        cur = conn.cursor()
        cur.execute(query)
        
        if query.strip().upper().startswith('SELECT'):
            results = cur.fetchall()
            print(f"🔍 {description}")
            print("=" * 50)
            
            if results:
                # Print column headers
                if results:
                    headers = list(results[0].keys())
                    header_line = " | ".join(f"{h:20}" for h in headers)
                    print(header_line)
                    print("-" * len(header_line))
                    
                    # Print data rows
                    for row in results:
                        row_line = " | ".join(f"{str(row[h])[:20]:20}" for h in headers)
                        print(row_line)
                print(f"\n📈 Total rows: {len(results)}")
            else:
                print("No results found.")
        else:
            conn.commit()
            print(f"✅ {description} - Query executed successfully")
        
        cur.close()
        conn.close()
        print()
        
    except Exception as e:
        print(f"❌ Error running query: {e}")
        print()

def main():
    """Main function to demonstrate database queries"""
    print("🚀 DocRepo Database Query Tool")
    print("=" * 50)
    
    # List all tables
    list_tables()
    
    # Query 1: Show all users with their departments and roles
    run_query("""
        SELECT 
            u.user_id,
            u.first_name,
            u.last_name,
            u.email,
            d.name as department,
            r.name as role,
            u.created_at
        FROM users u
        JOIN departments d ON u.department_id = d.department_id
        JOIN roles r ON u.role_id = r.role_id
        ORDER BY u.created_at DESC
    """, "Query 1: All Users with Departments and Roles")
    
    # Query 2: Show all documents with current versions
    run_query("""
        SELECT 
            doc.document_id,
            doc.title,
            doc.description,
            u.first_name || ' ' || u.last_name as created_by,
            dv.version_number,
            dv.file_name,
            dv.file_size,
            doc.created_at
        FROM documents doc
        JOIN users u ON doc.created_by = u.user_id
        LEFT JOIN document_versions dv ON doc.document_id = dv.document_id AND dv.is_current = true
        ORDER BY doc.created_at DESC
    """, "Query 2: All Documents with Current Versions")
    
    # Query 3: Show document version history
    run_query("""
        SELECT 
            doc.title,
            dv.version_number,
            dv.file_name,
            dv.file_size,
            dv.is_current,
            u.first_name || ' ' || u.last_name as uploaded_by,
            dv.uploaded_at
        FROM document_versions dv
        JOIN documents doc ON dv.document_id = doc.document_id
        JOIN users u ON dv.uploaded_by = u.user_id
        ORDER BY doc.title, dv.version_number DESC
    """, "Query 3: Document Version History")
    
    # Query 4: Show tags and their usage
    run_query("""
        SELECT 
            t.name as tag_name,
            COUNT(dt.document_id) as document_count,
            t.created_at
        FROM tags t
        LEFT JOIN document_tags dt ON t.tag_id = dt.tag_id
        GROUP BY t.tag_id, t.name, t.created_at
        ORDER BY document_count DESC, t.name
    """, "Query 4: Tags and Their Usage Statistics")

if __name__ == "__main__":
    main()
