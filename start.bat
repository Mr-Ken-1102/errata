@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ============================================================================
rem Errata Windows source launcher
rem
rem Double-click start.bat from an unpacked Errata source checkout.
rem No preinstalled Git, Node.js, or Bun is required.
rem
rem First run:
rem   - Uses Windows PowerShell to install Bun for the current user when missing.
rem   - Installs the exact dependencies locked by bun.lock.
rem   - Starts the Electron desktop development shell.
rem
rem Modes:
rem   start.bat          Desktop mode (default)
rem   start.bat desktop  Desktop mode
rem   start.bat web      Browser mode on http://localhost:7739
rem   start.bat check    Diagnostics only; never installs anything
rem   start.bat help     Show usage
rem
rem Set ERRATA_NO_PAUSE=1 to suppress the error pause for automation.
rem ============================================================================

cd /d "%~dp0" || (
  echo [Errata] ERROR: Could not enter the folder containing start.bat.
  goto :fatal
)

set "ERRATA_MODE=%~1"
if "%ERRATA_MODE%"=="" set "ERRATA_MODE=desktop"

if /I "%ERRATA_MODE%"=="help" goto :usage
if /I "%ERRATA_MODE%"=="--help" goto :usage
if /I "%ERRATA_MODE%"=="-h" goto :usage
if /I "%ERRATA_MODE%"=="check" goto :check
if /I "%ERRATA_MODE%"=="desktop" goto :prepare
if /I "%ERRATA_MODE%"=="web" goto :prepare

echo [Errata] ERROR: Unknown mode: %ERRATA_MODE%
goto :usage_error

:validate_repo
if not exist "package.json" (
  echo [Errata] ERROR: package.json was not found next to start.bat.
  echo [Errata] Keep start.bat in the root of the Errata source folder.
  exit /b 1
)
if not exist "bun.lock" (
  echo [Errata] ERROR: bun.lock was not found.
  echo [Errata] The source checkout appears incomplete.
  exit /b 1
)
exit /b 0

:find_bun
set "BUN_EXE="
where bun >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%B in ('where bun 2^>nul') do (
    if not defined BUN_EXE set "BUN_EXE=%%~fB"
  )
)
if defined BUN_EXE exit /b 0

if exist "%USERPROFILE%\.bun\bin\bun.exe" (
  set "BUN_EXE=%USERPROFILE%\.bun\bin\bun.exe"
  set "PATH=%USERPROFILE%\.bun\bin;%PATH%"
  exit /b 0
)
exit /b 1

:find_powershell
set "POWERSHELL_EXE="
if exist "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" (
  set "POWERSHELL_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
  exit /b 0
)
where powershell.exe >nul 2>&1
if not errorlevel 1 (
  set "POWERSHELL_EXE=powershell.exe"
  exit /b 0
)
where pwsh.exe >nul 2>&1
if not errorlevel 1 (
  set "POWERSHELL_EXE=pwsh.exe"
  exit /b 0
)
exit /b 1

:install_bun
echo.
echo [Errata] Bun is not installed. First-run setup will install Bun
echo [Errata] for the current Windows user from https://bun.sh/.
echo [Errata] Administrator rights are normally not required.
echo.

call :find_powershell
if errorlevel 1 (
  echo [Errata] ERROR: Windows PowerShell was not found.
  echo [Errata] A modern Windows installation with PowerShell is required
  echo [Errata] for automatic first-run setup.
  exit /b 1
)

echo [Errata] Installing Bun...
"%POWERSHELL_EXE%" -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; Invoke-RestMethod 'https://bun.sh/install.ps1' | Invoke-Expression"
if errorlevel 1 (
  echo [Errata] ERROR: Bun installation failed.
  echo [Errata] Check your internet connection or security software and try again.
  exit /b 1
)

set "PATH=%USERPROFILE%\.bun\bin;%PATH%"
call :find_bun
if errorlevel 1 (
  echo [Errata] ERROR: Bun installer finished, but bun.exe could not be found.
  echo [Errata] Expected location: "%USERPROFILE%\.bun\bin\bun.exe"
  exit /b 1
)

echo [Errata] Bun installed successfully.
exit /b 0

:prepare
call :validate_repo
if errorlevel 1 goto :fatal

if not defined DATA_DIR set "DATA_DIR=%CD%\data"

