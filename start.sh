#!/bin/bash

# Document Repository Startup Script

echo "Starting Document Repository Application..."
echo "========================================"

# Check if PostgreSQL is running
echo "Please ensure PostgreSQL is running and the database is set up."
echo ""

# Start backend
echo "Starting FastAPI backend..."
cd backend
start cmd /k "C:/Users/Yasmine/AppData/Local/Microsoft/WindowsApps/python3.13.exe -m uvicorn main:app --reload"
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting React frontend..."
cd frontend
start cmd /k "npm start"
cd ..

echo ""
echo "Application starting..."
echo "Backend will be available at: http://localhost:8000"
echo "Frontend will be available at: http://localhost:3000"
echo "API Documentation at: http://localhost:8000/docs"
echo ""
echo "Press any key to continue..."
read -n 1
