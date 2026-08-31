# Handoff: WEGO — Тамагочи вашей общей жизни

**Версия дизайна:** Prototype v1  
**Дата хендоффа:** 27 августа 2026  
**Автор дизайна:** Ильяс Азелханов (NAVYK / AlmaU)  
**Целевая платформа:** Telegram Mini App (первый релиз), с прицелом на iOS/Android нативные клиенты во второй итерации.

Реализация вынесена в [`apps/`](apps/) и [`packages/`](packages/); архитектура и текущий статус — в [`docs/architecture/README.md`](docs/architecture/README.md).

---

## 1. Overview

**WEGO** — приватное игровое пространство для двух близких людей (пара, друзья, семья). Это **не трекер отношений**, а маленький живой мир — «тамагочи» общей жизни, — который растёт и меняет облик от того, что двое делают и говорят друг другу.

**Ядро продукта — ежедневный ритуал из пяти шагов:**

1. **Check-in** — я отмечаю своё настроение, энергию и желание (3 экрана, 30 секунд).
2. **Guess** — угадываю, как сегодня партнёр (скрыто до Reveal).
3. **Reveal** — когда оба ответили, открывается «конверт»: сравнение состояний + инсайт от Wego.
4. **Story** — Reveal (или совместное действие) можно сохранить как воспоминание в вертикальную ленту.
5. **Share** — вертикальная карточка 9:16 для отправки в Stories / чат (вирусный слой).

Побочные вкладки: **«Вместе»** (совместные активности с фильтрами), **«Мы»** (вопрос дня, игра «Кто из нас»), **«Wego»** (главный экран с персонажем/комнатой).

---

## 2. About the Design Files

Файлы в этом бандле — **дизайн-референс, сделанный в HTML/React (Babel-standalone)**. Это визуальная спецификация и рабочий кликабельный прототип, **а не production-код для копипаста**.

Задача разработчика — **воссоздать эти экраны в целевом окружении**:

- **Если у команды уже есть кодовая база** (например, Telegram Mini App на React/Vue + Tailwind, или нативный SwiftUI/Kotlin/Flutter) — реализовать дизайны с использованием существующих компонентных библиотек, конвенций именования, паттернов маршрутизации и стейт-менеджмента.
- **Если кодовой базы нет** — выбрать оптимальный стек под Telegram Mini App: рекомендую **React + Vite + Tailwind + Zustand + Telegram Web App SDK**, либо **Next.js (app router) + shadcn/ui + Zustand**. Дизайн-токены и компонентная структура из прототипа переносятся практически 1-в-1.

HTML-прототип запускается открытием `WEGO Prototype.html` в браузере (React/Babel подгружаются с CDN). Все состояния сохраняются в `localStorage` под ключом `wego-mvp-state-v1` — можно рефрешить страницу и не терять прогресс check-in.

---

## 3. Fidelity

**High-fidelity (hi-fi).** Все цвета, типографика, отступы, радиусы, тени и микро-анимации — финальные и рабочие. Разработчик должен собрать пиксель-точный интерфейс, используя приведённые ниже токены как источник истины. Иконки в прототипе — символы (◐ ◑ ◔ ◕ ◒ ◓ ☀ ♥); их следует заменить на кастомный icon-set (SVG line, 24×24, stroke 1.5px) — согласовать с дизайнером.

Ассеты Wego (6 PNG-персонажей × 2 стиля) и 2 комнаты — финальные, лежат в `assets/` — использовать as-is.

---

## 4. Screens / Views

### 4.1 Onboarding (5 экранов)

Цель — за 60 секунд провести от «Создать» до «Ваш Wego появился».

| # | Экран | Назначение | Ключевые элементы |
|---|---|---|---|
| 01 | **Splash** | Первый контакт, эмоция | Заголовок Instrument Serif 44px «Тамагочи *вашей общей* жизни.», кнопка «Создать Wego» (coral, full-width) |
| 02 | **Type** | Тип пространства | 3 карточки: Пара / Друзья / Семья. Radio-выбор (24×24 круг, plum-заливка при активе). |
| 03 | **Name** | Имя Wego | Text input + 5 чипов-подсказок («Our Wego», «Малыш», «Пу», «Момо», «Тэко») |
| 04 | **Invite** | Приглашение партнёра | Lilac-карточка с deep-link `t.me/wego/join/<code>` + кнопка «Копировать» (plum pill) |
| 05 | **Reveal** | Появление Wego | Персонаж (`style-a-egg.png` или `style-b-egg.png`) с drop-shadow + `wgFloat` анимацией, заголовок «Ваш Wego *появился*» |