call :find_bun
if errorlevel 1 (
  call :install_bun
  if errorlevel 1 goto :fatal
)

echo.
echo [Errata] Bun: "%BUN_EXE%"
"%BUN_EXE%" --version
if errorlevel 1 (
  echo [Errata] ERROR: Bun was found but could not execute.
  goto :fatal
)

echo.
echo [Errata] Preparing dependencies...
echo [Errata] This may take a few minutes on the first run.
"%BUN_EXE%" install --frozen-lockfile
if errorlevel 1 (
  echo.
  echo [Errata] ERROR: Dependency installation failed.
  echo [Errata] Check your internet connection and available disk space.
  goto :fatal
)

if /I "%ERRATA_MODE%"=="web" goto :web
goto :desktop

:desktop
for %%F in ("scripts\electron-dev.mjs" "desktop\main.ts" "desktop\preload.ts" "electron-builder.yml") do (
  if not exist "%%~F" (
    echo [Errata] ERROR: Missing required desktop file: %%~F
    goto :fatal
  )
)

echo.
echo [Errata] Starting Errata desktop mode...
echo [Errata] Source data directory: "%DATA_DIR%"
echo [Errata] The first launch can take longer while the app is compiled.
echo.
"%BUN_EXE%" run electron:dev
set "ERRATA_EXIT=!ERRORLEVEL!"
if not "!ERRATA_EXIT!"=="0" (
  echo.
  echo [Errata] ERROR: Errata desktop mode exited with code !ERRATA_EXIT!.
  goto :fatal_code
)

echo.
echo [Errata] Errata closed normally.
exit /b 0

:web
echo.
echo [Errata] Starting Errata web mode...
echo [Errata] URL: http://localhost:7739
echo [Errata] Source data directory: "%DATA_DIR%"
echo.
"%BUN_EXE%" run dev
set "ERRATA_EXIT=!ERRORLEVEL!"
if not "!ERRATA_EXIT!"=="0" (
  echo.
  echo [Errata] ERROR: Errata web mode exited with code !ERRATA_EXIT!.
  goto :fatal_code
)

echo.
echo [Errata] Errata web server stopped normally.
exit /b 0

:check
call :validate_repo
if errorlevel 1 exit /b 1

if not defined DATA_DIR set "DATA_DIR=%CD%\data"

echo [Errata] Checking Windows source launcher...
echo [Errata] Repository: "%CD%"

call :find_bun
if errorlevel 1 (
  echo [Errata] Bun: NOT INSTALLED
  echo [Errata] Default desktop/web mode will install it automatically.
) else (
  echo [Errata] Bun: "%BUN_EXE%"
  "%BUN_EXE%" --version
  if errorlevel 1 (
    echo [Errata] ERROR: Bun exists but could not execute.
    exit /b 1
  )
)

for %%F in ("scripts\electron-dev.mjs" "desktop\main.ts" "desktop\preload.ts" "electron-builder.yml") do (
  if not exist "%%~F" (
    echo [Errata] ERROR: Missing required file: %%~F
    exit /b 1
  )
)

call :find_powershell
if errorlevel 1 (
  echo [Errata] PowerShell: NOT FOUND
  echo [Errata] Automatic Bun installation will not be available.
) else (
  echo [Errata] PowerShell: available
)

echo [Errata] Source data directory: "%DATA_DIR%"
echo [Errata] Dev URL: http://localhost:7739
echo [Errata] Launcher check passed.
exit /b 0

:usage
echo Usage:
echo   start.bat          Start Errata desktop mode; installs Bun/dependencies if needed
echo   start.bat desktop  Same as the default
echo   start.bat web      Start browser mode on http://localhost:7739
echo   start.bat check    Diagnostics only; does not install anything
echo   start.bat help     Show this help
exit /b 0

:usage_error
echo.
echo Usage:
echo   start.bat [desktop^|web^|check^|help]
exit /b 2

:fatal_code
if not defined ERRATA_EXIT set "ERRATA_EXIT=1"
if not defined ERRATA_NO_PAUSE (
  echo.
  echo [Errata] Press any key to close this window.
  pause >nul
)
exit /b !ERRATA_EXIT!

:fatal
set "ERRATA_EXIT=1"
goto :fatal_code
