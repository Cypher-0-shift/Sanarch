@echo off
echo ========================================
echo   SANARCH Full Stack Startup
echo ========================================
echo.

echo Step 1: Starting Backend Services...
echo.
start "SANARCH Backend" cmd /k "cd backend && docker-compose up"

echo Waiting for backend to initialize...
timeout /t 10 /nobreak >nul

echo.
echo Step 2: Starting Frontend...
echo.
start "SANARCH Frontend" cmd /k "cd frontend && npx expo start"

echo.
echo ========================================
echo   Both services are starting!
echo ========================================
echo.
echo Backend: http://localhost:8000/docs
echo Frontend: Check the Metro bundler window
echo.
echo Two new windows have opened:
echo   1. Backend (Docker Compose logs)
echo   2. Frontend (Expo Metro bundler)
echo.
echo To stop everything:
echo   - Close both windows
echo   - Run: cd backend && docker-compose down
echo.
pause
