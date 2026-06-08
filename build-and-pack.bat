@echo off
setlocal

REM Run from the repository root, even when this script is started from another directory.
cd /d "%~dp0"

echo.
echo ========================================
echo React Google Address Autocomplete
echo Build, test, lint, and pack
echo ========================================
echo.

where pnpm >nul 2>nul
if errorlevel 1 (
    echo ERROR: pnpm was not found in PATH.
    echo Install pnpm or enable it through Corepack, then run this script again.
    exit /b 1
)

echo [1/7] Installing dependencies...
call pnpm install
if errorlevel 1 goto :fail

echo.
echo [2/7] Running tests...
call pnpm test
if errorlevel 1 goto :fail

echo.
echo [3/7] Running TypeScript checks...
call pnpm typecheck
if errorlevel 1 goto :fail

echo.
echo [4/7] Building workspace...
call pnpm build
if errorlevel 1 goto :fail

echo.
echo [5/7] Running lint...
call pnpm lint
if errorlevel 1 goto :fail

echo.
echo [6/7] Preparing local package folder...
if not exist "vendor\npm" mkdir "vendor\npm"
if errorlevel 1 goto :fail

REM The package version is currently 0.0.0, so remove old local tarballs to avoid installing a stale file.
del /q "vendor\npm\react-google-address-autocomplete-*.tgz" >nul 2>nul

echo.
echo [7/7] Packing react-google-address-autocomplete...
call pnpm --dir "packages\react-google-address-autocomplete" pack --pack-destination "..\..\vendor\npm"
if errorlevel 1 goto :fail

echo.
set "PACKED_FILE="
for /f "delims=" %%F in ('dir /b /a-d "vendor\npm\react-google-address-autocomplete-*.tgz" 2^>nul') do set "PACKED_FILE=%CD%\vendor\npm\%%F"

if not defined PACKED_FILE (
    echo ERROR: Pack command completed, but no .tgz file was found in vendor\npm.
    exit /b 1
)

echo ========================================
echo Done.
echo Package created:
echo %PACKED_FILE%
echo ========================================
exit /b 0

:fail
set "EXIT_CODE=%errorlevel%"
echo.
echo ========================================
echo Failed with exit code %EXIT_CODE%.
echo ========================================
exit /b %EXIT_CODE%
