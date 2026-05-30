@echo off
echo.
echo ========================================
echo   SANARCH - Build Development Client
echo ========================================
echo.

echo This will build the app with Firebase support.
echo.
echo IMPORTANT: You need an Android emulator running or device connected!
echo.
echo Press Ctrl+C to cancel, or any key to check devices...
pause > nul

echo.
echo Checking for Android devices...
adb devices
echo.

echo If no devices listed above:
echo   1. Open Android Studio
echo   2. Tools ^> Device Manager
echo   3. Click Play button on an emulator
echo   4. Wait for emulator to fully boot
echo   5. Run this script again
echo.
echo Press Ctrl+C to cancel, or any key to continue with build...
pause > nul

echo.
echo ========================================
echo   Building Development Client
echo ========================================
echo.

cd frontend

echo Step 1: Cleaning cache...
call npx expo start --clear
timeout /t 2 > nul

echo.
echo Step 2: Generating native folders (prebuild)...
echo This may take a few minutes...
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
echo Step 3: Building and installing on Android...
echo This will take 5-10 minutes on first build...
echo.
call npx expo run:android

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo.
    echo Common issues:
    echo   1. No emulator running - start one from Android Studio
    echo   2. Android SDK not configured - check ANDROID_HOME
    echo   3. Build errors - check the output above
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo The app is now running on your device/emulator.
echo Metro bundler is running in this window.
echo.
echo To stop: Press Ctrl+C
echo.
pause
