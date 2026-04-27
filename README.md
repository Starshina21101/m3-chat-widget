# M3 Chat Widget — Эмка

AI-консультант **«Эмка»** для сети детейлинг-центров **М3** (Санкт-Петербург, https://m3-spb.ru/).

Self-contained JavaScript-виджет: один файл, одна строка подключения, никаких зависимостей.

---

## Быстрая установка

### Песочница / любой сайт через CDN (jsDelivr)

Вставить **одну строку** перед закрывающим `</body>`:

```html
<script defer src="https://cdn.jsdelivr.net/gh/Starshina21101/m3-chat-widget@main/m3-chat.js"></script>
```

Виджет сам:
- Инжектит CSS.
- Создаёт кнопку М3 в правом нижнем углу.
- Создаёт окно чата.
- Подключает обработчики.

Никакого другого HTML/CSS/JS на странице **не нужно**.

### Прод (m3-spb.ru) — через локальный файл

Для боевого сайта рекомендуется не зависеть от внешнего CDN:

```bash
gh release download v1.0.0 --pattern m3-chat.js
# положить в /static/m3-chat.js на сервере
```

Подключение:

```html
<script defer src="/static/m3-chat.js"></script>
```

---

## Дополнительно

### Открыть чат программно

```html
<button class="m3-chat-open">Связаться с Эмкой</button>
```

или из JS:

```js
window.openM3Chat();
```

### Конфигурация

Все настройки вшиты в `CONFIG` в начале файла:

| Параметр | Значение | Что делает |
|---|---|---|
| `webhookUrl` | `https://n8n.golubef.ru/webhook/chat-m3` | Endpoint бека |
| `fetchTimeoutMs` | `30000` | Таймаут на ответ от n8n |
| `historyTtlMs` | `24h` | Сколько хранится история чата в `localStorage` |
| `messageLimit` | `30` | Максимум сообщений за сессию (защита от спама) |
| `operatorPhone` | `+7 (812) 421-8527` | Телефон оператора в fallback-сообщениях |

---

## Архитектура

```
[Браузер]                  [n8n]                        [внешние]
  виджет.js  ──POST──▶   webhook/chat-m3 ──▶  OpenAI / Supabase / Telegram
   ▲                          │
   └────────JSON{response}────┘
```

Подробная архитектура — в `docs/ARCHITECTURE.md` в основном проекте М3.

---

## Что внутри

- **No deps** — чистый ES2017+ JavaScript, никаких npm/build.
- **XSS-safe** — все пользовательские и AI-сообщения рендерятся через `textContent`, не `innerHTML`.
- **`crypto.randomUUID()`** для sessionId и userId.
- **Persisted history** — чат хранится в `localStorage` 24 часа, восстанавливается через структурированный массив (никакого хранения сырого HTML).
- **Timeout 30s** на запросы к n8n с `AbortController`.
- **Message limit** — 30 сообщений за сессию, защита от ботов и улёта счёта на OpenAI.
- **Адаптив** — на мобильных разворачивается на весь экран.
- **iOS-фиксы** — фиксирует body при фокусе input, чтобы клавиатура не съезжала.

---

## API виджета

### `window.M3Chat`

Полный экземпляр виджета. Полезные методы для отладки:

```js
M3Chat.toggle();       // открыть/закрыть
M3Chat.clearChat();    // сбросить историю
M3Chat.sessionId;      // текущая сессия
M3Chat.userId;         // ID посетителя
M3Chat.history;        // массив сообщений
```

### `window.openM3Chat()`

Открыть чат, если он закрыт. Полезно для подключения к кастомным кнопкам:

```html
<button onclick="openM3Chat()">Спросить Эмку</button>
```

Любая кнопка с классом `.m3-chat-open` подцепляется автоматически — не нужно вешать обработчик.

---

## Известные ограничения

- Webhook на стороне n8n сейчас **открыт** (без auth-токена). Любой может слать запросы напрямую. Будет закрыто Bearer-токеном в следующей версии.
- Лимит истории чата — 24 часа. Дольше держать в `localStorage` мусорно.
- Нет поддержки старых браузеров (`crypto.randomUUID`, `AbortController` — везде кроме IE11).

---

## Разработка

```bash
git clone https://github.com/Starshina21101/m3-chat-widget.git
cd m3-chat-widget
# открой index-dev.html в браузере для локального теста
```

Минификация (опционально, для прода):

```bash
npx terser m3-chat.js -o m3-chat.min.js -c -m --comments false
```

---

## Версии

См. [CHANGELOG.md](CHANGELOG.md).

---

## Лицензия и контакты

Закрытый проект. Все вопросы — к Александру Голубеффу (golubefai@gmail.com).