Верхний прогресс-бар: 5 сегментов по 3px, активные — `--plum`, неактивные — `--line`.

### 4.2 Home / Wego (2 варианта — согласовать финальный)

**V1 · Room-first (диорама-якорь):**
- Заголовок «Our Space» (mono-caps) + название пространства (serif 32px).
- **Диорама** — квадратная карточка (aspect-ratio 1 / 1.05) с фоном-комнатой и Wego-персонажем поверх (42% ширины, absolute bottom 18%, floating animation).
- Badge «День N · <Character>» — top-left, glass-effect (backdrop-filter blur 8px).
- **Participants strip** — 2 мини-карточки (я + партнёр) с аватарами и статусом.
- **Primary CTA** — «Отметиться сегодня →» (coral xl) ИЛИ mint-карточка «Твоя часть готова» после ответа.
- **Today's Reveal card** — lilac когда оба ответили, paper — когда ждём.
- **Insight card** — «Wego заметил: …» (cream, с мини-Wego в круге).

**V2 · Character-first (минимализм):**
- Фон: `linear-gradient(180deg, var(--lilac) 0%, var(--cream) 45%)`.
- Верх: пара аватаров с индикаторами ответа (8px точки — mint при готовности, line-deep пока пусто) + counter «День N».
- Большой Wego по центру (260px width) + ground shadow (radial-gradient ellipse).
- Whisper в serif 20px «Как у вас сегодня?».
- Sticky CTA (coral / lilac / secondary в зависимости от состояния) + 2 status-pills внизу.

**Рекомендация:** запустить с V1 (эмоциональнее, лучше onboarding-эффект), V2 держать как toggle в настройках профиля.

### 4.3 Check-in Sheet (bottom sheet, 92% высоты)

- Прогресс-бар: 4 сегмента × 4px, активные — `--coral`.
- Handle bar сверху: 44×5px, `--line-deep`.
- **Шаг 1 · Mood** — 7 chips: Отлично / Хорошо / Спокойно / Обычно / Перегружен / Тяжело / Раздражён. Каждый — свой тон (yellow / mint / lilac / default / coral / default / coral).
- **Шаг 2 · Energy** — 3 full-width радио-кнопки (Много / Нормально / Мало). Активная: `--plum` bg + белый текст.
- **Шаг 3 · Want** — 7 chips (Побыть вместе / Поговорить / Отдохнуть / Побыть одному / Развлечься / Погулять / Поддержки).
- **Шаг 4 · Note** — textarea (опционально), 4 строки, placeholder «Сегодня просто адский дедлайн…».
- Sticky CTA снизу с gradient-fade: «Дальше →» / «Отправить →».
- Анимация появления: `wgSlideUp 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.2)`.

### 4.4 Guess Sheet (82% высоты)

- Открывается автоматически после Check-in (задержка 260ms для transition).
- Заголовок «Как думаешь, как сегодня <partner>?» (serif 28px).
- Подпись «Твой ответ скрыт от <partner> до Reveal.» (13px muted).
- 7 mood-chips (тот же список).
- Sticky CTA «Сохранить догадку →».

### 4.5 Reveal Screen (2 варианта — согласовать)

**V1 · Parallel cards (спокойное сравнение):**
- Фон: `linear-gradient(180deg, var(--lilac) 0%, var(--cream) 55%)`.
- Hero: «Reveal / *unlocked*» serif 44px.
- 2 карточки состояний друг под другом (peach + lilac) с разделителем-пилюлей «↓».
- Каждая карточка: аватар + имя + serif-название настроения + 2 chips (энергия/хочет) + note-цитата.
- Insight-карточка (paper, serif 22px): «У вас разный запас энергии, но обоим хочется быть рядом. Иногда этого уже достаточно.»
- Guess result: mint (угадал) или yellow (мимо) — с текстом «Ты думал: «X». На самом деле — «Y».»
- Wego reaction: маленький Wego (56px) + фраза «Wego стал чуть мягче.»
- CTAs: primary «Сохранить в Story» + secondary «Закрыть».

