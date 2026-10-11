/*
 * Pomodoro Timer: one file, no build step, no dependencies.
 *
 * Structure
 *   1. Copy ........... English and Turkish strings (STR, from translations.js)
 *   2. Persistence .... localStorage keys, guarded read/write, validated loaders
 *   3. State .......... one object; the screen is a function of it (render)
 *   4. Rendering ...... render() on state changes, renderClock() four times a second
 *   5. Language, theme, task title, audio and wake lock
 *   6. Timer .......... start, pause, reset, skip, complete (cycle of four rounds)
 *   7. Events ......... buttons, inputs, keyboard shortcuts (Space, R, S)
 *
 * Persisted: language, theme, task title, settings, today's counters and log, and the
 * current session (mode, cycle position, countdown) so a refresh picks up where it left off.
 */
(function () {
  'use strict';

  const D = document;
  const root = D.documentElement;
  const $ = (s) => D.querySelector(s);
  const $$ = (s) => Array.from(D.querySelectorAll(s));
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const toInt = (v, min, max) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  };

  /* ---------- Copy (English and Turkish), loaded from translations.js ---------- */
  const STR = window.POMO_STR;

  /* ---------- Persistence: one thin layer over localStorage ---------- */
  const KEYS = {
    lang: 'pomo.lang',         /* 'en' | 'tr' */
    theme: 'pomo.theme',       /* 'light' | 'dark'; absent means follow the device */
    task: 'pomo.task',         /* task title text */
    settings: 'pomo.settings', /* durations, goal, switches */
    session: 'pomo.session',   /* current mode, cycle position and countdown */
    stats: 'pomo.stats'        /* today's count, focused seconds and session log */
  };
  const storage = {
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable: state lasts for this visit only */ }
    }
  };

  const DEFAULT_SETTINGS = { focus: 25, short: 5, long: 15, goal: 8, auto: false, sound: true };
  const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const emptyStats = () => ({ day: dayKey(), count: 0, seconds: 0, log: [] });

  function loadLang() {
    const saved = storage.read(KEYS.lang, null);
    if (saved === 'en' || saved === 'tr') return saved;
    return String(navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  }
  function loadTheme() {
    const saved = storage.read(KEYS.theme, null);
    return saved === 'light' || saved === 'dark' ? saved : null;
  }
  function loadTask() {
    const saved = storage.read(KEYS.task, '');
    return typeof saved === 'string' ? saved.slice(0, 80) : '';
  }
  function loadSettings() {
    const saved = storage.read(KEYS.settings, null);
    const s = Object.assign({}, DEFAULT_SETTINGS);
    if (saved && typeof saved === 'object') {
      ['focus', 'short', 'long'].forEach((k) => { const v = toInt(saved[k], 1, 99); if (v !== null) s[k] = v; });
      const g = toInt(saved.goal, 1, 24);
      if (g !== null) s.goal = g;
      if (typeof saved.auto === 'boolean') s.auto = saved.auto;
      if (typeof saved.sound === 'boolean') s.sound = saved.sound;
    }
    return s;
  }
  function loadStats() {
    const saved = storage.read(KEYS.stats, null);
    if (!saved || typeof saved !== 'object' || saved.day !== dayKey()) return emptyStats();
    const log = Array.isArray(saved.log)
      ? saved.log.filter((e) => e && Number.isFinite(e.t) && Number.isFinite(e.m)).slice(-50)
      : [];
    return {
      day: saved.day,
      count: Math.max(0, parseInt(saved.count, 10) || 0),
      seconds: Math.max(0, parseInt(saved.seconds, 10) || 0),
      log: log.map((e) => ({ t: e.t, m: e.m, task: typeof e.task === 'string' ? e.task : '' }))
    };
  }

  /* The session open at the last visit. A countdown that ran out while the page was closed
     starts that session fresh and is not counted as a finished pomodoro. */
  function loadSession() {
    const s = storage.read(KEYS.session, null);
    if (!s || typeof s !== 'object') return null;
    const mode = ['focus', 'short', 'long'].includes(s.mode) ? s.mode : null;
    const total = toInt(s.total, 60000, 99 * 60000);
    const cyclePos = toInt(s.cyclePos, 0, 4);
    if (!mode || total === null || cyclePos === null) return null;
    let remaining = Number.isFinite(s.remaining) ? Math.min(Math.max(s.remaining, 0), total) : total;
    let running = false;
    let endAt = 0;
    if (s.running && Number.isFinite(s.endAt)) {
      const left = s.endAt - Date.now();
      if (left > 0 && left <= total) { running = true; endAt = s.endAt; remaining = left; }
      else remaining = total;
    }
    return { mode, total, remaining, running, endAt, cyclePos };
  }

  /* ---------- State: everything the UI shows comes from here ---------- */
  const state = {
    /* persisted */
    lang: loadLang(),
    theme: loadTheme(),
    task: loadTask(),
    settings: loadSettings(),
    stats: loadStats(),
    /* current session (written to localStorage by saveSession) */
    mode: 'focus',          /* 'focus' | 'short' | 'long' */
    total: 0,               /* length of the current session, ms */
    remaining: 0,           /* time left, ms */
    running: false,
    endAt: 0,               /* wall-clock end time while running */
    cyclePos: 0,            /* focus sessions finished in this cycle, 0 to 4 */
    notice: null,           /* copy key for the message under the controls */
    clearArmed: false       /* "Reset today's count" waiting for a second click */
  };
  state.total = state.remaining = state.settings.focus * 60000;

  /* Restore the session that was open before a refresh. */
  const restored = loadSession();
  if (restored) {
    state.mode = restored.mode;
    state.total = restored.total;
    state.remaining = restored.remaining;
    state.cyclePos = restored.cyclePos;
  }

  const L = () => STR[state.lang];
  const saveSettings = () => storage.write(KEYS.settings, state.settings);
  const saveStats = () => storage.write(KEYS.stats, state.stats);
  const saveSession = () => storage.write(KEYS.session, {
    mode: state.mode, total: state.total, remaining: state.remaining,
    running: state.running, endAt: state.endAt, cyclePos: state.cyclePos
  });
  function rollDay() {
    if (state.stats.day !== dayKey()) { state.stats = emptyStats(); saveStats(); }
  }

  /* ---------- Elements ---------- */
  const el = {
    app: $('#app'), time: $('#time'), caption: $('#caption'), notice: $('#notice'),
    dial: $('#dial'), ring: $('#ring'), knob: $('#knob'), ladder: $('#ladder'),
    startBtn: $('#startBtn'), startLabel: $('#startLabel'), icoPlay: $('#icoPlay'), icoPause: $('#icoPause'),
    resetBtn: $('#resetBtn'), skipBtn: $('#skipBtn'), clearBtn: $('#clearBtn'),
    task: $('#task'), goal: $('#goal'), optAuto: $('#optAuto'), optSound: $('#optSound'),
    themeBtn: $('#themeBtn'), icoMoon: $('#icoMoon'), icoSun: $('#icoSun')
  };

  /* ---------- Dial ---------- */
  const R = 140;
  const CIRC = 2 * Math.PI * R;
  el.ring.style.strokeDasharray = `${CIRC.toFixed(2)} ${CIRC.toFixed(2)}`;
  function renderRing() {
    const p = state.total ? state.remaining / state.total : 0;
    el.ring.style.strokeDashoffset = (CIRC * (1 - p)).toFixed(2);
    const a = p * 2 * Math.PI;
    el.knob.setAttribute('cx', (160 + R * Math.sin(a)).toFixed(2));
    el.knob.setAttribute('cy', (160 - R * Math.cos(a)).toFixed(2));
  }
  function snapRing() {
    el.ring.style.transition = 'none';
    renderRing();
    void el.ring.getBoundingClientRect();
    el.ring.style.transition = '';
  }

  /* ---------- Cycle ladder (built once, restyled by render) ---------- */
  const dots = [];
  let restEl = null;
  (function buildLadder() {
    for (let i = 0; i < 4; i++) {
      if (i) { const link = D.createElement('span'); link.className = 'link'; el.ladder.appendChild(link); }
      const dot = D.createElement('span');
      dot.className = 'dot';
      dot.setAttribute('data-state', 'todo');
      dots.push(dot);
      el.ladder.appendChild(dot);
    }
    const link = D.createElement('span'); link.className = 'link'; el.ladder.appendChild(link);
    restEl = D.createElement('span'); restEl.className = 'rest'; el.ladder.appendChild(restEl);
  })();

  /* ---------- Rendering ---------- */
  function fmtFocus(sec) {
    const s = L();
    let m = Math.round(sec / 60);
    if (m < 60) return `${m}<small>${s.unitMin}</small>`;
    const h = Math.floor(m / 60);
    m = m % 60;
    return `${h}<small>${s.unitH}</small> ${m}<small>${s.unitMin}</small>`;
  }
  function renderClock() {
    const secs = Math.ceil(state.remaining / 1000);
    const txt = `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
    el.time.textContent = txt;
    renderRing();
    D.title = (state.running || state.remaining !== state.total) ? `${txt} · ${L()[state.mode]}` : L().title;
  }
  function renderLog() {
    const s = L();
    const ul = $('#log');
    const items = state.stats.log.slice(-8).reverse();
    while (ul.firstChild) ul.removeChild(ul.firstChild);
    items.forEach((e) => {
      const li = D.createElement('li');
      const at = D.createElement('span');
      const what = D.createElement('span');
      const len = D.createElement('span');
      at.className = 'at';
      at.textContent = new Date(e.t).toLocaleTimeString(s.locale, { hour: '2-digit', minute: '2-digit', hour12: false });
      what.className = 'what' + (e.task ? '' : ' untitled');
      what.textContent = e.task || s.untitled;
      len.className = 'len';
      len.textContent = `${e.m} ${s.unitMin}`;
      li.append(at, what, len);
      ul.appendChild(li);
    });
    ul.toggleAttribute('hidden', items.length === 0);
    $('#logEmpty').toggleAttribute('hidden', items.length > 0);
  }
  function render() {
    rollDay();
    const s = L();
    const { mode, running, remaining, total, cyclePos, stats, settings } = state;

    root.setAttribute('data-mode', mode);
    el.app.classList.toggle('is-running', running);
    $$('.modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === mode)));
    el.caption.textContent = mode === 'focus' ? s.capFocus.replace('{n}', Math.min(cyclePos + 1, 4)) : (mode === 'short' ? s.capShort : s.capLong);
    el.notice.textContent = state.notice ? s[state.notice] : '';

    const fresh = !running && remaining === total;
    el.startLabel.textContent = running ? s.pause : (fresh ? s.start : s.resume);
    el.icoPlay.toggleAttribute('hidden', running);
    el.icoPause.toggleAttribute('hidden', !running);

    dots.forEach((d, i) => {
      d.setAttribute('data-state', i < cyclePos ? 'done' : (mode === 'focus' && i === cyclePos ? 'current' : 'todo'));
    });
    restEl.textContent = `${settings.long} ${s.unitMin}`;
    restEl.setAttribute('data-state', mode === 'long' ? 'current' : 'todo');
    const cycleText = s.cycleText.replace('{n}', cyclePos);
    $('#cycleText').textContent = cycleText;
    el.ladder.setAttribute('aria-label', cycleText);

    $('#statCount').textContent = stats.count;
    $('#statTime').innerHTML = fmtFocus(stats.seconds);
    const goalText = s.goalText.replace('{n}', stats.count).replace('{g}', settings.goal);
    $('#goalText').textContent = stats.count >= settings.goal ? `${goalText} · ${s.goalDone}` : goalText;
    $('#goalFill').style.width = `${Math.min(100, Math.round(stats.count / settings.goal * 100))}%`;
    const bar = $('#goalBar');
    bar.setAttribute('aria-valuemax', settings.goal);
    bar.setAttribute('aria-valuenow', Math.min(stats.count, settings.goal));
    bar.setAttribute('aria-label', goalText);
    $('#dateLabel').textContent = new Date().toLocaleDateString(s.locale, { weekday: 'long', day: 'numeric', month: 'long' });

    el.clearBtn.textContent = state.clearArmed ? s.clearConfirm : s.clear;
    renderLog();
    renderClock();
  }

  /* ---------- Language ---------- */
  function applyLang() {
    const s = L();
    el.app.lang = state.lang;
    root.lang = state.lang;
    $$('[data-i18n]').forEach((n) => { n.textContent = s[n.getAttribute('data-i18n')]; });
    $$('[data-i18n-html]').forEach((n) => { n.innerHTML = s[n.getAttribute('data-i18n-html')]; });
    $$('[data-i18n-ph]').forEach((n) => n.setAttribute('placeholder', s[n.getAttribute('data-i18n-ph')]));
    $$('[data-i18n-aria]').forEach((n) => n.setAttribute('aria-label', s[n.getAttribute('data-i18n-aria')]));
    $$('[data-i18n-title]').forEach((n) => n.setAttribute('title', s[n.getAttribute('data-i18n-title')]));
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === state.lang)));
    state.clearArmed = false;
    renderThemeButton();
    render();
  }
  function setLang(lang) {
    state.lang = lang;
    storage.write(KEYS.lang, lang);
    applyLang();
  }

  /* ---------- Theme: follows the device until the viewer chooses ---------- */
  let mq = null;
  try { mq = window.matchMedia('(prefers-color-scheme: dark)'); } catch (e) { mq = null; }
  function isDark() {
    const attr = root.getAttribute('data-theme');
    if (attr === 'dark') return true;
    if (attr === 'light') return false;
    return !!(mq && mq.matches);
  }
  function renderThemeButton() {
    const dark = isDark();
    const label = dark ? L().themeToLight : L().themeToDark;
    el.icoMoon.toggleAttribute('hidden', dark);
    el.icoSun.toggleAttribute('hidden', !dark);
    el.themeBtn.setAttribute('aria-label', label);
    el.themeBtn.setAttribute('title', label);
  }
  function applyTheme() {
    if (state.theme) root.setAttribute('data-theme', state.theme);
    renderThemeButton();
  }
  function setTheme(theme) {
    state.theme = theme;
    storage.write(KEYS.theme, theme);
    applyTheme();
  }
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', renderThemeButton);
    else if (mq.addListener) mq.addListener(renderThemeButton);
  }
  try {
    new MutationObserver(renderThemeButton).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) { /* the button label still updates on click */ }

  /* ---------- Task title ---------- */
  function setTask(text) {
    state.task = text;
    storage.write(KEYS.task, text);
  }

  /* ---------- Audio and wake lock (both optional) ---------- */
  let ac = null;
  function ensureAudio() {
    try {
      if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ac = new AC(); }
      if (ac && ac.state === 'suspended') ac.resume();
    } catch (e) { /* no audio */ }
  }
  /* One soft note: a sine with a fast attack and an exponential fade. */
  function note(freq, at, length, peak) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(at);
    osc.stop(at + length + 0.05);
  }
  /* End-of-session chime: three rising notes. */
  function chime() {
    if (!state.settings.sound || !ac) return;
    try {
      const now = ac.currentTime;
      [660, 880, 1175].forEach((freq, i) => note(freq, now + i * 0.18, 0.6, 0.25));
    } catch (e) { /* no audio */ }
  }
  /* Quiet confirmation sounds for the viewer's own actions; they follow the sound setting. */
  const CUES = { start: [740], pause: [520], reset: [440], skip: [600, 800], mode: [660] };
  function cue(name) {
    if (!state.settings.sound) return;
    ensureAudio();
    if (!ac) return;
    try {
      const now = ac.currentTime;
      CUES[name].forEach((freq, i) => note(freq, now + i * 0.07, 0.12, 0.12));
    } catch (e) { /* no audio */ }
  }
  /* Visual and haptic cue when a session ends. */
  function celebrate() {
    el.dial.classList.remove('flash');
    void el.dial.offsetWidth; /* restart the animation if it is still playing */
    el.dial.classList.add('flash');
    try { if (state.settings.sound && navigator.vibrate) navigator.vibrate([180, 90, 180]); } catch (e) { /* no vibration */ }
  }
  let wakeLock = null;
  function lockScreen() {
    try {
      if ('wakeLock' in navigator && !wakeLock) {
        navigator.wakeLock.request('screen').then((lock) => {
          wakeLock = lock;
          lock.addEventListener('release', () => { wakeLock = null; });
        }).catch(() => {});
      }
    } catch (e) { /* refused */ }
  }
  function unlockScreen() {
    try { if (wakeLock) wakeLock.release(); } catch (e) { /* already released */ }
    wakeLock = null;
  }

  /* ---------- Timer ---------- */
  let timerId = null;
  function stopTimer() {
    state.running = false;
    clearInterval(timerId);
    timerId = null;
    unlockScreen();
  }
  function tick() {
    if (!state.running) return;
    state.remaining = Math.max(0, state.endAt - Date.now());
    renderClock();
    if (state.remaining <= 0) complete();
  }
  function start() {
    if (state.running) return;
    ensureAudio();
    if (state.remaining <= 0) state.remaining = state.total;
    state.running = true;
    state.endAt = Date.now() + state.remaining;
    state.notice = null;
    clearInterval(timerId);
    timerId = setInterval(tick, 250);
    lockScreen();
    saveSession();
    render();
  }
  function pause() {
    if (!state.running) return;
    state.remaining = Math.max(0, state.endAt - Date.now());
    stopTimer();
    saveSession();
    render();
  }
  /* Start or pause from the viewer's own action (button or Space), with a confirming cue. */
  function toggle() {
    if (state.running) { pause(); cue('pause'); }
    else { start(); cue('start'); }
  }
  function setMode(mode, autostart) {
    stopTimer();
    state.mode = mode;
    state.total = state.remaining = state.settings[mode] * 60000;
    snapRing();
    saveSession();
    render();
    if (autostart) start();
  }
  function reset() {
    stopTimer();
    state.total = state.remaining = state.settings[state.mode] * 60000;
    state.notice = null;
    snapRing();
    saveSession();
    render();
    cue('reset');
  }
  function skip() {
    const wasRunning = state.running;
    let next = 'focus';
    if (state.mode === 'focus') next = 'short';
    else if (state.mode === 'long') state.cyclePos = 0;
    state.notice = null;
    setMode(next, wasRunning);
    cue('skip');
  }
  function complete() {
    stopTimer();
    chime();
    celebrate();
    rollDay();
    let next = 'focus';
    let notice = 'noticeBreakDone';
    if (state.mode === 'focus') {
      state.stats.count += 1;
      state.stats.seconds += Math.round(state.total / 1000);
      state.stats.log.push({ t: Date.now(), m: Math.round(state.total / 60000), task: state.task.trim().slice(0, 80) });
      state.stats.log = state.stats.log.slice(-50);
      saveStats();
      state.cyclePos += 1;
      next = state.cyclePos >= 4 ? 'long' : 'short';
      notice = next === 'long' ? 'noticeFocusLong' : 'noticeFocusShort';
    } else if (state.mode === 'long') {
      state.cyclePos = 0;
    }
    setMode(next, state.settings.auto);
    state.notice = notice;
    render();
  }

  /* ---------- Events ---------- */
  $$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.getAttribute('data-lang'))));
  el.themeBtn.addEventListener('click', () => setTheme(isDark() ? 'light' : 'dark'));
  el.dial.addEventListener('animationend', () => el.dial.classList.remove('flash'));

  el.startBtn.addEventListener('click', toggle);
  el.resetBtn.addEventListener('click', reset);
  el.skipBtn.addEventListener('click', skip);
  function selectMode(mode) {
    if (mode === state.mode) return;
    state.notice = null;
    setMode(mode, false);
    cue('mode');
  }
  $$('.modes button').forEach((b) => b.addEventListener('click', () => selectMode(b.getAttribute('data-mode'))));

  el.task.value = state.task;
  el.task.addEventListener('input', () => setTask(el.task.value));

  ['focus', 'short', 'long'].forEach((key) => {
    const input = $(`#min-${key}`);
    input.value = state.settings[key];
    input.addEventListener('input', () => {
      const v = toInt(input.value, 1, 99);
      if (v === null) return;
      state.settings[key] = v;
      saveSettings();
      if (key === state.mode && !state.running && state.remaining === state.total) {
        state.total = state.remaining = v * 60000;
        snapRing();
        saveSession();
      }
      render();
    });
    input.addEventListener('blur', () => { input.value = state.settings[key]; });
  });

  el.goal.value = state.settings.goal;
  el.goal.addEventListener('input', () => {
    const v = toInt(el.goal.value, 1, 24);
    if (v === null) return;
    state.settings.goal = v;
    saveSettings();
    render();
  });
  el.goal.addEventListener('blur', () => { el.goal.value = state.settings.goal; });

  el.optAuto.checked = state.settings.auto;
  el.optSound.checked = state.settings.sound;
  el.optAuto.addEventListener('change', () => { state.settings.auto = el.optAuto.checked; saveSettings(); });
  el.optSound.addEventListener('change', () => {
    state.settings.sound = el.optSound.checked;
    saveSettings();
    if (state.settings.sound) { ensureAudio(); chime(); }
  });

  let clearTimer = null;
  el.clearBtn.addEventListener('click', () => {
    clearTimeout(clearTimer);
    if (!state.clearArmed) {
      state.clearArmed = true;
      clearTimer = setTimeout(() => { state.clearArmed = false; render(); }, 3500);
    } else {
      state.clearArmed = false;
      state.stats = emptyStats();
      saveStats();
    }
    render();
  });

  D.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const key = (e.key || '').toLowerCase();
    if (e.key === ' ' || e.code === 'Space') {
      if (tag === 'BUTTON' || tag === 'A') return; /* a focused button handles Space itself */
      e.preventDefault();
      toggle();
    } else if (key === 'r') {
      reset();
    } else if (key === 's') {
      skip();
    } else if (key === '1' || key === '2' || key === '3') {
      selectMode(['focus', 'short', 'long'][Number(key) - 1]);
    } else if (key === 't') {
      setTheme(isDark() ? 'light' : 'dark');
    } else if (key === 'l') {
      setLang(state.lang === 'en' ? 'tr' : 'en');
    }
  });
  D.addEventListener('visibilitychange', () => {
    if (D.visibilityState === 'visible' && state.running) { lockScreen(); tick(); }
  });
  ['pointerdown', 'keydown'].forEach((ev) => D.addEventListener(ev, ensureAudio, { once: true }));

  /* ---------- Start ---------- */
  applyTheme();
  applyLang();
  snapRing();
  /* A countdown that was running at refresh keeps running from where the clock says it should be. */
  if (restored && restored.running) {
    state.endAt = restored.endAt;
    state.running = true;
    timerId = setInterval(tick, 250);
    lockScreen();
    render();
  }
})();
