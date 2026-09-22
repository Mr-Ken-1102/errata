@echo off
setlocal EnableExtensions

cd /d "%~dp0" || (
  echo [Errata] Could not enter the repository directory.
  exit /b 1
)

if not exist "package.json" (
  echo [Errata] package.json was not found next to start.bat.
  echo [Errata] Keep start.bat in the Errata repository root.
  exit /b 1
)

where bun >nul 2>&1
if errorlevel 1 (
  echo [Errata] Bun is required but was not found on PATH.
  echo [Errata] Install Bun, reopen this window, then run start.bat again.
  exit /b 1
)

if not defined DATA_DIR set "DATA_DIR=%CD%\data"
if not defined PORT set "PORT=7739"

set "ERRATA_MODE=%~1"
if "%ERRATA_MODE%"=="" set "ERRATA_MODE=desktop"

if /I "%ERRATA_MODE%"=="check" goto :check
if /I "%ERRATA_MODE%"=="desktop" goto :desktop
if /I "%ERRATA_MODE%"=="web" goto :web
if /I "%ERRATA_MODE%"=="help" goto :usage
if /I "%ERRATA_MODE%"=="--help" goto :usage
if /I "%ERRATA_MODE%"=="-h" goto :usage

echo [Errata] Unknown mode: %ERRATA_MODE%
goto :usage_error

:check
for %%F in ("scripts\electron-dev.mjs" "desktop\main.ts" "desktop\preload.ts" "electron-builder.yml") do (
  if not exist "%%~F" (
    echo [Errata] Missing required file: %%~F
    exit /b 1
  )
)

bun --version >nul 2>&1
if errorlevel 1 (
  echo [Errata] Bun exists on PATH but could not execute.
  exit /b 1
)

echo [Errata] Windows source launcher check passed.
echo [Errata] Source data directory: "%DATA_DIR%"
echo [Errata] Dev port: %PORT%
exit /b 0

:desktop
echo [Errata] Starting desktop development mode...
echo [Errata] Source data directory: "%DATA_DIR%"
echo [Errata] This source checkout does not use the installed Electron app data directory.
call bun run electron:dev
set "ERRATA_EXIT=%ERRORLEVEL%"
exit /b %ERRATA_EXIT%

:web
echo [Errata] Starting browser development mode on port %PORT%...
echo [Errata] Source data directory: "%DATA_DIR%"
call bun run dev
set "ERRATA_EXIT=%ERRORLEVEL%"
exit /b %ERRATA_EXIT%

:usage
echo Usage:
echo   start.bat          Start Electron desktop development mode
echo   start.bat desktop  Same as the default
echo   start.bat web      Start the browser development server
echo   start.bat check    Validate the Windows source launcher without starting Errata
exit /b 0

:usage_error
echo Usage:
echo   start.bat [desktop^|web^|check^|help]
exit /b 2
