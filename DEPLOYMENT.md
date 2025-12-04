# 🚀 Production Deployment Guide

## Розгортання Voice Signal на production сервер

Цей гайд покроково описує як розгорнути Voice Signal на вашому сервері.

---

## 📋 Вимоги

- VPS/Server з Ubuntu 20.04+ або CentOS 8+
- Node.js 18+ встановлено
- npm встановлено
- Доменне ім'я (обов'язково!)
- SSL сертифікат (Let's Encrypt)
- Git встановлено

---

## 🔑 Крок 1: Підготовка сервера

### 1.1 Оновіть систему

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Встановіть Node.js та npm

```bash
# За допомогою NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Перевірте версії
node --version
npm --version
```

### 1.3 Встановіть PM2 (менеджер процесів)

```bash
sudo npm install -g pm2
```

---

## 🗂️ Крок 2: Клонування проекту

### 2.1 Створіть папку для проекту

```bash
sudo mkdir -p /var/www/voicesignal
sudo chown -R $USER:$USER /var/www/voicesignal
cd /var/www/voicesignal
```

### 2.2 Клонуйте репозиторій

```bash
git clone https://github.com/yourusername/voicesignal.git .
```

### 2.3 Встановіть залежності

```bash
npm install
```

---

## 🔨 Крок 3: Побудування для production

### 3.1 Створіть .env файл

```bash
nano .env.production
```

Додайте:
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 3.2 Побудуйте проект

```bash
npm run build
```

Це створить `.next` папку з оптимізованим кодом.

---

## 🌐 Крок 4: Налаштування Nginx

### 4.1 Встановіть Nginx

```bash
sudo apt install -y nginx
```

### 4.2 Створіть конфіг Nginx

```bash
sudo nano /etc/nginx/sites-available/voicesignal
```

Додайте:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL сертифікат
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL налаштування
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Основні налаштування
    client_max_body_size 50M;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;

    # Root папка
    root /var/www/voicesignal/public;

    # Проксування на Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Для WebSocket
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Кеш для статичних файлів
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Логи
    access_log /var/log/nginx/voicesignal_access.log;
    error_log /var/log/nginx/voicesignal_error.log;
}
```

### 4.3 Активуйте конфіг

```bash
sudo ln -s /etc/nginx/sites-available/voicesignal /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## 🔐 Крок 5: SSL Сертифікат (Let's Encrypt)

### 5.1 Встановіть Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Отримайте сертифікат

```bash
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

Дотримуйтесь інструкцій.

### 5.3 Автоматичне оновлення

```bash
sudo systemctl enable certbot.timer
```

---

## 🚀 Крок 6: Запуск через PM2

### 6.1 Створіть PM2 конфіг

```bash
nano ecosystem.config.js
```

Додайте:

```javascript
module.exports = {
  apps: [
    {
      name: 'voicesignal',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/voicesignal',
      env: {
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1'
      },
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/voicesignal/error.log',
      out_file: '/var/log/voicesignal/out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', '.next']
    }
  ]
};
```

### 6.2 Запустіть додаток

```bash
pm2 start ecosystem.config.js
```

### 6.3 Зробіть автозапуск

```bash
pm2 startup systemd -u $USER --hp /home/$USER
pm2 save
```

---

## 📊 Крок 7: Моніторинг

### 7.1 Перевірте статус

```bash
pm2 status
pm2 logs voicesignal
```

### 7.2 Перезагрузка при оновленні

```bash
pm2 reload voicesignal
```

### 7.3 Перезапуск

```bash
pm2 restart voicesignal
```

---

## 🐳 Альтернатива: Docker Deployment

### 8.1 Побудуйте образ

```bash
docker build -t voicesignal:latest .
```

### 8.2 Запустіть контейнер

```bash
docker run -d \
  --name voicesignal \
  -p 3000:3000 \
  -v /var/www/voicesignal/.next:/app/.next \
  -e NODE_ENV=production \
  voicesignal:latest
```

### 8.3 З Docker Compose

```bash
docker-compose up -d
```

---

## 🔧 Налаштування для WebSocket

### 9.1 Для Nginx з WebSocket

Конфіг вже включає WebSocket налаштування:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

### 9.2 Для Socket.IO

Socket.IO автоматично переключається на polling, якщо WebSocket недоступний.

---

## 🗝️ Важні змінні середовища

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

Можете додати в `.env.production`:

```bash
# Для кастомних URL
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

---

## 📈 Оптимізація

### 10.1 Кеширування

Переконайтесь, що в `next.config.ts`:

```typescript
export default {
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
};
```

### 10.2 CDN (опціонально)

Для статичних файлів використовуйте CloudFront або Cloudflare.

### 10.3 Database (якщо потрібна)

Якщо захочете зберігати дані, додайте MongoDB або PostgreSQL.

---

## 🐛 Розв'язання проблем

### Помилка: "npm: command not found"

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Помилка: "Address already in use"

```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Помилка: "Connection refused"

```bash
pm2 status
pm2 logs voicesignal
```

### Помилка: SSL сертифікат

```bash
sudo certbot renew --dry-run
sudo systemctl restart nginx
```

---

## 📊 Моніторинг і логи

```bash
# Логи PM2
pm2 logs

# Логи Nginx
sudo tail -f /var/log/nginx/voicesignal_error.log

# Статус сервісу
sudo systemctl status nginx
pm2 status
```

---

## 🔄 Оновлення коду

### 11.1 Оновіть код

```bash
cd /var/www/voicesignal
git pull origin main
npm install
npm run build
pm2 reload voicesignal
```

### 11.2 Автоматичне оновлення (GitHub Actions)

Можете налаштувати GitHub Actions для автоматичного деплою.

---

## 💰 Вартість

**Мінімальна конфігурація**:
- VPS: ~$5-10/місяць (DigitalOcean, Linode, Hetzner)
- Domain: ~$10/рік (Namecheap, GoDaddy)
- SSL: Безплатно (Let's Encrypt)

**Загалом**: ~$60-120/рік для небільшого проекту

---

## 🎉 Готово!

Ваш **Voice Signal** тепер доступний на `https://yourdomain.com`!

---

**Версія**: 1.0.0  
**Дата**: 1 грудня 2025 р.
