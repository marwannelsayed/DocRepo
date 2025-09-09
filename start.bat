@echo off
echo Starting Document Repository Application...
echo ========================================

echo Please ensure PostgreSQL is running and the database is set up.
echo.

echo Starting FastAPI backend...
cd backend
start "FastAPI Backend" cmd /k "C:/Users/Yasmine/AppData/Local/Microsoft/WindowsApps/python3.13.exe -m uvicorn main:app --reload --port 8080"
cd ..

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting React frontend...
cd frontend
start "React Frontend" cmd /k "npm start"
cd ..

echo.
echo Application starting...
echo Backend will be available at: http://localhost:8080
echo Frontend will be available at: http://localhost:3000
echo API Documentation at: http://localhost:8080/docs
echo.
pause
