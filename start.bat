@echo off
REM Voice Signal - Quick Start Script for Windows

echo.
echo 🎵 Voice Signal - Real-time Audio Analyzer
echo ===========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js не встановлено. Встановіть Node.js 18+ з https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js встановлено: 
node --version
echo ✅ npm встановлено:
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Встановлення залежностей...
    call npm install
    if errorlevel 1 (
        echo ❌ Помилка при встановленні залежностей
        pause
        exit /b 1
    )
    echo ✅ Залежності встановлені успішно
) else (
    echo ✅ Залежності вже встановлені
)

echo.
echo 🚀 Запуск development сервера...
echo 📱 Відкрийте http://localhost:3000 в браузері
echo.
echo 💡 Підказка: Для доступу з іншого пристрою в мережі використовуйте:
echo    http://^<ВАШ_IP^>:3000
echo.
echo 👥 Режим кімнати: http://localhost:3000/room
echo.
echo Натисніть Ctrl+C для зупинки сервера
echo.

call npm run dev
pause
