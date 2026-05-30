@echo off
echo ========================================
echo   SANARCH Backend Startup
echo ========================================
echo.

cd backend

echo Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop and try again
    pause
    exit /b 1
)

echo.
echo Starting backend services with Docker Compose...
echo This will start:
echo   - PostgreSQL (Database)
echo   - Redis (Task Queue)
echo   - ClamAV (Virus Scanner)
echo   - Backend API (Port 8000)
echo   - Celery Worker (Background Tasks)
echo.

docker-compose up -d

echo.
echo Waiting for services to start...
timeout /t 5 /nobreak >nul

echo.
echo Checking service status...
docker-compose ps

echo.
echo ========================================
echo   Backend Started Successfully!
echo ========================================
echo.
echo API Documentation: http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause
