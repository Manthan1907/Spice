@echo off
echo ========================================
echo     RizzRetro AI - APK Builder
echo ========================================
echo.

echo Step 1: Building web assets...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build web assets
    pause
    exit /b 1
)

echo.
echo Step 2: Copying to Android project...
call npx cap copy android
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy assets
    pause
    exit /b 1
)

echo.
echo Step 3: Syncing Android project...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Failed to sync project
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Android project is ready!
echo ========================================
echo.
echo To build APK, you have 2 options:
echo.
echo OPTION 1 - Install Android Studio:
echo   1. Download: https://developer.android.com/studio
echo   2. Install with default settings
echo   3. Open: %cd%\android folder
echo   4. Build APK: Build → Build Bundle(s) / APK(s) → Build APK(s)
echo.
echo OPTION 2 - Use Online APK Builder:
echo   1. Zip the 'android' folder
echo   2. Upload to: https://www.apeaksoft.com/build-apk-online/
echo   3. Download the built APK
echo.
echo APK will be saved in: android\app\build\outputs\apk\debug\
echo.
pause

