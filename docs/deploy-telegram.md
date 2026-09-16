# WEGO: Git, Vercel и Telegram

## Что уже работает

Vercel публикует веб-MVP с тем же сценарием, что на локальном адресе:

- общий экран «Мы»;
- календарь с месяцем, неделей и днём;
- задачи с «Беру» и завершением;
- желания и планы с бюджетом и расходами;
- заметки, карты лояльности с полноэкранным кодом, история, капсулы и питомец;
- центр уведомлений и PWA-кеш;
- локальное сохранение данных в браузере.

Пока не заданы `VITE_API_ENABLED=true` и `VITE_API_URL`, приложение работает в local-first режиме. Это полноценный демонстрационный MVP, но изменения между разными устройствами и пользователями не синхронизируются. Для общей пары нужен отдельный запущенный API и PostgreSQL.

## Публикация фронтенда на Vercel

1. Создайте пустой репозиторий GitHub и добавьте его как `origin`:

   ```bash
   git remote add origin https://github.com/<account>/<repository>.git
   git push -u origin codex/production-foundation
   ```

2. В Vercel выберите `Add New → Project`, подключите репозиторий и оставьте корень проекта корнем репозитория. Файл `vercel.json` уже задаёт установку pnpm, сборку и папку `apps/web/dist`.

3. Для demo-варианта не добавляйте API-переменные. После деплоя проверьте `/wego`, `/calendar`, `/tasks`, `/plans`, `/more`.

4. Для серверного режима добавьте в Environment Variables Vercel:

   ```text
   VITE_API_ENABLED=true
   VITE_API_URL=https://<api-host>/v1
   VITE_TELEGRAM_BOT_USERNAME=<bot_username>
   ```

   После изменения `VITE_*` нужен новый deploy: это переменные сборки.

## API и синхронизация

API — Fastify из `apps/api`. Для production ему нужны Node 24, PostgreSQL и секреты из `.env.example`. Перед запуском примените миграции из `packages/db/migrations` в каноническом порядке.

Минимальный запуск API:

```bash
pnpm install --frozen-lockfile
pnpm --filter @wego/api build
set NODE_ENV=production
set HOST=0.0.0.0
set PORT=8787
pnpm --filter @wego/api dev
```

На Linux/macOS вместо `set` используйте `export`. В `WEB_ORIGIN` укажите точный адрес Vercel без завершающего `/`. В production API отвергает пустой Telegram `initData`, использует PostgreSQL и требует `TELEGRAM_BOT_TOKEN`, `NOTE_ENCRYPTION_KEY`, `TELEGRAM_WEBHOOK_SECRET`, `DATABASE_URL` и `WEB_ORIGIN`.

## Подключение к Telegram

1. Откройте `@BotFather` в Telegram.
2. Создайте бота командой `/newbot` и сохраните токен только на API-сервере.
3. Задайте username бота в `TELEGRAM_BOT_USERNAME` и в `VITE_TELEGRAM_BOT_USERNAME`.
4. Для Mini App используйте один из вариантов BotFather:

   - `/newapp` → выберите бота → название приложения → короткое имя → укажите HTTPS-адрес Vercel;
   - либо `/setmenubutton` → выберите бота → `Web App` → укажите подпись и HTTPS-адрес.

5. Откройте приложение через кнопку бота. Telegram передаст `window.Telegram.WebApp.initData`; API проверит подпись этим же bot token. Не используйте ссылку `http://localhost` и не вставляйте токен бота во фронтенд.
6. Для приглашения партнёра используйте ссылку из onboarding. В серверном режиме она имеет вид `https://t.me/<bot>/app?startapp=join_<one-time-token>`.
7. Для Telegram-уведомлений добавьте на сервере обработчик бота и включите разрешение сообщений пользователем. Центр уведомлений WEGO работает независимо от внешней доставки; Telegram/Web Push подключаются настройками пользователя.

## Проверка перед публичным запуском

- `GET /healthz` возвращает `{ "ok": true }`.
- `GET /readyz` подтверждает подключение к PostgreSQL.
- В Telegram создаются два разных пользователя, третий не входит в пространство.
- Событие, задача и план создаются с одного устройства и видны второму.
- После отзыва доступа к календарю данные не удаляются из личного календаря.
- Секреты отсутствуют в Git и в клиентских `VITE_*`, кроме публичного URL API и username бота.

Если нужен только быстрый просмотр интерфейса, достаточно Vercel demo. Если нужен настоящий общий аккаунт пары, сначала разверните API/PostgreSQL и только затем включите `VITE_API_ENABLED`.
