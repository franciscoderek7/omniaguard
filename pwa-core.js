/* OmniaGuard PWA Core v1
   Universal utilities: alert system, wake lock, web share, badge API, safe-area fix, install prompt */
(function (G) {
  'use strict';

  /* ============================================================
     SAFE-AREA FIX — override the CSS padding shorthand bug
     (sed-applied padding-top gets overridden by later padding:0 x)
  ============================================================ */
  function applySafeArea() {
    document.querySelectorAll('nav').forEach(nav => {
      nav.style.paddingTop = 'env(safe-area-inset-top)';
    });
    document.querySelectorAll('body').forEach(b => {
      b.style.paddingBottom = 'max(env(safe-area-inset-bottom), 0px)';
    });
  }
  document.addEventListener('DOMContentLoaded', applySafeArea);

  /* ============================================================
     WAKE LOCK
  ============================================================ */
  let _wakeLock = null;

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return false;
    try {
      _wakeLock = await navigator.wakeLock.request('screen');
      _wakeLock.addEventListener('release', () => { _wakeLock = null; });
      localStorage.setItem('og_wake_lock', 'true');
      return true;
    } catch (e) { return false; }
  }

  function releaseWakeLock() {
    if (_wakeLock) { _wakeLock.release(); _wakeLock = null; }
    localStorage.removeItem('og_wake_lock');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && localStorage.getItem('og_wake_lock') === 'true') {
      requestWakeLock();
    }
  });

  /* ============================================================
     BADGE API
  ============================================================ */
  function setBadge(n) {
    if (!('setAppBadge' in navigator)) return;
    if (n > 0) navigator.setAppBadge(n).catch(() => {});
    else navigator.clearAppBadge().catch(() => {});
  }

  /* ============================================================
     WEB SHARE
  ============================================================ */
  async function shareContent(title, text, url) {
    if (!navigator.share) return false;
    try { await navigator.share({ title, text, url }); return true; }
    catch (e) { return false; }
  }

  /* ============================================================
     AUDIO ALERTS (Web Audio API)
  ============================================================ */
  function playAlertSound(type) {
    if (localStorage.getItem('og_mute_sounds') === 'true') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const seqs = {
        critical: [[880, 0.15], [880, 0.1], [1100, 0.2], [880, 0.15]],
        warning:  [[660, 0.15], [880, 0.15]],
        info:     [[440, 0.1]],
        success:  [[523, 0.1], [659, 0.1], [784, 0.12]]
      };
      const steps = seqs[type] || seqs.info;
      let t = ctx.currentTime + 0.05;
      steps.forEach(([freq, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.start(t); osc.stop(t + dur + 0.01);
        t += dur + 0.04;
      });
    } catch (e) {}
  }

  /* ============================================================
     VIBRATION PATTERNS
  ============================================================ */
  const VIBRATIONS = {
    critical: [300, 100, 300, 100, 500],
    warning:  [200, 100, 200],
    info:     [50],
    success:  [100, 50, 100]
  };

  function vibrate(type) {
    if ('vibrate' in navigator) navigator.vibrate(VIBRATIONS[type] || [100]);
  }

  /* ============================================================
     PERSISTENT ALERT SYSTEM
  ============================================================ */
  let _alertLog = [];
  try { _alertLog = JSON.parse(localStorage.getItem('og_alert_log') || '[]'); } catch (e) {}

  const ALERT_CSS = `
#og-alert-container{position:fixed;top:calc(env(safe-area-inset-top) + 72px);right:16px;z-index:99990;
  display:flex;flex-direction:column;gap:8px;max-width:360px;width:calc(100% - 32px);pointer-events:none;}
.og-alert{background:#0d0d1a;border-radius:12px;padding:14px 16px;display:flex;align-items:flex-start;
  gap:10px;box-shadow:0 8px 30px rgba(0,0,0,.7);border-left:4px solid;pointer-events:all;
  animation:ogAlertIn .3s ease;transform:translateX(0);transition:transform .3s ease,opacity .3s ease;
  cursor:default;user-select:none;font-family:system-ui,-apple-system,sans-serif;}
.og-alert.critical{border-left-color:#ff3b3b;background:#160a0a;}
.og-alert.warning {border-left-color:#ff8c00;background:#160f0a;}
.og-alert.info    {border-left-color:#00d4ff;background:#0a0f16;}
.og-alert.success {border-left-color:#00c853;background:#0a160a;}
.og-alert.swiping {transition:none;}
.og-alert-icon{font-size:20px;flex-shrink:0;line-height:1.3;}
.og-alert-body{flex:1;min-width:0;}
.og-alert-title{font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;}
.og-alert-msg{font-size:12px;color:#8892a4;line-height:1.4;}
.og-alert-time{font-size:10px;color:#444;margin-top:4px;}
.og-alert-dismiss{font-size:18px;color:#444;cursor:pointer;padding:0 2px;line-height:1;flex-shrink:0;
  transition:color .15s;-webkit-tap-highlight-color:transparent;}
.og-alert-dismiss:hover,.og-alert-dismiss:active{color:#fff;}
@keyframes ogAlertIn{from{opacity:0;transform:translateX(48px);}to{opacity:1;transform:translateX(0);}}
`;

  function _ensureAlertContainer() {
    if (document.getElementById('og-alert-container')) return;
    const style = document.createElement('style');
    style.textContent = ALERT_CSS;
    document.head.appendChild(style);
    const container = document.createElement('div');
    container.id = 'og-alert-container';
    document.body.appendChild(container);
  }

  function showAlert(type, title, message, persistent) {
    _ensureAlertContainer();
    const id = 'og-a-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const icons = { critical: '🚨', warning: '⚠️', info: '🔵', success: '✅' };

    const el = document.createElement('div');
    el.className = 'og-alert ' + type;
    el.id = id;
    el.innerHTML =
      `<span class="og-alert-icon">${icons[type] || '🔔'}</span>` +
      `<div class="og-alert-body">` +
        `<div class="og-alert-title">${_esc(title)}</div>` +
        `<div class="og-alert-msg">${_esc(message)}</div>` +
        `<div class="og-alert-time">${new Date().toLocaleTimeString()}</div>` +
      `</div>` +
      `<span class="og-alert-dismiss" onclick="OmniaGuardPWA.dismissAlert('${id}')" ` +
        `role="button" aria-label="Dismiss">✕</span>`;

    // Touch swipe-to-dismiss
    let sx = 0;
    el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - sx;
      if (dx > 0) { el.classList.add('swiping'); el.style.transform = `translateX(${dx}px)`; el.style.opacity = String(1 - dx / 220); }
    }, { passive: true });
    el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      el.classList.remove('swiping');
      if (dx > 80) dismissAlert(id);
      else { el.style.transform = ''; el.style.opacity = ''; }
    });

    document.getElementById('og-alert-container').appendChild(el);

    // Log to history
    _alertLog.unshift({ id, type, title, message, time: Date.now() });
    if (_alertLog.length > 200) _alertLog.pop();
    try { localStorage.setItem('og_alert_log', JSON.stringify(_alertLog)); } catch (e) {}

    // Side effects
    vibrate(type);
    playAlertSound(type);

    // Auto-dismiss info/success/warning after 6s; critical stays until dismissed
    if (!persistent && type !== 'critical') setTimeout(() => dismissAlert(id), 6000);

    return id;
  }

  function dismissAlert(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.transform = 'translateX(110%)';
    el.style.opacity = '0';
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
  }

  /* ============================================================
     INSTALL PROMPT
  ============================================================ */
  let _installPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); _installPrompt = e; });

  async function promptInstall() {
    if (!_installPrompt) return false;
    _installPrompt.prompt();
    const { outcome } = await _installPrompt.userChoice;
    _installPrompt = null;
    return outcome === 'accepted';
  }

  function isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  function canInstall() { return !!_installPrompt; }

  /* ============================================================
     PERIODIC BACKGROUND SYNC REGISTRATION
  ============================================================ */
  async function registerPeriodicSync(tag, minInterval) {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    if (!('periodicSync' in reg)) return false;
    try {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (status.state !== 'granted') return false;
      await reg.periodicSync.register(tag, { minInterval });
      return true;
    } catch (e) { return false; }
  }

  /* ============================================================
     UTILS
  ============================================================ */
  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ============================================================
     PUBLIC API
  ============================================================ */
  G.OmniaGuardPWA = {
    requestWakeLock, releaseWakeLock,
    setBadge, shareContent,
    playAlertSound, vibrate,
    showAlert, dismissAlert,
    promptInstall, isInstalled, canInstall,
    registerPeriodicSync,
    get alertLog() { return _alertLog; }
  };

}(window));
