# Changelog

Все значимые изменения виджета M3 Chat. Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии — [Semantic Versioning](https://semver.org/lang/ru/).

## [Unreleased]

## [1.0.0] — 2026-04-27

Первая версия для тестов на песочнице (sandbox.golubef.ru).

### Что есть
- Self-contained JS-виджет: одной строкой `<script src="...">` подключается на любой странице.
- Инжектит CSS, создаёт DOM (кнопка + окно), привязывает обработчики.
- Интеграция с n8n: `https://n8n.golubef.ru/webhook/chat-m3`.
- Локальная история чата в `localStorage` (TTL 24ч), structured-формат.
- `sessionId` и `userId` через `crypto.randomUUID()`.
- Лимит 30 сообщений за сессию.
- Таймаут 30 секунд на запросы с `AbortController`.
- Блокировка input + кнопки + быстрых команд во время ожидания ответа.
- 3 быстрые кнопки: Адреса, Записаться, Оператор.
- Адаптив (мобильная разворотка на весь экран) + iOS-фиксы клавиатуры.
- Глобальный API `window.M3Chat` и `window.openM3Chat()`.
- Автоподцеп ко всем `.m3-chat-open` элементам на странице.

### Закрытые баги (vs Chat.md от 07.12.2025)
- **B-1** Двойной `DOMContentLoaded` — виджет инициализировался два раза.
- **B-2** XSS через `innerHTML` в сообщениях — теперь все сообщения через `textContent`.
- **B-3** Persisted XSS в `localStorage` — теперь храним структурированный массив `[{text, sender, time}]`, а не сырой HTML.
- **B-5** Нет `fetch` timeout — добавлен `AbortController` с таймаутом 30с.
- **B-6** Слабый `sessionId` (`Math.random` + `Date.now`) — теперь `crypto.randomUUID()` с fallback.
- **B-7** Нет `MESSAGELIMIT` — добавлен лимит 30 сообщений за сессию.
- **B-8** Поле ввода не блокировалось во время ожидания — теперь блокируется input + send + quick.
- **B-10** Нет userId — добавлен персистентный `userId = guest_<uuid>`.

### Открыто (планируется в будущих версиях)
- **B-4** Открытый webhook — нужно добавить `Authorization: Bearer` (требует правок n8n).
- **B-9** Прибитый статус «Онлайн 24/7» — опционально, не критично.
- Динамические quick-replies от Эмки.
- Минифицированная сборка `m3-chat.min.js` через CI.