**V2 · Envelope opens (кинематографично, 1.4s анимация):**
- Фон: `radial-gradient(ellipse at 50% 20%, #D6C4F0 0%, var(--lilac) 40%, var(--cream) 90%)`.
- **Phase 0 → 1 → 2:**
  - 0 (0–400ms): sealed envelope — прямоугольник 240×160 с сургучом-ромбом coral (♥) сверху. Анимация `wgSeal 1.4s ease`.
  - 1 (400–1400ms): opacity fade-out конверта.
  - 2 (1400ms+): контент открывается — translateY(30 → 0) + opacity 0 → 1, transition 0.5–0.6s.
- Заголовок «*Открыто*» — Instrument Serif italic 52px.
- Wego 140px под заголовком.
- 2 mood-face карточки бок-о-бок с glass-эффектом (rgba(255,253,249,0.85) + backdrop-filter blur 8px) и `&` между ними на вертикальной lilac-линии.
- Poetic conclusion (serif 26px): «У вас разный ритм, но одна и та же тишина.»
- CTAs: lilac «Сохранить момент» + ghost «Закрыть».

**Рекомендация:** V2 — как «wow» — но требует ≥60fps анимации; на слабых Android оффнуть на V1.

### 4.6 Together (вкладка «Вместе»)

- Список активностей с фильтрами (chips сверху): Дома / На улице / Быстро / Романтика / Игры.
- Каждая карточка — «Найти общий фильм», «Сыграть в „Кто из нас"», «Составить bucket-list», «Записать голосовое пожелание» и т.п.
- Секция «Запланировано» — если есть отложенные активности.

### 4.7 Story (вкладка)

- Вертикальная лента моментов (сверху — свежие).
- Типы записей: `reveal`, `evolution`, `result`, `activity`, `note`.
- Каждая — карточка с тоном (`lilac` / `yellow` / `mint` / `peach`), датой, заголовком, телом, кнопкой «Поделиться» (открывает Share Cards).
- Из прототипа: 4 seed-записи начиная с «Wego стал Cozy Dreamer» до «Записка».

### 4.8 Мы (вкладка)

- **Вопрос дня** — карточка (lilac) с вопросом типа «Что бы ты выбрал: неделю без телефона или неделю без сладкого?» и двумя вариантами.
- **Кто из нас** — карточка (yellow) с игровым вопросом «Кто из нас первый погибнет в зомби-апокалипсисе?» + 2 аватара для голосования.
- Результаты видны только когда оба ответили.

### 4.9 Share Cards (9:16, вирусный слой)

Три шаблона:
- **Evolution** — «Wego стал Cozy Dreamer», фон lilac-gradient, Wego крупно.
- **Result** — «Оба решили, что Ильяс первым…», фон yellow, 2 аватара + результат.
- **Memory** — «Сегодня мы просто были рядом», фон peach, тихая цитата + мини-Wego.

Экспорт: PNG 1080×1920, watermark «wego» внизу.

### 4.10 TabBar (нижняя навигация, во всех вкладках)

- 4 таба: **Wego** (◐), **Мы** (◑), **Вместе** (◔), **Story** (◕).
- Активный: иконка `--coral`, лейбл `--plum`, вес 600.
- Неактивный: `--muted`.
- Фон: `rgba(255,248,239,0.92)` + backdrop-filter blur 12px, top-border 1px `--line`.
- Padding: 10px 12px 24px (учтён iOS home-indicator).

---

## 5. Interactions & Behavior

### Флоу check-in → reveal (счастливый путь)

1. Пользователь на Home видит CTA «Отметиться сегодня».
2. Тап → открывается Check-in Sheet (slide-up).
3. Выбирает mood → «Дальше» → energy → «Дальше» → want → «Дальше» → note (опц.) → «Отправить».
4. Sheet закрывается (260ms), автоматически открывается Guess Sheet.
5. Пользователь выбирает предположение о партнёре → «Сохранить догадку».
6. Guess закрывается (400ms), если партнёр уже ответил — **немедленно** открывается Reveal.
7. Если партнёр ещё не ответил — на Home появляется mint-карточка «Твоя часть готова» + отсчёт на Today's Reveal («Ждём вас обоих»).

