@echo off
setlocal EnableExtensions

set "ERRATA_BUN_VERSION=1.4.2"
set "ERRATA_NODE_VERSION=22.23.2"

rem ============================================================================
rem Errata Windows source launcher
rem
rem Double-click start.bat from an unpacked Errata source checkout.
rem No preinstalled Git, Node.js, or Bun is required.
rem
rem First run:
rem   - Uses Windows PowerShell to install the project-pinned Bun version when needed.
rem   - Downloads a verified portable Node.js runtime when Node is missing.
rem   - Prepares project dependencies using the repository-standard Bun command.
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
  echo [Errata] ERROR: bun.lock was not found next to package.json.
  echo [Errata] This source checkout cannot reproduce its dependency graph.
  exit /b 1
)
exit /b 0

:find_bun
set "BUN_EXE="
if exist "%USERPROFILE%\.bun\bin\bun.exe" (
  set "BUN_EXE=%USERPROFILE%\.bun\bin\bun.exe"
  set "PATH=%USERPROFILE%\.bun\bin;%PATH%"
  exit /b 0
)

where bun >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%B in ('where bun 2^>nul') do (
    if not defined BUN_EXE set "BUN_EXE=%%~fB"
  )
)
if defined BUN_EXE exit /b 0
exit /b 1

:validate_bun_version
set "BUN_ACTUAL_VERSION="
for /f "usebackq delims=" %%V in (`"%BUN_EXE%" --version 2^>nul`) do (
  if not defined BUN_ACTUAL_VERSION set "BUN_ACTUAL_VERSION=%%V"
)
if not defined BUN_ACTUAL_VERSION exit /b 1
if not "%BUN_ACTUAL_VERSION%"=="%ERRATA_BUN_VERSION%" exit /b 1
exit /b 0

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
echo [Errata] Errata requires Bun %ERRATA_BUN_VERSION%.
echo [Errata] Setup will install that pinned version for the current Windows user
echo [Errata] from https://bun.sh/. Administrator rights are normally not required.
echo.

call :find_powershell
if errorlevel 1 (
  echo [Errata] ERROR: Windows PowerShell was not found.
  echo [Errata] A modern Windows installation with PowerShell is required
  echo [Errata] for automatic first-run setup.
  exit /b 1
)

echo [Errata] Installing Bun %ERRATA_BUN_VERSION%...
"%POWERSHELL_EXE%" -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; $installer=[scriptblock]::Create((Invoke-RestMethod 'https://bun.sh/install.ps1')); & $installer -Version $env:ERRATA_BUN_VERSION"
if errorlevel 1 (
  echo [Errata] ERROR: Bun installation failed.
  echo [Errata] Check your internet connection or security software and try again.
  exit /b 1
)

set "PATH=%USERPROFILE%\.bun\bin;%PATH%"
set "BUN_EXE=%USERPROFILE%\.bun\bin\bun.exe"
if not exist "%BUN_EXE%" (
  echo [Errata] ERROR: Bun installer finished, but bun.exe could not be found.
  echo [Errata] Expected location: "%BUN_EXE%"
  exit /b 1
)
call :validate_bun_version
if errorlevel 1 (
  echo [Errata] ERROR: Bun installer did not produce required version %ERRATA_BUN_VERSION%.
  exit /b 1
)

echo [Errata] Bun %ERRATA_BUN_VERSION% installed successfully.
exit /b 0

:resolve_node_runtime
set "ERRATA_NATIVE_ARCH=%PROCESSOR_ARCHITECTURE%"
if defined PROCESSOR_ARCHITEW6432 set "ERRATA_NATIVE_ARCH=%PROCESSOR_ARCHITEW6432%"
set "ERRATA_NODE_ARCH="
if /I "%ERRATA_NATIVE_ARCH%"=="AMD64" set "ERRATA_NODE_ARCH=x64"
if /I "%ERRATA_NATIVE_ARCH%"=="ARM64" set "ERRATA_NODE_ARCH=arm64"
if /I "%ERRATA_NATIVE_ARCH%"=="x86" set "ERRATA_NODE_ARCH=x86"
if not defined ERRATA_NODE_ARCH (
  echo [Errata] ERROR: Unsupported Windows architecture: %ERRATA_NATIVE_ARCH%
  exit /b 1
)

if defined LOCALAPPDATA (
  set "ERRATA_RUNTIME_ROOT=%LOCALAPPDATA%\Errata\runtime"
) else (
  set "ERRATA_RUNTIME_ROOT=%USERPROFILE%\.errata\runtime"
)
set "ERRATA_NODE_HOME=%ERRATA_RUNTIME_ROOT%\node-v%ERRATA_NODE_VERSION%-win-%ERRATA_NODE_ARCH%"
set "ERRATA_PORTABLE_NODE_EXE=%ERRATA_NODE_HOME%\node.exe"
exit /b 0

