# Telegram Mini App Availability Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Make the existing WEGO web MVP reachable from Telegram as a Telegram Mini App.

**Architecture:** Deploy the existing Vite frontend from the GitHub `main` branch to Vercel over HTTPS. Keep the current local-first demo mode for the first launch, because the repository does not yet have a provisioned production API and PostgreSQL instance. Telegram initialization is already present in the frontend; BotFather will point the Mini App at the deployed URL.

**Tech Stack:** pnpm workspace, Vite/React frontend, Fastify API, Vercel, Telegram Web Apps.

**Spec:** `docs/deploy-telegram.md`, `README.md`, `vercel.json`.

## Task 1: Verify the Telegram web entrypoint

- Confirm the Telegram Web App script is loaded by `apps/web/index.html`.
- Confirm `apps/web/src/main.tsx` initializes Telegram Web App state.
- Confirm `vercel.json` publishes `apps/web/dist` and rewrites SPA routes.
- Add only configuration guidance that is missing from the example environment files if needed.

## Task 2: Build and smoke-test the web app

- Run the web production build with the locked pnpm dependencies.
- Verify the generated output contains the application entrypoint and Telegram bootstrap assets.

## Task 3: Publish the frontend

- Import `https://github.com/ElazAzel/WEGO` into the configured Vercel account.
- Deploy the repository root using the checked-in `vercel.json` settings.
- Verify the deployed HTTPS URL and SPA routes.

## Task 4: Connect Telegram

- In `@BotFather`, create or use the WEGO bot.
- Configure the Mini App/menu button to the verified HTTPS URL.
- Open the app from Telegram and verify that Telegram context initialization works.

## Task 5: Record the operating boundary

- Document that the first Telegram launch is local-first demo mode.
- Keep API/PostgreSQL deployment as a separate follow-up for real cross-device couple synchronization and Telegram notifications.