### Reveal V2 timing (envelope)

```
0ms      конверт запечатан, показывается
400ms    setPhase(1) — fade-out конверта
1400ms   setPhase(2) — контент translateY(30→0) + opacity 0→1 за 500-600ms
```

### Анимации (CSS keyframes)

```css
@keyframes wgFloat {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%      { transform: translateX(-50%) translateY(-6px); }
}
/* 4s ease-in-out infinite — Wego «дышит» на Home */

@keyframes wgFade { from { opacity: 0; } to { opacity: 1; } }
/* 0.2–0.3s ease — появление overlays */

@keyframes wgSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
/* 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.2) — bottom sheets */

@keyframes wgSeal {
  0%   { transform: rotate(-3deg) scale(0.9); opacity: 0; }
  60%  { transform: rotate(2deg)  scale(1.02); opacity: 1; }
  100% { transform: rotate(0)     scale(1);    opacity: 1; }
}
/* 1.4s ease — sealed envelope entrance в Reveal V2 */
```

### Button press feedback

Все `WButton`: `onMouseDown → transform: translateY(1px)`, `onMouseUp/Leave → 0`. Transition `transform 0.12s ease`. Заменить на `active:` в CSS в production.

### Loading / Error states (не покрыты в прототипе — согласовать)

- **Loading Home** — skeleton (peach placeholder для диорамы, greys для карточек), 300ms fade-in контента.
- **Empty Story** — иллюстрация Wego + текст «Пока пусто. Первый Reveal сохранится сюда.» + CTA «Отметиться».
- **Partner offline / not joined** — на Home баннер «<partner> ещё не присоединился — [Переслать ссылку]».
- **Reveal error** (данные не пришли) — retry с exponential backoff, показывать конверт с надписью «Не открылось. Попробовать снова?».

### Валидация форм

- Check-in шаги 1-3: кнопка «Дальше» disabled (opacity 0.4) пока нет выбора.
- Onboarding name: min 1 char, max 24 char.
- Note textarea: max 240 char (нужен counter в правом нижнем углу).

---

## 6. State Management

### Глобальный store (Zustand / Redux / Pinia — на выбор)

```ts
type WegoState = {
  // Space
  space: { name: string; type: "pair"|"friends"|"family"; stage: "egg"|"baby"|"adult"; character: string; daysAlive: number };
  // Users
  me:      { name: string; tone: "coral"|"lilac"|"mint"|"yellow"; avatarLetter: string };
  partner: { name: string; tone: "coral"|"lilac"|"mint"|"yellow"; avatarLetter: string };
  // Today
  today: {
    myMood: MoodId | null;
    myEnergy: EnergyId | null;
    myWant: WantId | null;
    myNote: string;
    myGuess: MoodId | null;      // moя догадка о партнёре
    partnerMood: MoodId | null;
    partnerEnergy: EnergyId | null;
    partnerWant: WantId | null;
    partnerGuess: MoodId | null;
    revealed: boolean;
  };
  // History
  story: StoryEntry[];
  plannedActivities: Activity[];
  // Style tumblers (dev-only, вырезать в prod)
  style: "a"|"b"; room: "warm"|"morning"; homeVariant: "v1"|"v2"; revealVariant: "v1"|"v2";
};
```

### Триггеры и переходы

| Событие | Что происходит |
|---|---|
| `updateToday({ myMood, myEnergy, myWant, myNote })` | Сохранить check-in, показать Guess |
| `updateToday({ myGuess })` | Сохранить догадку. Если `bothAnswered` → открыть Reveal |
| `bothAnswered = myMood && partnerMood` | Разблокирует Reveal card на Home |
| `addStory(entry)` | Добавить в начало ленты Story |
| Полночь / новый день | Сбросить `today.*` (кроме исторических) в null, увеличить `space.daysAlive` |
| Оба «good/great» N дней подряд | Триггер эволюции: `stage: "baby" → "adult"`, добавить `evolution` в Story |

### Data fetching (production)

- **Auth:** через Telegram Web App SDK (`window.Telegram.WebApp.initData`).
- **Sync partner state:** WebSocket или SSE — при коннекте партнёра к `today` пуш `partnerMood/Energy/Want/Guess`.
- **Persistence:** сервер (Postgres) + optimistic UI + оффлайн-очередь в IndexedDB.

