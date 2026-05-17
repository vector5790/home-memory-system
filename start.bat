@echo off
setlocal

set "ROOT=%~dp0"
set "PORT=%~1"
if "%PORT%"=="" set "PORT=4173"

where node >nul 2>nul
if %errorlevel%==0 (
  set "NODE_EXE=node"
) else (
  set "NODE_EXE=%LOCALAPPDATA%\OpenAI\Codex\bin\node.exe"
)

if not "%NODE_EXE%"=="node" if not exist "%NODE_EXE%" (
  echo Node.js was not found.
  echo Install Node.js or run with the full path to node.exe.
  echo Tried: %NODE_EXE%
  exit /b 1
)

echo Home Memory is running at http://localhost:%PORT%
echo Press Ctrl+C to stop.
"%NODE_EXE%" "%ROOT%server.mjs" %PORT%
