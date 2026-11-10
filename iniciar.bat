@echo off
cd /d "%~dp0"
if not exist .env copy .env.example .env >nul
if not exist node_modules\monaco-editor call npm install
echo Abra o endereco mostrado abaixo no navegador. Use Ctrl+C para encerrar.
call npm start
pause