---

## 7. Design Tokens

### Colors

```
/* Base */
--cream:      #FFF8EF   /* фон приложения */
--paper:      #FFFDF9   /* карточки, инпуты */
--plum:       #3B223D   /* основной текст, primary для tabbar/selected */
--muted:      #8D7886   /* второстепенный текст, disabled */

/* Coral (primary CTA) */
--coral:      #FF745F
--coral-dark: #E85A45   /* shadow / hover */
--peach:      #FFE7DB   /* soft-coral surfaces */

/* Lilac (Reveal, "мы вместе") */
--lilac:      #EEE6FA
--lilac-deep: #C8B6EA

/* Mint (успех, "готово") */
--mint:       #DFF5EA
--mint-deep:  #8ED0AF

/* Yellow (внимание, "мимо", игры) */
--yellow:     #FFF0BD
--yellow-deep:#F0C449

/* Lines / borders */
--line:       #F0E3D8
--line-deep:  #E4D2C1
```

### Typography

```
--font-serif: 'Instrument Serif', 'Times New Roman', serif;   /* эмоция */
--font-sans:  'Geist', -apple-system, system-ui, sans-serif;  /* форма */
```

**Scale (используется в прототипе):**

| Роль | Font | Size | Line-height | Letter-spacing | Weight |
|---|---|---|---|---|---|
| Hero (landing) | Serif | 92px | 0.92 | -0.03em | 400 |
| Page title | Serif | 44px | 1.0 | -0.02em | 400 |
| Screen title | Serif | 30–38px | 1.0–1.1 | -0.02em | 400 |
| Card title | Serif | 22–28px | 1.15–1.3 | -0.01em | 400 |
| Body | Sans | 15px | 1.5 | 0 | 400 |
| Small | Sans | 13px | 1.5 | 0 | 400 |
| Micro | Sans | 12px | 1.4 | 0 | 500 |
| Mono-caps (eyebrow) | Sans | 11px | 1 | 0.14em | 500, uppercase |

Italic Instrument Serif — эмоциональный акцент («*вашей общей*», «*unlocked*», «*Открыто*») — не декор, а часть языка.

### Spacing scale

Используется гриды 4/8: `4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48, 60, 80, 120` px. Основные — `12/16/20/24`.

### Radius

```
--r-sm:   12px    /* inputs, small tags */
--r-md:   20px    /* mid cards, notes */
--r-lg:   28px    /* main cards, sheets top corners */
--r-xl:   36px    /* diorama */
--r-pill: 999px   /* chips, buttons, avatars */
```

### Shadows

```
--shadow-soft: 0 1px 0 rgba(59,34,61,0.04), 0 8px 24px rgba(59,34,61,0.06);
--shadow-card: 0 2px 0 var(--line), 0 12px 32px rgba(59,34,61,0.08);

/* Button "лежит на подложке" (skeuomorphic hint) */
box-shadow: 0 2px 0 var(--coral-dark);   /* primary */
box-shadow: 0 2px 0 var(--line-deep);    /* secondary */

/* Phone frame */
box-shadow: 0 30px 80px rgba(59,34,61,0.14), 0 6px 0 #050205;

/* Wego drop-shadow */
filter: drop-shadow(0 8px 12px rgba(59,34,61,0.2));   /* small */
filter: drop-shadow(0 12px 20px rgba(59,34,61,0.18)); /* medium */
filter: drop-shadow(0 20px 30px rgba(59,34,61,0.15)); /* large */
```

### Backdrop / glass

Style-tumbler, tabbar, day-badge на диораме: `background: rgba(255,253,249,0.85–0.92)` + `backdrop-filter: blur(8–12px)` + 1px border `--line`.

---

## 8. Component Inventory

Из `components/design-system.jsx` — переиспользуемые примитивы (перенести в UI-kit):