:find_node
set "NODE_EXE="
where node.exe >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%N in ('where node.exe 2^>nul') do (
    if not defined NODE_EXE set "NODE_EXE=%%~fN"
  )
)
if defined NODE_EXE exit /b 0

call :resolve_node_runtime
if errorlevel 1 exit /b 1
if exist "%ERRATA_PORTABLE_NODE_EXE%" (
  set "NODE_EXE=%ERRATA_PORTABLE_NODE_EXE%"
  set "PATH=%ERRATA_NODE_HOME%;%PATH%"
  exit /b 0
)
exit /b 1

:install_node
call :resolve_node_runtime
if errorlevel 1 exit /b 1

call :find_powershell
if errorlevel 1 (
  echo [Errata] ERROR: Windows PowerShell was not found.
  echo [Errata] PowerShell is required to download the portable Node.js runtime.
  exit /b 1
)

if not defined TEMP set "TEMP=%USERPROFILE%\AppData\Local\Temp"
if not exist "%TEMP%" mkdir "%TEMP%" >nul 2>&1

set "ERRATA_NODE_SHA256="
if /I "%ERRATA_NODE_ARCH%"=="x64" set "ERRATA_NODE_SHA256=1177b4137ba5adaa56354ae40f1080c7450e8ae09cecb47da459d1c52ac99f97"
if /I "%ERRATA_NODE_ARCH%"=="arm64" set "ERRATA_NODE_SHA256=fec025a6da31757e3b6af84c5a1628e9d38442ca99a2161091d78f2fcfa35ef3"
if /I "%ERRATA_NODE_ARCH%"=="x86" set "ERRATA_NODE_SHA256=725c9e2bdd1c2016b41c995a81f4fa36ce4e2ee565b7455d8f889182727df647"
if not defined ERRATA_NODE_SHA256 (
  echo [Errata] ERROR: No Node.js checksum is configured for %ERRATA_NODE_ARCH%.
  exit /b 1
)

set "ERRATA_NODE_ARCHIVE=node-v%ERRATA_NODE_VERSION%-win-%ERRATA_NODE_ARCH%.zip"
set "ERRATA_NODE_URL=https://nodejs.org/dist/v%ERRATA_NODE_VERSION%/%ERRATA_NODE_ARCHIVE%"
set "ERRATA_NODE_ZIP=%TEMP%\%ERRATA_NODE_ARCHIVE%"

echo.
echo [Errata] Node.js is not installed. First-run setup will download
echo [Errata] a private portable Node.js %ERRATA_NODE_VERSION% runtime from https://nodejs.org/.
echo [Errata] Administrator rights are not required.
echo [Errata] Downloading and verifying %ERRATA_NODE_ARCHIVE%...

