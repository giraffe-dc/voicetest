#!/bin/bash

# Voice Signal - Quick Start Script

echo "🎵 Voice Signal - Real-time Audio Analyzer"
echo "==========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не встановлено. Встановіть Node.js 18+ з https://nodejs.org"
    exit 1
fi

echo "✅ Node.js встановлено: $(node --version)"
echo "✅ npm встановлено: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Встановлення залежностей..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Залежності встановлені успішно"
    else
        echo "❌ Помилка при встановленні залежностей"
        exit 1
    fi
else
    echo "✅ Залежності вже встановлені"
fi

echo ""
echo "🚀 Запуск development сервера..."
echo "📱 Відкрийте http://localhost:3000 в браузері"
echo ""
echo "💡 Підказка: Для доступу з іншого пристрою в мережі використовуйте:"
echo "   http://<ВАШ_IP>:3000"
echo ""
echo "👥 Режим кімнати: http://localhost:3000/room"
echo ""
echo "Натисніть Ctrl+C для зупинки сервера"
echo ""

npm run dev