| Компонент | Пропсы | Назначение |
|---|---|---|
| `WButton` | `variant: primary/secondary/ghost/lilac/mint`, `size: sm/md/lg/xl` | Основные CTA. `xl` — full-width sticky. |
| `WChip` | `tone: default/coral/lilac/mint/yellow`, `active` | Выбор в check-in, фильтры |
| `WCard` | `tone: paper/peach/lilac/mint/yellow/cream/coral` | Все контейнеры контента |
| `WAvatar` | `name, tone, size` | Круглые аватары с буквой (1-я буква имени) |
| `WSheet` | `open, onClose, height` | Bottom sheet с handle, backdrop-blur, slide-up |
| `WTabBar` | `current, onChange` | Нижняя навигация (4 таба) |
| `WSectionLabel` | — | Mono-caps eyebrow |

Данные-справочники: `MOOD_OPTIONS` (7 настроений), `ENERGY_OPTIONS` (3), `WANT_OPTIONS` (7) — вынести в `constants.ts`.

---

## 9. Assets

Все ассеты — в `assets/` внутри этого хендофф-пакета. Финальные, использовать 1-в-1.

### Wego персонажи (6 файлов)

Два визуальных стиля × три стадии эволюции:

- `assets/wego/style-a-egg.png` — Style A (Premium sticker), стадия «яйцо»
- `assets/wego/style-a-baby.png` — Style A, «малыш»
- `assets/wego/style-a-adult.png` — Style A, «взрослый»
- `assets/wego/style-b-egg.png` — Style B (Cozy Japanese), «яйцо»
- `assets/wego/style-b-baby.png` — Style B, «малыш»
- `assets/wego/style-b-adult.png` — Style B, «взрослый»

**PNG с прозрачностью.** Рендерить через `<img>` с `filter: drop-shadow(...)` — не запекать тень в файл.

**Рекомендация по стилю:** согласовать с командой финальный (A или B). В прототипе default = A.

### Rooms (2 файла)

Фон-диорамы для Home V1:

- `assets/rooms/room-warm-evening.png` — тёплый вечер (используется со Style A)
- `assets/rooms/room-soft-morning.png` — мягкое утро (используется со Style B)

**PNG, ~300 KB.** Cover-fit в контейнере с `aspect-ratio: 1 / 1.05`.

### Иконки TabBar / prototype

В прототипе используются Unicode-символы `◐ ◑ ◔ ◕ ◒ ◓ ☀ ♥` как **заглушки**. **Требуется icon-set** от дизайнера:

- **TabBar:** 4 иконки (Wego / Мы / Вместе / Story), SVG 24×24, stroke 1.5px, состояния filled/outline.
- **Mood-set:** 7 иконок для настроений (можно совместить с текстовыми чипами, но иконки украсят Reveal).
- **Прочее:** copy, share, close (×), check (✓), arrow-right — стандартный icon-set (Lucide / Phosphor подойдут).

### Шрифты

- **Instrument Serif** — Google Fonts (Regular + Italic).
- **Geist** — Google Fonts (400, 500, 600, 700).

В production self-host для скорости (Telegram Mini App — критично).

---

## 10. Files

Все исходные файлы прототипа лежат в этом бандле:

| Файл | Что содержит |
|---|---|
| `WEGO Prototype.html` | Корневой HTML, стили `:root` токенов, keyframes, canvas-раскладка секций |
| `app.jsx` | Design canvas: hero, секции 01–08, live prototype с side-panel, isolated frames для onboarding и share |
| `components/design-system.jsx` | Токены (JS-объект + CSS-переменные), примитивы `WButton/WChip/WCard/WAvatar/WSheet/WTabBar`, справочники MOOD/ENERGY/WANT |
| `components/wego-state.jsx` | React Context `WegoProvider`, хук `useWego`, дефолтный стейт, localStorage persistence, helpers `wegoAsset()/roomAsset()` |
| `components/device-frame.jsx` | Компонент `WPhoneFrame` (390×844, notch, top-bar) — для дизайна, в production не нужен |
| `components/screens/home.jsx` | Home V1 (room-first) + Home V2 (character-first) + `ParticipantMini`, `StatusPill` |
| `components/screens/checkin.jsx` | `CheckInSheet` (4 шага) + `GuessSheet` |
| `components/screens/reveal.jsx` | Reveal V1 (parallel cards) + Reveal V2 (envelope, 1.4s cinematic) + `RevealCard`, `MoodFace` |
| `components/screens/together.jsx` | Вкладка «Вместе» с фильтрами и списком активностей |
| `components/screens/story.jsx` | Лента моментов (evolution/result/activity/note/reveal) |
| `components/screens/we-tab.jsx` | Вопрос дня + «Кто из нас» |
| `components/screens/share-cards.jsx` | 3 шаблона 9:16 (Evolution / Result / Memory) |
| `components/screens/onboarding.jsx` | 5 шагов onboarding |
| `assets/wego/` | 6 PNG персонажей |
| `assets/rooms/` | 2 PNG комнаты |

