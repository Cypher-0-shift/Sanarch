@echo off
echo.
echo ========================================
echo   SANARCH App - Build and Run
echo ========================================
echo.

echo Checking for Android devices...
adb devices
echo.

echo If no devices listed above:
echo   1. Open Android Studio
echo   2. Start an emulator from AVD Manager
echo   3. OR connect physical device via USB
echo.
echo Press any key to continue (or Ctrl+C to cancel)...
pause > nul
echo.

echo ========================================
echo   Building App (First Time: 5-10 min)
echo ========================================
echo.

cd frontend

echo Step 1: Cleaning previous builds...
if exist android (
    echo   Removing old android folder...
    rmdir /s /q android
)
if exist ios (
    echo   Removing old ios folder...
    rmdir /s /q ios
)
echo.

echo Step 2: Generating native folders...
echo   This may take a few minutes...
call npx expo prebuild --clean
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Prebuild failed!
    echo.
    echo Try:
    echo   1. Delete node_modules: rmdir /s /q node_modules
    echo   2. Reinstall: npm install
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)
echo.

echo Step 3: Building and running on Android...
echo   This will take 5-10 minutes on first build...
echo   The app will install automatically when done.
echo.
call npx expo run:android
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo.
    echo Common fixes:
    echo   1. Ensure Android emulator is running
    echo   2. Check Android Studio is installed
    echo   3. Check ANDROID_HOME environment variable
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo The app should now be running on your device/emulator.
echo Metro bundler is running in this window.
echo.
echo To stop: Press Ctrl+C
echo.
echo Next time, you can just run:
echo   cd frontend
echo   npx expo run:android
echo.
pause
