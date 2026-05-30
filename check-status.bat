@echo off
echo.
echo ========================================
echo   SANARCH App - Status Check
echo ========================================
echo.

echo [1/5] Checking Android Devices...
adb devices
if %errorlevel% neq 0 (
    echo   ^> ERROR: ADB not found. Install Android Studio.
) else (
    echo   ^> OK: ADB found
)
echo.

echo [2/5] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo   ^> ERROR: Node.js not found
) else (
    echo   ^> OK: Node.js installed
)
echo.

echo [3/5] Checking Python...
python --version
if %errorlevel% neq 0 (
    echo   ^> ERROR: Python not found
) else (
    echo   ^> OK: Python installed
)
echo.

echo [4/5] Checking Docker...
docker --version
if %errorlevel% neq 0 (
    echo   ^> WARNING: Docker not running (OK if using production backend)
) else (
    echo   ^> OK: Docker installed
)
echo.

echo [5/5] Checking Environment Files...
if exist "frontend\.env" (
    echo   ^> OK: frontend/.env exists
) else (
    echo   ^> ERROR: frontend/.env not found
)

if exist "backend\.env" (
    echo   ^> OK: backend/.env exists
) else (
    echo   ^> ERROR: backend/.env not found
)
echo.

echo ========================================
echo   Current Configuration
echo ========================================
echo.
echo Frontend API URL:
type frontend\.env | findstr EXPO_PUBLIC_API_URL
echo.

echo ========================================
echo   Next Steps
echo ========================================
echo.
echo 1. Start Android emulator (or connect device)
echo 2. Run: cd frontend
echo 3. Run: npx expo run:android
echo.
echo First build takes 5-10 minutes.
echo.
echo For detailed instructions, see:
echo   - CURRENT_STATUS.md
echo   - START_APP.md
echo.
pause