---

## 11. Suggested Implementation Order (для Genspark Code / внешнего дева)

1. **Стек + токены** — поднять проект (React + Vite + Tailwind), перенести CSS-переменные в `tailwind.config` и глобальный `:root`, подгрузить шрифты.
2. **Design system** — реализовать `<Button>`, `<Chip>`, `<Card>`, `<Avatar>`, `<Sheet>`, `<TabBar>` в компонентной библиотеке проекта. Покрыть Storybook / визуальными тестами.
3. **State + Router** — Zustand store по схеме `WegoState`, роуты `/onboarding/*`, `/wego`, `/we`, `/together`, `/story`, модалы через search-params.
4. **Onboarding** — 5 экранов, финальный экран пишет `space` + `me` в стор и на бэкенд.
5. **Home V1** — с моком партнёра (`partnerMood: "calm"` как в прототипе).
6. **Check-in + Guess** — sheet-компонент, интеграция со стором.
7. **Reveal V1** — статичная версия, интеграция с Story.
8. **Together / Story / Мы** — по одному экрану.
9. **Share Cards** — рендер через `html-to-image` или Canvas API, экспорт PNG 1080×1920.
10. **Reveal V2** — как feature-flag `?reveal=envelope`, плавно раскатать.
11. **Партнёр в реалтайме** — WebSocket / SSE от бэка, синк `today.partner*`.
12. **Icons custom set + анимации + haptics** (Telegram `HapticFeedback` на CTA-тапы).

---

## 12. Open Questions (согласовать до реализации)

- [ ] Финальный стиль Wego — A (Premium sticker) или B (Cozy Japanese)?
- [ ] Home — V1 (Room) или V2 (Character) как дефолт?
- [ ] Reveal — V2 (envelope) как основной путь, или feature-flag?
- [ ] Как обрабатываем поздний ответ партнёра (после полуночи)? — записывается «задним числом» или в следующий день?
- [ ] Триггеры эволюции Wego (egg → baby → adult) — формула согласована? (в прототипе — заглушка `stage: "adult"`).
- [ ] Custom icon-set — брать Lucide/Phosphor как стартовый, или сразу заказывать кастомные?
- [ ] Telegram Bot handshake для инвайтов — deep-link `t.me/wego_bot/join/<code>` или собственный ссылочный сервис?
- [ ] Аналитика — Amplitude / PostHog? Ключевые события: `checkin_completed`, `guess_saved`, `reveal_opened`, `story_saved`, `share_exported`.
- [ ] Приватность — где хранится note-цитата? Шифруется e2e или plain в БД?

---

## 13. Contact

Дизайн-автор: **Ильяс Азелханов** — CEO NAVYK / AlmaU / QazInnovations.  
Вопросы по прототипу — в этот же чат в Genspark Design; вопросы по имплементации — открывать issue в целевом репозитории.

—

*Файл написан как самодостаточный источник истины. Если что-то в прототипе противоречит README — верным считать прототип; сообщить дизайнеру для правки README.*

---

## 14. Living World и экономика

Текущий локальный вертикальный срез включает живую комнату, отдельный спрайт Wego, Sparks, guardrails против фарма, гардероб, лавку, общие планы, мини-игру и память. Правила источников/стоков, Stars-подарков, региональных тиров и production-конфигурации описаны в [`docs/operations/telegram-stars.md`](docs/operations/telegram-stars.md).

Живая комната построена на React 19 + TypeScript + Zustand: фон, мебель, state-слои и персонаж разделены, а клики меняют окружение (свет, шторы, чай, растения). Каталог предметов общий для клиента и API; купленное хранится в коллекции, устанавливается из лавки или гардероба и сохраняется в localStorage. Для микродвижений используются CSS keyframes, для будущего более сложного рендера уже подготовлен opt-in PixiJS-адаптер; локальный preview не имитирует успешную оплату Telegram Stars.
