#Requires -Version 5.1
<#
.SYNOPSIS
    One-click setup for Errata development environment.
.DESCRIPTION
    Installs Git and Bun if missing, clones/pulls the repository,
    installs dependencies, and starts the dev server.
.NOTES
    Run from any directory:
      irm https://raw.githubusercontent.com/Mr-Ken-1102/errata/master/scripts/setup.ps1 | iex
    Or locally:
      powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
#>

$ErrorActionPreference = 'Stop'
$BunVersion = '1.4.2'
$RepoUrl = 'https://github.com/Mr-Ken-1102/errata.git'
$RepoDir = 'errata'

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }

# --- Git ---
Write-Step 'Checking for Git...'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host 'Git not found. Installing via winget...'
    winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
    # Refresh PATH so git is available in this session
    $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [System.Environment]::GetEnvironmentVariable('Path', 'User')
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error 'Git installation succeeded but git is still not on PATH. Please restart your terminal and run this script again.'
        exit 1
    }
    Write-Host 'Git installed.' -ForegroundColor Green
} else {
    Write-Host "Git found: $(git --version)"
}

# --- Bun ---
Write-Step "Checking for Bun $BunVersion..."
$bunCommand = Get-Command bun -ErrorAction SilentlyContinue
$bunVersion = if ($bunCommand) { (& bun --version).Trim() } else { $null }

if ($bunVersion -ne $BunVersion) {
    if ($bunVersion) {
        Write-Host "Bun $bunVersion found; installing the project-pinned Bun $BunVersion..."
    } else {
        Write-Host "Bun not found. Installing project-pinned Bun $BunVersion..."
    }

    $installerText = Invoke-RestMethod 'https://bun.sh/install.ps1'
    $installer = [scriptblock]::Create($installerText)
    & $installer -Version $BunVersion

    # Prefer the project-pinned user installation even if another Bun exists
    # earlier in the machine PATH.
    $bunBin = Join-Path $HOME '.bun\bin'
    $env:Path = $bunBin + ';' +
                [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [System.Environment]::GetEnvironmentVariable('Path', 'User')

    $bunCommand = Get-Command bun -ErrorAction SilentlyContinue
    $bunVersion = if ($bunCommand) { (& bun --version).Trim() } else { $null }
    if ($bunVersion -ne $BunVersion) {
        Write-Error "Expected Bun $BunVersion after installation, but found '$bunVersion'."
        exit 1
    }
}

Write-Host "Bun ready: $bunVersion" -ForegroundColor Green

# --- Repository ---
Write-Step 'Setting up repository...'

# Detect if we're already inside the errata repo
$insideRepo = $false
try {
    $toplevel = git rev-parse --show-toplevel 2>$null
    if ($toplevel -and (Test-Path (Join-Path $toplevel 'package.json'))) {
        $pkg = Get-Content (Join-Path $toplevel 'package.json') -Raw | ConvertFrom-Json
        if ($pkg.name -eq 'errata') {
            $insideRepo = $true
            $RepoDir = $toplevel
        }
    }
} catch {}

if ($insideRepo) {
    Write-Host "Already inside errata repo at $RepoDir. Pulling latest changes..."
    Push-Location $RepoDir
    git pull --ff-only
} elseif (Test-Path (Join-Path $RepoDir '.git')) {
    Write-Host "Found existing clone at ./$RepoDir. Pulling latest changes..."
    Push-Location $RepoDir
    git pull --ff-only
} else {
    Write-Host "Cloning $RepoUrl..."
    git clone $RepoUrl $RepoDir
    Push-Location $RepoDir
}

# --- Dependencies ---
Write-Step 'Installing locked dependencies...'
bun install --frozen-lockfile

# --- Start ---
Write-Step 'Starting dev server...'
Write-Host 'Errata will be available at http://localhost:7739' -ForegroundColor Green
bun run dev

Pop-Location