"%POWERSHELL_EXE%" -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $root=Split-Path -Parent $env:ERRATA_NODE_HOME; New-Item -ItemType Directory -Force -Path $root | Out-Null; Invoke-WebRequest -UseBasicParsing -Uri $env:ERRATA_NODE_URL -OutFile $env:ERRATA_NODE_ZIP; $sha=[System.Security.Cryptography.SHA256]::Create(); $stream=[System.IO.File]::OpenRead($env:ERRATA_NODE_ZIP); try { $actual=([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-','').ToLowerInvariant() } finally { $stream.Dispose(); $sha.Dispose() }; $expected=($env:ERRATA_NODE_SHA256).ToLowerInvariant(); if($actual -ne $expected){ throw ('Node.js archive SHA256 mismatch. Expected '+$expected+' but got '+$actual) }; if(Test-Path -LiteralPath $env:ERRATA_NODE_HOME){ Remove-Item -LiteralPath $env:ERRATA_NODE_HOME -Recurse -Force }; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory($env:ERRATA_NODE_ZIP,$root); Remove-Item -LiteralPath $env:ERRATA_NODE_ZIP -Force -ErrorAction SilentlyContinue; if(-not(Test-Path -LiteralPath (Join-Path $env:ERRATA_NODE_HOME 'node.exe'))){ throw 'node.exe was not found after extraction' }"
if errorlevel 1 (
  echo [Errata] ERROR: Portable Node.js setup failed.
  echo [Errata] Check your internet connection or security software and try again.
  exit /b 1
)

set "PATH=%ERRATA_NODE_HOME%;%PATH%"
call :find_node
if errorlevel 1 (
  echo [Errata] ERROR: Node.js setup finished, but node.exe could not be found.
  echo [Errata] Expected location: "%ERRATA_PORTABLE_NODE_EXE%"
  exit /b 1
)

echo [Errata] Portable Node.js installed successfully.
exit /b 0

:prepare
call :validate_repo
if errorlevel 1 goto :fatal

if not defined DATA_DIR set "DATA_DIR=%CD%\data"

call :find_bun
if errorlevel 1 (
  call :install_bun
  if errorlevel 1 goto :fatal
) else (
  call :validate_bun_version
  if errorlevel 1 (
    echo.
    echo [Errata] Installed Bun does not match required version %ERRATA_BUN_VERSION%.
    call :install_bun
    if errorlevel 1 goto :fatal
  )
)

echo.
echo [Errata] Bun: "%BUN_EXE%" ^(%ERRATA_BUN_VERSION%^)
call :validate_bun_version
if errorlevel 1 (
  echo [Errata] ERROR: Required Bun %ERRATA_BUN_VERSION% could not be verified.
  goto :fatal
)

call :find_node
if errorlevel 1 (
  call :install_node
  if errorlevel 1 goto :fatal
)

echo [Errata] Node.js: "%NODE_EXE%"
"%NODE_EXE%" --version
if errorlevel 1 (
  echo [Errata] ERROR: Node.js was found but could not execute.
  goto :fatal
)

if not exist "bun.lock" (
  echo [Errata] ERROR: bun.lock is missing.
  echo [Errata] This checkout cannot perform a reproducible dependency install.
  goto :fatal
)

echo.
echo [Errata] Verifying locked dependencies...
echo [Errata] Bun will reuse current packages when they already match bun.lock.
"%BUN_EXE%" install --frozen-lockfile
if errorlevel 1 (
  echo.
  echo [Errata] ERROR: Locked dependency installation failed.
  echo [Errata] package.json and bun.lock may be inconsistent, or files may be in use.
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
set "ERRATA_EXIT=%ERRORLEVEL%"
if not "%ERRATA_EXIT%"=="0" (
  echo.
  echo [Errata] ERROR: Errata desktop mode exited with code %ERRATA_EXIT%.
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
set "ERRATA_EXIT=%ERRORLEVEL%"
if not "%ERRATA_EXIT%"=="0" (
  echo.
  echo [Errata] ERROR: Errata web mode exited with code %ERRATA_EXIT%.
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

set "BUN_AVAILABLE=1"
call :find_bun
if errorlevel 1 (
  set "BUN_AVAILABLE=0"
  echo [Errata] Bun: NOT INSTALLED
  echo [Errata] Default desktop/web mode will install Bun %ERRATA_BUN_VERSION% when PowerShell is available.
) else (
  call :validate_bun_version
  if errorlevel 1 (
    echo [Errata] ERROR: Installed Bun does not match required version %ERRATA_BUN_VERSION%.
    echo [Errata] Default desktop/web mode can install the pinned version automatically.
    exit /b 1
  )
  echo [Errata] Bun: "%BUN_EXE%" ^(%ERRATA_BUN_VERSION%^)
)

set "NODE_AVAILABLE=1"
call :find_node
if errorlevel 1 (
  set "NODE_AVAILABLE=0"
  echo [Errata] Node.js: NOT INSTALLED
  echo [Errata] Default desktop/web mode will download a verified portable runtime when PowerShell is available.
) else (
  echo [Errata] Node.js: "%NODE_EXE%"
  "%NODE_EXE%" --version
  if errorlevel 1 (
    echo [Errata] ERROR: Node.js exists but could not execute.
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
  if "%BUN_AVAILABLE%"=="0" (
    echo [Errata] ERROR: Bun is missing and automatic first-run setup requires PowerShell.
    exit /b 1
  )
  if "%NODE_AVAILABLE%"=="0" (
    echo [Errata] ERROR: Node.js is missing and automatic first-run setup requires PowerShell.
    exit /b 1
  )
  echo [Errata] Bun and Node.js are already available, so PowerShell is not required for this run.
) else (
  echo [Errata] PowerShell: available
)

echo [Errata] Source data directory: "%DATA_DIR%"
echo [Errata] Dev URL: http://localhost:7739
echo [Errata] Launcher check passed.
exit /b 0
:usage
echo Usage:
echo   start.bat          Start Errata desktop mode; bootstraps Bun/Node/dependencies if needed
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
exit /b %ERRATA_EXIT%

:fatal
set "ERRATA_EXIT=1"
goto :fatal_code