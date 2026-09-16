# WEGO: GitHub Pages, API и Telegram

## Что уже работает

GitHub Pages публикует веб-MVP с тем же сценарием, что на локальном адресе:

- общий экран «Мы»;
- календарь с месяцем, неделей и днём;
- задачи с «Беру» и завершением;
- желания и планы с бюджетом и расходами;
- заметки, карты лояльности с полноэкранным кодом, история, капсулы и питомец;
- центр уведомлений и PWA-кеш;
- локальное сохранение данных в браузере.

Локальный `pnpm dev` по-прежнему поддерживает preview без API. Опубликованная GitHub Pages-сборка без `WEGO_API_ENABLED=true` и `WEGO_API_URL` теперь показывает понятный экран подключения и не выдаёт demo-данные за настоящий аккаунт. Для общей пары нужен отдельный запущенный API и PostgreSQL.

## Публикация фронтенда на GitHub Pages

1. Создайте пустой репозиторий GitHub и добавьте его как `origin`:

   ```bash
   git remote add origin https://github.com/<account>/<repository>.git
   git push -u origin codex/production-foundation
   ```

2. Workflow `.github/workflows/deploy-pages.yml` собирает `apps/web` и публикует `apps/web/dist` после push в `main`.

3. Не включайте production Pages без API: без переменных пользователь увидит экран «Production ещё не подключён к API», а не demo-аккаунт.

4. Для серверного режима добавьте в GitHub repository variables:

   ```text
   WEGO_API_ENABLED=true
   WEGO_API_URL=https://<api-host>/v1
   VITE_TELEGRAM_BOT_USERNAME=<bot_username>
   ```

   Workflow передаст их в `VITE_API_ENABLED` и `VITE_API_URL`. После изменения нужен новый deploy: это переменные сборки.

## API и синхронизация

API — Fastify из `apps/api`. Для production ему нужны Node 24, PostgreSQL и секреты из `.env.example`. Перед запуском примените миграции из `packages/db/migrations` в каноническом порядке.

Создан отдельный Vercel-проект `wego-api`: [wego-api-elazazels-projects.vercel.app](https://wego-api-elazazels-projects.vercel.app). В deployment уже есть Fastify entrypoint, но runtime намеренно не считается готовым, пока в Vercel не заданы приватные env-переменные из `apps/api/.env.example`.

Для WEGO создан отдельный production-проект Supabase: `wego-production`, ref `zzoqnxugybjvoroqplds`, регион `eu-central-1`. В него уже применены все пять миграций из `packages/db/migrations`, а тестовый запрос подтвердил 27 таблиц в `public`. WEGO не подключается к другим проектам организации.

Фронтенд не должен подключаться к Supabase напрямую. Telegram-аккаунт, сессии, приглашения и права пары проходят через Fastify API; `DATABASE_URL` остаётся секретом API-сервера. Перед публичным запуском отдельно закройте доступ к таблицам через Supabase Data API политиками RLS или отключёнными public grants: сейчас таблицы нужны только серверному API, а не `anon`/`authenticated` клиентам.

Минимальный запуск API:

```bash
pnpm install --frozen-lockfile
pnpm --filter @wego/api build
set NODE_ENV=production
set HOST=0.0.0.0
set PORT=8787
pnpm --filter @wego/api dev
```

На Linux/macOS вместо `set` используйте `export`. В `WEB_ORIGIN` укажите `https://elazazel.github.io` без завершающего `/`. В production API отвергает пустой Telegram `initData`, использует PostgreSQL и требует `TELEGRAM_BOT_TOKEN`, `NOTE_ENCRYPTION_KEY`, `TELEGRAM_WEBHOOK_SECRET`, `DATABASE_URL` и `WEB_ORIGIN`.

## Подключение к Telegram

1. Откройте `@BotFather` в Telegram.
2. Создайте бота командой `/newbot` и сохраните токен только на API-сервере.
3. Задайте username бота в `TELEGRAM_BOT_USERNAME` и в `VITE_TELEGRAM_BOT_USERNAME`.
4. Для Mini App используйте один из вариантов BotFather:

   - `/newapp` → выберите бота → название приложения → короткое имя → укажите HTTPS-адрес GitHub Pages;
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

Если нужен только быстрый просмотр интерфейса, запускайте локальный preview. Для настоящего общего аккаунта пары сначала разверните API/PostgreSQL, проверьте `/healthz` и `/readyz`, и только затем включите `WEGO_API_ENABLED=true` на GitHub Pages.
