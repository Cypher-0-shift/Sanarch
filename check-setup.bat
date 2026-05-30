@echo off
echo ========================================
echo   SANARCH Environment Check
echo ========================================
echo.

set "errors=0"

echo Checking prerequisites...
echo.

REM Check Python
echo [1/6] Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python --version
    echo    ✓ Python installed
) else (
    echo    ✗ Python NOT installed
    set /a errors+=1
)
echo.

REM Check Node.js
echo [2/6] Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    node --version
    echo    ✓ Node.js installed
) else (
    echo    ✗ Node.js NOT installed
    set /a errors+=1
)
echo.

REM Check npm
echo [3/6] npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    npm --version
    echo    ✓ npm installed
) else (
    echo    ✗ npm NOT installed
    set /a errors+=1
)
echo.

REM Check Docker
echo [4/6] Docker...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    docker --version
    echo    ✓ Docker installed
) else (
    echo    ✗ Docker NOT installed
    set /a errors+=1
)
echo.

REM Check Backend .env
echo [5/6] Backend .env file...
if exist "backend\.env" (
    echo    ✓ backend\.env exists
) else (
    echo    ✗ backend\.env NOT found
    echo    → Copy backend\.env.example to backend\.env
    set /a errors+=1
)
echo.

REM Check Frontend .env
echo [6/6] Frontend .env file...
if exist "frontend\.env" (
    echo    ✓ frontend\.env exists
    type frontend\.env | findstr "EXPO_PUBLIC_API_URL" >nul
    if %errorlevel% equ 0 (
        echo    ✓ API URL configured
    ) else (
        echo    ⚠ API URL not configured
    )
) else (
    echo    ✗ frontend\.env NOT found
    echo    → Copy frontend\.env.example to frontend\.env
    set /a errors+=1
)
echo.

REM Check Firebase config
echo [Bonus] Firebase Configuration...
if exist "frontend\android\app\google-services.json" (
    echo    ✓ google-services.json exists
) else (
    echo    ⚠ google-services.json NOT found
    echo    → Download from Firebase Console
)
echo.

REM Check if backend dependencies installed
echo [Bonus] Backend Dependencies...
if exist "backend\venv" (
    echo    ✓ Python virtual environment exists
) else (
    echo    ⚠ Virtual environment not found
    echo    → Run: cd backend && python -m venv venv
)
echo.

REM Check if frontend dependencies installed
echo [Bonus] Frontend Dependencies...
if exist "frontend\node_modules" (
    echo    ✓ Node modules installed
) else (
    echo    ⚠ Node modules not found
    echo    → Run: cd frontend && npm install
)
echo.

echo ========================================
if %errors% equ 0 (
    echo   ✓ All checks passed!
    echo   You're ready to start the app.
    echo.
    echo   Run: start-all.bat
) else (
    echo   ✗ %errors% error(s) found
    echo   Please fix the issues above.
)
echo ========================================
echo.
pause
