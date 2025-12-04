# Voice Signal - Примеры использования

## 🎯 Быстрый старт

### Пример 1: Базовое использование

```bash
# Установить зависимости
npm install

# Запустить dev сервер
npm run dev

# Открыть в браузере
# http://localhost:3000
```

## 👥 Режим с комнатой

### Пример 2: Синхронизация между пользователями

**Устройство 1 (Компьютер)**:
1. Перейдите на http://localhost:3000/room
2. Введите room ID: `office-meeting`
3. Нажмите "Join Room"
4. Разрешите доступ к микрофону
5. Нажмите "🎤 Start Listening"

**Устройство 2 (Телефон)**:
1. Перейдите на http://<IP компьютера>:3000/room
2. Введите room ID: `office-meeting`
3. Нажмите "Join Room"
4. Разрешите доступ к микрофону
5. Включите звук на компьютере - эквалайзер на телефоне будет синхронизироваться!

### Тестирование на мобильном через HTTPS (рекомендуется)

Если мобильный браузер не показывает запрос на доступ к микрофону по HTTP, используйте ngrok для HTTPS-туннеля:

```bash
# Установите зависимости (если ещё не установлены)
npm install

# Запустите dev-сервер
# HOST=0.0.0.0 npm run dev

# В отдельном окне терминала запустите ngrok (либо используйте команду ниже через npm script)
npx ngrok http 3000

# Затем откройте выданный https://-URL на телефоне
```

В проекті есть вспомогательный скрипт `scripts/start-ngrok.js` и npm-скрипт `npm run ngrok`, который запускает ngrok программно:

```bash
# Скопировать команду в буфер и запустить ngrok
npm run ngrok

# Если требуется: установите NGROK_AUTHTOKEN перед запуском
export NGROK_AUTHTOKEN=your_token_here
npm run ngrok
```

## 🔧 Примеры кода

### Пример 3: Использование хука useAudioAnalyzer

```typescript
import { useAudioAnalyzer } from '@/app/hooks/useAudioAnalyzer';

export default function MyComponent() {
  const { frequencies, isActive, level, startAudio, stopAudio } = useAudioAnalyzer();

  return (
    <div>
      <button onClick={startAudio}>Включить</button>
      <button onClick={stopAudio}>Выключить</button>
      <p>Уровень: {Math.round(level)}</p>
      <p>Активен: {isActive ? 'Да' : 'Нет'}</p>
      {/* Используйте frequencies для отображения эквалайзера */}
    </div>
  );
}
```

### Пример 4: Использование useSocketAudio

```typescript
import { useSocketAudio } from '@/app/hooks/useSocketAudio';

export default function MyComponent() {
  const { 
    sendAudioData, 
    remoteAudioData, 
    isConnected, 
    clientId 
  } = useSocketAudio();

  const handleSendData = (frequencies: number[]) => {
    sendAudioData(frequencies);
  };

  return (
    <div>
      <p>Статус: {isConnected ? 'Подключено' : 'Отключено'}</p>
      <p>Ваш ID: {clientId}</p>
      {remoteAudioData && (
        <p>Получены данные от: {remoteAudioData.clientId}</p>
      )}
    </div>
  );
}
```

### Пример 5: Использование RoomMode компонента

```typescript
import { RoomMode } from '@/app/components/RoomMode';

export default function MyPage() {
  return (
    <div>
      {/* RoomMode сам управляет синхронизацией */}
      <RoomMode defaultRoomId="my-room" />
    </div>
  );
}
```

### Пример 6: Использование компонента Equalizer

```typescript
import { Equalizer } from '@/app/components/Equalizer';

export default function MyComponent() {
  const [frequencies] = useState<number[]>(Array(256).fill(0));
  const [isMobile] = useState(window.innerWidth < 768);

  return (
    <Equalizer 
      frequencies={frequencies}
      isVertical={isMobile}
    />
  );
}
```

## 🎨 Кастомизация

### Пример 7: Изменение цветов эквалайзера

Файл: `app/components/Equalizer.tsx`

```typescript
// Измените эти цвета на свои
const colors = [
  'from-cyan-500 to-blue-500',      // Зеленый → Синий
  'from-blue-500 to-purple-500',    // Синий → Фиолетовый
  'from-purple-500 to-pink-500',    // Фиолетовый → Розовый
  // Добавьте больше цветов
];
```

### Пример 8: Изменение дизайна кнопок

Файл: `app/page.tsx`

```typescript
<button
  onClick={handleStartStop}
  className={`
    px-8 py-3 
    rounded-lg 
    font-semibold 
    transition-all 
    transform 
    hover:scale-105 
    active:scale-95 
    ${isListening
      ? 'bg-red-500'
      : 'bg-purple-500'
    }
  `}
>
  {isListening ? 'Stop' : 'Start'}
</button>
```

## 🌐 WebSocket События

### Пример 9: Отправка данных на сервер

```typescript
socket.emit('audio-data', {
  frequencies: new Uint8Array([100, 150, 200, ...]),
  timestamp: Date.now()
});

socket.emit('join-room', {
  roomId: 'my-room',
  deviceType: 'mobile'
});
```

### Пример 10: Получение данных с сервера

```typescript
socket.on('audio-update', (data) => {
  console.log('Частоты:', data.frequencies);
  console.log('От кого:', data.clientId);
  console.log('Время:', data.timestamp);
});

socket.on('room-users-update', (users) => {
  console.log('Пользователи в комнате:', Object.keys(users));
});

socket.on('client-count', (count) => {
  console.log('Всего подключено:', count);
});
```

## 📱 Адаптивный дизайн

### Пример 11: Обнаружение типа устройства

```typescript
import { useEffect, useState } from 'react';

export default function MyComponent() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div>
      <h1>{isMobile ? 'Мобильный режим' : 'Десктопный режим'}</h1>
      <Equalizer
        frequencies={frequencies}
        isVertical={isMobile}
      />
    </div>
  );
}
```

## 🚀 Развёртывание

### Пример 12: Развёртывание на Vercel

```bash
# 1. Установите Vercel CLI
npm install -g vercel

# 2. Войдите в аккаунт
vercel login

# 3. Разверните проект
vercel

# 4. Следуйте инструкциям в консоли
```

### Пример 13: Развёртывание на своем сервере

```bash
# 1. Соберите проект
npm run build

# 2. Установите PM2 для запуска
npm install -g pm2

# 3. Запустите сервер
pm2 start npm --name voicesignal -- start

# 4. Сохраните конфигурацию
pm2 save
```

## 🧪 Тестирование

### Пример 14: Тестирование на разных устройствах

```bash
# Установите локальный IP адрес
# Windows: ipconfig
# Mac/Linux: ifconfig

# Получите что-то типа: 192.168.1.100

# На другом устройстве в сети откройте:
# http://192.168.1.100:3000
```

## 📊 Обработка частотных данных

### Пример 15: Расширенная обработка аудио

```typescript
import { useEffect, useRef } from 'react';

export const useAdvancedAudioAnalyzer = () => {
  const analyzerRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!analyzerRef.current) return;

    // Получить временные данные
    const timeData = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteTimeDomainData(timeData);

    // Вычислить среднее
    const average = timeData.reduce((a, b) => a + b) / timeData.length;

    // Вычислить пик
    const peak = Math.max(...timeData);

    // Вычислить энергию
    const energy = timeData.reduce((sum, val) => sum + val * val, 0) / timeData.length;

    console.log({ average, peak, energy });
  }, []);

  return analyzerRef;
};
```

---

**Больше примеров** можно найти в документации Next.js и Socket.IO!
