/**
 * M3 Chat Widget — Эмка
 * AI-консультант для сети детейлинг-центров М3 (СПб).
 *
 * Self-contained widget: одним <script src="..."> подключается на странице,
 * сам инжектит CSS, рендерит DOM, обрабатывает события.
 *
 * Версия: 1.0.1
 * Репо: https://github.com/Starshina21101/m3-chat-widget
 */
(function () {
  "use strict";

  if (window.M3Chat && window.M3Chat.__initialized) return;

  const CONFIG = {
    webhookUrl: "https://n8n.golubef.ru/webhook/chat-m3",
    fetchTimeoutMs: 30000,
    historyTtlMs: 24 * 60 * 60 * 1000,
    messageLimit: 30,
    storageKeys: {
      sessionId: "m3_session_id",
      userId: "m3_user_id",
      history: "m3_chat_history",
    },
    operatorPhone: "+7 (812) 421-8527",
    logoUrl:
      "https://optim.tildacdn.com/tild6163-6165-4633-a533-356165663362/-/resize/68x/-/format/webp/logotip3.png.webp",
  };

  const CSS = `
    .m3-chat-button { position: fixed; bottom: 20px; right: 20px; width: 70px; height: 70px;
      background: linear-gradient(135deg, #dc1f25, #b41c21); border-radius: 50%;
      cursor: pointer; z-index: 2147483000; box-shadow: 0 6px 25px rgba(220,31,37,.45);
      display: flex; align-items: center; justify-content: center;
      transition: transform .3s cubic-bezier(.4,0,.2,1), box-shadow .3s;
      border: 3px solid rgba(255,255,255,.2); font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
    .m3-chat-button:hover { transform: scale(1.08); box-shadow: 0 10px 30px rgba(220,31,37,.6); }
    .m3-logo-text { font-size: 28px; font-weight: 900; color: #fff;
      text-shadow: 0 2px 4px rgba(0,0,0,.3); letter-spacing: 1px; }
    .m3-chat-badge { position: absolute; top: -8px; right: -8px; background: #ff4757; color: #fff;
      border-radius: 50%; width: 24px; height: 24px; font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; border: 3px solid #fff;
      animation: m3-pulse 2s infinite; }
    @keyframes m3-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }

    .m3-chat-widget { position: fixed; bottom: 110px; right: 20px; width: 420px; height: 600px;
      background: #fff; border-radius: 20px; box-shadow: 0 15px 50px rgba(0,0,0,.2);
      display: none; flex-direction: column; z-index: 2147483001; overflow: hidden;
      border: 1px solid rgba(220,31,37,.18);
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
    @media (max-width: 768px) {
      .m3-chat-widget { bottom: 0; right: 0; left: 0; top: 0; width: 100vw; height: 100vh;
        height: -webkit-fill-available; border-radius: 0; max-height: none; }
      .m3-chat-button { bottom: 20px; right: 20px; width: 60px; height: 60px; }
      .m3-logo-text { font-size: 24px; }
    }

    .m3-chat-header { background: linear-gradient(135deg, #dc1f25, #b41c21); color: #fff;
      padding: 18px 20px; display: flex; justify-content: space-between; align-items: center;
      position: relative; }
    .m3-header-left { display: flex; align-items: center; gap: 12px; z-index: 1; }
    .m3-header-logo { width: 42px; height: 42px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,.2)); }
    .m3-header-text { display: flex; flex-direction: column; }
    .m3-chat-title { font-weight: 700; font-size: 18px; letter-spacing: -.3px;
      text-shadow: 0 1px 3px rgba(0,0,0,.25); }
    .m3-chat-status { font-size: 12px; opacity: .92; font-weight: 400; margin-top: 2px;
      display: flex; align-items: center; gap: 6px; }
    .m3-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #2ecc71;
      box-shadow: 0 0 0 2px rgba(46,204,113,.25); flex-shrink: 0;
      animation: m3-status-pulse 2s infinite; }
    .m3-status-dot.offline { background: #b0b3b8; box-shadow: 0 0 0 2px rgba(176,179,184,.2);
      animation: none; }
    @keyframes m3-status-pulse { 0%,100% { box-shadow: 0 0 0 2px rgba(46,204,113,.25); }
      50% { box-shadow: 0 0 0 5px rgba(46,204,113,.05); } }
    .m3-chat-controls { display: flex; gap: 8px; z-index: 1; }
    .m3-control-btn { background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.22);
      color: #fff; cursor: pointer; padding: 0; border-radius: 8px;
      transition: background .2s, transform .2s; width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center; }
    .m3-control-btn:hover { background: rgba(255,255,255,.28); transform: translateY(-1px); }
    .m3-control-btn svg { width: 14px; height: 14px; fill: currentColor; }

    .m3-chat-messages { flex: 1; overflow-y: auto; padding: 20px; background: #fafbfc;
      -webkit-overflow-scrolling: touch; }
    .m3-message { margin-bottom: 16px; display: flex; align-items: flex-start;
      animation: m3-slide-in .35s ease-out; }
    @keyframes m3-slide-in { from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); } }
    .m3-message.user { justify-content: flex-end; }
    .m3-message-content { max-width: 82%; padding: 13px 17px; border-radius: 18px;
      font-size: 15px; line-height: 1.5; word-wrap: break-word; position: relative;
      white-space: pre-wrap; }
    .m3-message.bot .m3-message-content { background: #fff; border: 1px solid #e3e5e8;
      color: #2c3e50; border-bottom-left-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .m3-message.user .m3-message-content { background: linear-gradient(135deg, #dc1f25, #b41c21);
      color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 3px 12px rgba(220,31,37,.35); }
    .m3-message-time { font-size: 11px; color: #999; margin-top: 6px; text-align: right;
      font-weight: 500; }
    .m3-message.user .m3-message-time { color: rgba(255,255,255,.85); }

    .m3-chat-input { padding: 16px 20px 12px; border-top: 1px solid #e8eaed; background: #fff; }
    .m3-input-group { display: flex; align-items: flex-end; background: #f8f9fa;
      border: 2px solid #e8eaed; border-radius: 25px; padding: 7px;
      transition: border-color .25s, background .25s, box-shadow .25s; min-height: 52px; }
    .m3-input-group:focus-within { border-color: #dc1f25; background: #fff;
      box-shadow: 0 0 0 4px rgba(220,31,37,.14); }
    .m3-input-field { flex: 1; border: 0; background: transparent; padding: 11px 16px; outline: 0;
      font-size: 15px; line-height: 1.4; resize: none; font-family: inherit; min-height: 22px;
      max-height: 130px; overflow-y: auto; -webkit-appearance: none; border-radius: 0;
      transform: translateZ(0); }
    @supports (-webkit-touch-callout: none) {
      .m3-input-field { font-size: 16px; }
    }
    .m3-input-field:disabled { opacity: .6; cursor: not-allowed; }

    .m3-send-btn { background: linear-gradient(135deg, #dc1f25, #b41c21); border: 0; color: #fff;
      width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(220,31,37,.3); }
    .m3-send-btn:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(220,31,37,.4); }
    .m3-send-btn:active { transform: scale(.92); }
    .m3-send-btn:disabled { background: #bbb; cursor: not-allowed; transform: none; box-shadow: none; }
    .m3-send-btn svg { width: 22px; height: 22px; fill: currentColor; }

    .m3-quick-buttons { display: flex; gap: 8px; margin-top: 8px; padding: 0 4px; }
    .m3-quick-btn { flex: 1; background: #fff; border: 1.5px solid #dc1f25; color: #dc1f25;
      padding: 8px 10px; border-radius: 10px; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background .2s, color .2s, transform .2s; white-space: nowrap;
      font-family: inherit; }
    .m3-quick-btn:hover { background: #dc1f25; color: #fff; transform: translateY(-1px); }
    .m3-quick-btn:active { transform: translateY(0); }
    .m3-quick-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    .m3-typing-indicator { display: none; padding: 12px 20px; color: #666; font-style: italic;
      font-size: 14px; background: #fff; border-top: 1px solid #e8eaed; }
    .m3-typing-dots { display: inline-flex; align-items: center; gap: 4px; }
    .m3-typing-dots span { width: 8px; height: 8px; border-radius: 50%; background: #dc1f25;
      animation: m3-typing 1.4s infinite ease-in-out; }
    .m3-typing-dots span:nth-child(2) { animation-delay: .2s; }
    .m3-typing-dots span:nth-child(3) { animation-delay: .4s; }
    @keyframes m3-typing { 0%,60%,100% { transform: scale(.8); opacity: .5; }
      30% { transform: scale(1.2); opacity: 1; } }

    @keyframes m3-show { from { transform: translateY(100%) scale(.92); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; } }
    .m3-chat-widget.show { display: flex; animation: m3-show .45s cubic-bezier(.4,0,.2,1); }

    .m3-chat-messages::-webkit-scrollbar { width: 7px; }
    .m3-chat-messages::-webkit-scrollbar-track { background: transparent; }
    .m3-chat-messages::-webkit-scrollbar-thumb { background: rgba(220,31,37,.35); border-radius: 4px; }
    .m3-chat-messages::-webkit-scrollbar-thumb:hover { background: rgba(220,31,37,.55); }
  `;

  const SVG = {
    trash:
      "M6 7h12l-1.5 9c-.1.7-.8 1.2-1.5 1.2H9c-.7 0-1.4-.5-1.5-1.2L6 7zm3-3V3c0-.6.4-1 1-1h4c.6 0 1 .4 1 1v1h4v2H5V4h4zm-1 4v6h2V8H8zm4 0v6h2V8h-2z",
    close:
      "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    send: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
  };

  const WELCOME_LINES = [
    "Привет! Я Эмка, ваш AI-консультант детейлинг-центров М3",
    "",
    "Помогу вам с:",
    "• Записью на мойку и детейлинг",
    "• Ценами и акциями",
    "• Поиском ближайшей студии",
    "• Подбором услуг под ваш автомобиль",
    "",
    "Команды помощи:",
    "• Адреса — список всех 12 студий",
    "• /запись — запись на услугу",
    "• Оператор — связь с менеджером",
    "• Помощь — контакты и информация",
    "",
    "Задавайте любые вопросы или используйте быстрые команды!",
  ];

  const CLEARED_LINES = [
    "Чат очищен! Готова помочь с детейлингом М3",
    "",
    "Что вас интересует?",
  ];

  function uuid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function nowTimeStr() {
    return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  function readJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      /* quota / private mode — ignore */
    }
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  function svgIcon(pathD, size) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    if (size) {
      svg.setAttribute("width", String(size));
      svg.setAttribute("height", String(size));
    }
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", pathD);
    svg.appendChild(path);
    return svg;
  }

  function el(tag, opts) {
    const node = document.createElement(tag);
    if (!opts) return node;
    if (opts.className) node.className = opts.className;
    if (opts.id) node.id = opts.id;
    if (opts.text != null) node.textContent = String(opts.text);
    if (opts.attrs) {
      for (const k in opts.attrs) {
        if (Object.prototype.hasOwnProperty.call(opts.attrs, k)) {
          node.setAttribute(k, opts.attrs[k]);
        }
      }
    }
    if (opts.children) {
      for (const child of opts.children) {
        if (child) node.appendChild(child);
      }
    }
    return node;
  }

  function buildButton() {
    return el("div", {
      className: "m3-chat-button",
      id: "m3ChatButton",
      attrs: { role: "button", "aria-label": "Открыть чат" },
      children: [
        el("div", { className: "m3-logo-text", text: "М3" }),
        el("div", {
          className: "m3-chat-badge",
          id: "m3ChatBadge",
          text: "1",
          attrs: { style: "display:none" },
        }),
      ],
    });
  }

  function buildHeader() {
    const logo = el("img", {
      className: "m3-header-logo",
      attrs: { src: CONFIG.logoUrl, alt: "" },
    });
    const statusDot = el("span", {
      className: "m3-status-dot",
      id: "m3StatusDot",
      attrs: { "aria-hidden": "true" },
    });
    const statusText = el("span", { id: "m3StatusText", text: "Детейлинг СПб • Онлайн" });
    const status = el("div", {
      className: "m3-chat-status",
      children: [statusDot, statusText],
    });
    const text = el("div", {
      className: "m3-header-text",
      children: [
        el("div", { className: "m3-chat-title", text: "Эмка • Консультант М3" }),
        status,
      ],
    });
    const left = el("div", {
      className: "m3-header-left",
      children: [logo, text],
    });

    const clearBtn = el("button", {
      className: "m3-control-btn",
      id: "m3ClearBtn",
      attrs: { type: "button", "aria-label": "Очистить чат", title: "Очистить чат" },
      children: [svgIcon(SVG.trash)],
    });
    const closeBtn = el("button", {
      className: "m3-control-btn",
      id: "m3CloseBtn",
      attrs: { type: "button", "aria-label": "Закрыть чат", title: "Закрыть" },
      children: [svgIcon(SVG.close)],
    });
    const controls = el("div", {
      className: "m3-chat-controls",
      children: [clearBtn, closeBtn],
    });

    return el("div", { className: "m3-chat-header", children: [left, controls] });
  }

  function buildTyping() {
    const dotsWrap = el("span", {
      className: "m3-typing-dots",
      children: [el("span"), el("span"), el("span")],
    });
    const ind = el("div", { className: "m3-typing-indicator", id: "m3TypingIndicator" });
    ind.appendChild(document.createTextNode("Эмка печатает "));
    ind.appendChild(dotsWrap);
    return ind;
  }

  function buildInput() {
    const textarea = el("textarea", {
      className: "m3-input-field",
      id: "m3MessageInput",
      attrs: {
        placeholder: "Напишите ваш вопрос...",
        rows: "1",
        autocomplete: "off",
      },
    });
    const sendBtn = el("button", {
      className: "m3-send-btn",
      id: "m3SendBtn",
      attrs: { type: "button", "aria-label": "Отправить" },
      children: [svgIcon(SVG.send, 22)],
    });
    const group = el("div", {
      className: "m3-input-group",
      children: [textarea, sendBtn],
    });

    const quickConfigs = [
      { label: "Адреса", value: "Какие у вас адреса?" },
      { label: "Записаться", value: "/запись" },
      { label: "Оператор", value: "Оператор" },
    ];
    const quickBtns = quickConfigs.map((q) =>
      el("button", {
        className: "m3-quick-btn",
        text: q.label,
        attrs: { type: "button", "data-quick": q.value },
      })
    );
    const quickRow = el("div", { className: "m3-quick-buttons", children: quickBtns });

    return el("div", { className: "m3-chat-input", children: [group, quickRow] });
  }

  function buildWidget() {
    const messages = el("div", { className: "m3-chat-messages", id: "m3ChatMessages" });
    return el("div", {
      className: "m3-chat-widget",
      id: "m3ChatWidget",
      attrs: { role: "dialog", "aria-label": "Чат с Эмкой" },
      children: [buildHeader(), messages, buildTyping(), buildInput()],
    });
  }

  const M3Chat = {
    __initialized: false,
    isOpen: false,
    sessionId: null,
    userId: null,
    messageCounter: 0,
    history: [],
    waitingForReply: false,
    abortController: null,
    els: {},

    init() {
      if (this.__initialized) return;

      this._injectStyles();
      this._injectMarkup();
      this._cacheElements();
      this._initIdentity();
      this._loadHistory();
      this._renderHistoryOrWelcome();
      this._bindEvents();
      this._setupIOSFixes();

      this.__initialized = true;
    },

    _injectStyles() {
      if (document.getElementById("m3-chat-styles")) return;
      const style = document.createElement("style");
      style.id = "m3-chat-styles";
      style.textContent = CSS;
      document.head.appendChild(style);
    },

    _injectMarkup() {
      if (document.getElementById("m3ChatWidget")) return;
      const root = el("div", { id: "m3-chat-root" });
      root.appendChild(buildButton());
      root.appendChild(buildWidget());
      document.body.appendChild(root);
    },

    _cacheElements() {
      this.els = {
        button: document.getElementById("m3ChatButton"),
        badge: document.getElementById("m3ChatBadge"),
        widget: document.getElementById("m3ChatWidget"),
        messages: document.getElementById("m3ChatMessages"),
        typing: document.getElementById("m3TypingIndicator"),
        input: document.getElementById("m3MessageInput"),
        sendBtn: document.getElementById("m3SendBtn"),
        clearBtn: document.getElementById("m3ClearBtn"),
        closeBtn: document.getElementById("m3CloseBtn"),
        quickBtns: document.querySelectorAll(".m3-quick-btn"),
        statusDot: document.getElementById("m3StatusDot"),
        statusText: document.getElementById("m3StatusText"),
      };
    },

    _setOnline(isOnline) {
      if (!this.els.statusDot) return;
      if (isOnline) {
        this.els.statusDot.classList.remove("offline");
        this.els.statusText.textContent = "Детейлинг СПб • Онлайн";
      } else {
        this.els.statusDot.classList.add("offline");
        this.els.statusText.textContent = "Детейлинг СПб • Не в сети";
      }
    },

    _initIdentity() {
      const stored = readJSON(CONFIG.storageKeys.sessionId);
      const isFresh =
        stored &&
        stored.id &&
        stored.createdAt &&
        Date.now() - stored.createdAt < CONFIG.historyTtlMs;
      if (isFresh) {
        this.sessionId = stored.id;
      } else {
        this.sessionId = "web_" + uuid();
        writeJSON(CONFIG.storageKeys.sessionId, { id: this.sessionId, createdAt: Date.now() });
      }

      let userId = localStorage.getItem(CONFIG.storageKeys.userId);
      if (!userId) {
        userId = "guest_" + uuid();
        try {
          localStorage.setItem(CONFIG.storageKeys.userId, userId);
        } catch (_) {
          /* private mode — ignore */
        }
      }
      this.userId = userId;
    },

    _loadHistory() {
      const stored = readJSON(CONFIG.storageKeys.history);
      if (!stored || !stored.timestamp || !Array.isArray(stored.messages)) {
        this.history = [];
        return;
      }
      if (Date.now() - stored.timestamp > CONFIG.historyTtlMs) {
        localStorage.removeItem(CONFIG.storageKeys.history);
        this.history = [];
        return;
      }
      this.history = stored.messages.filter(
        (m) => m && typeof m.text === "string" && (m.sender === "user" || m.sender === "bot")
      );
      this.messageCounter = this.history.filter((m) => m.sender === "user").length;
    },

    _saveHistory() {
      writeJSON(CONFIG.storageKeys.history, {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        messages: this.history,
      });
    },

    _clearMessagesDom() {
      const m = this.els.messages;
      while (m.firstChild) m.removeChild(m.firstChild);
    },

    _renderHistoryOrWelcome() {
      this._clearMessagesDom();
      if (this.history.length === 0) {
        this._renderMessage(WELCOME_LINES.join("\n"), "bot", null, false);
      } else {
        for (const m of this.history) {
          this._renderMessage(m.text, m.sender, m.time || null, false);
        }
      }
      this._scrollToBottom();
    },

    _bindEvents() {
      this.els.button.addEventListener("click", () => this.toggle());
      this.els.closeBtn.addEventListener("click", () => this.toggle());
      this.els.clearBtn.addEventListener("click", () => this.clearChat());
      this.els.sendBtn.addEventListener("click", () => this.sendMessage());

      this.els.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      this.els.input.addEventListener("input", () => this._autoResize());

      this.els.quickBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const text = btn.getAttribute("data-quick") || btn.textContent.trim();
          this._sendText(text);
        });
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen) this.toggle();
      });

      // Внешние кнопки .m3-chat-open в макете сайта
      document.querySelectorAll(".m3-chat-open").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          if (!this.isOpen) this.toggle();
        });
      });
    },

    _setupIOSFixes() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (!isIOS) return;
      this.els.input.addEventListener("focus", () => {
        document.body.style.position = "fixed";
        document.body.style.width = "100%";
      });
      this.els.input.addEventListener("blur", () => {
        document.body.style.position = "";
        document.body.style.width = "";
      });
    },

    toggle() {
      const w = this.els.widget;
      if (this.isOpen) {
        w.classList.remove("show");
        setTimeout(() => {
          w.style.display = "none";
        }, 400);
        this.isOpen = false;
      } else {
        w.style.display = "flex";
        // forced reflow для запуска анимации
        void w.offsetHeight;
        w.classList.add("show");
        this.isOpen = true;
        this.els.badge.style.display = "none";
        setTimeout(() => {
          this._scrollToBottom();
          if (window.innerWidth > 768) this.els.input.focus();
        }, 100);
      }
    },

    sendMessage() {
      const text = this.els.input.value.trim();
      if (!text) return;
      this.els.input.value = "";
      this._autoResize();
      this._sendText(text);
    },

    async _sendText(text) {
      if (this.waitingForReply) return;

      if (this.messageCounter >= CONFIG.messageLimit) {
        this._renderMessage(
          "Чат ограничен по количеству сообщений за сессию. Обновите страницу для нового диалога или напишите оператору: " +
            CONFIG.operatorPhone,
          "bot"
        );
        return;
      }

      this._renderMessage(text, "user");
      this.messageCounter++;

      this._setWaiting(true);

      this.abortController = new AbortController();
      const timeoutId = setTimeout(() => this.abortController.abort(), CONFIG.fetchTimeoutMs);

      try {
        const response = await fetch(CONFIG.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId: this.sessionId,
            userId: this.userId,
            firstname: "Посетитель",
            username: "web_user",
            timestamp: new Date().toISOString(),
          }),
          signal: this.abortController.signal,
        });

        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (data && typeof data.sessionId === "string" && data.sessionId !== this.sessionId) {
          this.sessionId = data.sessionId;
          writeJSON(CONFIG.storageKeys.sessionId, {
            id: this.sessionId,
            createdAt: Date.now(),
          });
        }

        const reply =
          (data && typeof data.response === "string" && data.response) ||
          'Извините, произошла ошибка. Попробуйте ещё раз или напишите "Оператор" для связи с менеджером.';
        this._renderMessage(reply, "bot");
        this._setOnline(true);
      } catch (err) {
        this._setOnline(false);
        if (err && err.name === "AbortError") {
          this._renderMessage(
            "Не дождалась ответа. Попробуйте ещё раз или напишите оператору: " +
              CONFIG.operatorPhone,
            "bot"
          );
        } else {
          this._renderMessage(
            'Ошибка соединения. Проверьте интернет или напишите "Помощь" для получения контактов.',
            "bot"
          );
        }
      } finally {
        clearTimeout(timeoutId);
        this.abortController = null;
        this._setWaiting(false);
      }
    },

    _setWaiting(isWaiting) {
      this.waitingForReply = isWaiting;
      this.els.sendBtn.disabled = isWaiting;
      this.els.input.disabled = isWaiting;
      this.els.quickBtns.forEach((b) => (b.disabled = isWaiting));
      this.els.typing.style.display = isWaiting ? "block" : "none";
      if (isWaiting) this._scrollToBottom();
      else if (window.innerWidth > 768) this.els.input.focus();
    },

    _renderMessage(text, sender, time, save) {
      const safeText = typeof text === "string" ? text : String(text == null ? "" : text);
      const safeSender = sender === "user" ? "user" : "bot";
      const shouldSave = save !== false;

      const wrap = el("div", { className: "m3-message " + safeSender });
      const content = el("div", { className: "m3-message-content" });

      // XSS-safe: textContent + CSS white-space: pre-wrap для переносов строк
      const textNode = el("span", { text: safeText });
      content.appendChild(textNode);

      const timeStr = time || nowTimeStr();
      const timeEl = el("div", { className: "m3-message-time", text: timeStr });
      content.appendChild(timeEl);

      wrap.appendChild(content);
      this.els.messages.appendChild(wrap);
      this._scrollToBottom();

      if (safeSender === "bot" && !this.isOpen) {
        this.els.badge.style.display = "flex";
      }

      if (shouldSave) {
        this.history.push({ text: safeText, sender: safeSender, time: timeStr });
        this._saveHistory();
      }
    },

    _scrollToBottom() {
      const m = this.els.messages;
      m.scrollTop = m.scrollHeight;
    },

    _autoResize() {
      const t = this.els.input;
      t.style.height = "22px";
      t.style.height = Math.min(t.scrollHeight, 130) + "px";
    },

    clearChat() {
      if (!window.confirm("Очистить историю чата?")) return;
      this.history = [];
      this.messageCounter = 0;
      localStorage.removeItem(CONFIG.storageKeys.history);
      // Новый sessionId, чтобы агент начал чистый контекст
      this.sessionId = "web_" + uuid();
      writeJSON(CONFIG.storageKeys.sessionId, { id: this.sessionId, createdAt: Date.now() });
      this._clearMessagesDom();
      this._renderMessage(CLEARED_LINES.join("\n"), "bot", null, false);
    },
  };

  // Глобальный API
  window.M3Chat = M3Chat;
  window.openM3Chat = function () {
    if (!M3Chat.__initialized) M3Chat.init();
    if (!M3Chat.isOpen) M3Chat.toggle();
  };

  function start() {
    M3Chat.init();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
