@echo off
echo ========================================
echo   SANARCH Frontend Startup
echo ========================================
echo.

cd frontend

echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js and try again
    pause
    exit /b 1
)

echo.
echo Checking if backend is running...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Backend is not running!
    echo Please start the backend first using start-backend.bat
    echo.
    echo Press any key to continue anyway, or Ctrl+C to cancel...
    pause >nul
)

echo.
echo Starting Expo development server...
echo.
echo IMPORTANT:
echo   - For Android Emulator: Make sure emulator is running
echo   - For Physical Device: Make sure device is connected via USB
echo   - Firebase requires development build: npx expo run:android
echo.
echo Press 'a' to open on Android
echo Press 'i' to open on iOS (Mac only)
echo Press 'w' to open in web browser
echo.

npx expo start

pause
