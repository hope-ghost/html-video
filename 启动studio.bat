@echo off
cd /d "%~dp0"

set "PORT=3071"
set "URL=http://127.0.0.1:%PORT%/"

REM Optional: prepend bundled ffmpeg-static to PATH (ignore if node_modules missing)
for /f "delims=" %%i in ('node -p "require(''ffmpeg-static'')" 2^>nul') do (
  if exist "%%~fi" set "PATH=%%~dpi;%PATH%"
)

REM If Studio is already listening, open browser instead of crashing
set "OLD_PID="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr "127.0.0.1:%PORT%" ^| findstr "LISTENING"') do set "OLD_PID=%%p"
if defined OLD_PID (
  echo ========================================
  echo   html-video Studio is already running
  echo   %URL%
  echo   PID: %OLD_PID%
  echo ========================================
  echo.
  echo Opening browser...
  start "" "%URL%"
  echo.
  echo To force restart: taskkill /PID %OLD_PID% /F
  echo.
  pause
  exit /b 0
)

echo ========================================
echo   html-video Studio
echo   %URL%
echo ========================================
echo.

if not exist "%~dp0packages\cli\dist\bin.js" (
  echo ERROR: packages\cli\dist\bin.js not found.
  echo Run: pnpm install ^&^& pnpm -r build
  echo.
  pause
  exit /b 1
)

node "%~dp0packages\cli\dist\bin.js" studio --port %PORT%
if errorlevel 1 (
  echo.
  echo Startup failed. If the port is in use, try: %URL%
  echo.
)

pause
