# Textdrop

Textdrop — минималистичный веб-инструмент для быстрого обмена текстовыми заметками между вашими устройствами. Публичные записи доступны по ссылке, приватные открываются только по секретному ключу.

## Возможности
- Быстрое сохранение текста с описанием на одной странице.
- Опциональный секретный ключ: приватные заметки не отображаются в списке, пока не будет введён ключ.
- Список последних публичных записей с быстрым переходом.
- Мгновенное открытие приватного текста по секретному ключу (результат запоминается в `sessionStorage`).
- Современный адаптивный интерфейс, оптимизированный под десктоп и мобильные браузеры.

## Технологии
- [Next.js 15 App Router](https://nextjs.org/) + TypeScript.
- Tailwind CSS для типографики и быстрой стилизации.
- MongoDB в качестве постоянного хранилища.
- bcrypt + SHA-256 для безопасного хранения секретных ключей.

## Подготовка окружения
1. Создайте базу данных в MongoDB (можно на той же VPS).
2. В коллекции `entries` задайте индекс для ускорения поиска:
   ```js
   db.entries.createIndex({ slug: 1 }, { unique: true });
   db.entries.createIndex({ secretLookup: 1 }, { unique: true, sparse: true });
   db.entries.createIndex({ createdAt: -1 });
   ```
3. Добавьте в `.env.local` переменные окружения:
   ```bash
   MONGODB_URI="mongodb://user:password@localhost:27017/textdrop?authSource=admin"
   MONGODB_DB="textdrop"
   ```
   Для production создайте `.env` с теми же значениями.

## Локальный запуск (WSL/Ubuntu)
```bash
npm install
npm run dev
```
Откройте [http://localhost:3000](http://localhost:3000).

## Сборка и запуск в production
```bash
npm run build
npm run start
```
По умолчанию сервер слушает порт `3000`. На VPS можно использовать reverse proxy (Nginx / Caddy) и HTTPS-сертификаты для домена `textdrop.threy1.com`.

## Развертывание в Docker
В репозитории есть пример `deploy/compose.yaml`, который поднимает приложение и MongoDB. Перед запуском:
1. Скопируйте `deploy/textdrop.env.example` в `deploy/textdrop.env` и укажите реальные креды.
2. Замените в `deploy/compose.yaml` домен в Traefik-лейблах и название внешней сети на свои значения.
3. Соберите образ и запустите стек:
   ```bash
   docker compose -f deploy/compose.yaml build
   docker compose -f deploy/compose.yaml up -d
   ```

### Systemd unit (пример)
```ini
[Unit]
Description=Textdrop
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/textdrop
EnvironmentFile=/var/www/textdrop/.env
ExecStart=/usr/bin/npm run start
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

## Тестирование
- `npm run lint` — проверки ESLint.
- Дополнительно можно добавить e2e-тесты (Playwright) для будущей регрессии.

## Roadmap идей
- Поддержка файлов/изображений.
- История версий и поиск по заметкам.
- Настройки срока жизни заметки и автосброс публичных данных.
- Авторизация, если сервис планируется открыть для других пользователей.

## Безопасность
- Пароли/секреты не хранятся в открытом виде (bcrypt + lookup hash для поиска).
- Не забудьте включить HTTPS на продакшене.
- Для публичного запуска стоит ввести ограничения: rate limiting, CAPTCHA или авторизацию.

Удачи в эксплуатации! Если потребуются доработки, интерфейс спроектирован модульно — можно быстро расширять логику на странице или подключать новые API-маршруты.
