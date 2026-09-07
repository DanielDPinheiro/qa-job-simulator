@echo off
cd /d "%~dp0"
start "" http://localhost:3030
node src\server.js
pause
