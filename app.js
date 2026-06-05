/* OmniaGuard PWA — app.js */
(function () {
  'use strict';

  /* ---- SERVICE WORKER REGISTRATION ---- */
  document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    initInstallPrompt();
    initOfflineDetection();
    initThreatCounter();
    initPrivacyScore();
    initShieldStates();
  });

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('[OmniaGuard] Service worker registered. Scope:', reg.scope);
        // Request background sync if available
        if ('sync' in reg) {
          reg.sync.register('threat-alert-sync').catch(() => {});
        }
      })
      .catch(err => console.warn('[OmniaGuard] SW registration failed:', err));
  }

  /* ---- INSTALL PROMPT ---- */
  let deferredPrompt = null;

  function initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      // Show install UI after 3-second delay
      setTimeout(showInstallBanner, 3000);
    });

    window.addEventListener('appinstalled', () => {
      hideInstallBanner();
      deferredPrompt = null;
      localStorage.setItem('og_installed', 'true');
    });
  }

  function showInstallBanner() {
    if (localStorage.getItem('og_install_dismissed') === 'true') return;
    if (localStorage.getItem('og_installed') === 'true') return;
    if (document.getElementById('og-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'og-install-banner';
    banner.style.cssText = [
      'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:99999', 'background:#0d0d1a', 'border:1px solid rgba(0,212,255,0.4)',
      'border-radius:12px', 'padding:16px 20px', 'display:flex', 'align-items:center',
      'gap:14px', 'box-shadow:0 8px 40px rgba(0,212,255,0.15)', 'max-width:420px',
      'width:calc(100% - 40px)', 'font-family:system-ui,-apple-system,sans-serif',
      'animation:ogBannerIn 0.4s ease'
    ].join(';');

    banner.innerHTML = `
      <style>@keyframes ogBannerIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}</style>
      <div style="width:36px;height:36px;flex-shrink:0;background:rgba(0,212,255,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;">&#x1F6E1;&#xFE0F;</div>
      <div style="flex:1;min-width:0;">
        <div style="color:#fff;font-size:13px;font-weight:700;margin-bottom:2px;">Install OmniaGuard</div>
        <div style="color:#8a8a9a;font-size:11px;line-height:1.4;">Install for offline protection and faster access</div>
      </div>
      <button id="og-install-btn" style="background:#00d4ff;color:#000;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;">Install</button>
      <button id="og-dismiss-btn" style="background:none;border:none;color:#8a8a9a;font-size:18px;cursor:pointer;padding:4px;flex-shrink:0;line-height:1;">&times;</button>
    `;

    document.body.appendChild(banner);

    document.getElementById('og-install-btn').addEventListener('click', triggerInstall);
    document.getElementById('og-dismiss-btn').addEventListener('click', () => {
      localStorage.setItem('og_install_dismissed', 'true');
      hideInstallBanner();
    });
  }

  function hideInstallBanner() {
    const b = document.getElementById('og-install-banner');
    if (b) b.remove();
  }

  function triggerInstall() {
    if (!deferredPrompt) {
      window.location.href = '/install-guide.html';
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        localStorage.setItem('og_installed', 'true');
      }
      deferredPrompt = null;
      hideInstallBanner();
    });
  }

  // Expose so install-guide.html can call it
  window.ogTriggerInstall = triggerInstall;

  /* ---- OFFLINE DETECTION ---- */
  function initOfflineDetection() {
    if (!navigator.onLine) showOfflineToast();
    window.addEventListener('offline', showOfflineToast);
    window.addEventListener('online', hideOfflineToast);
  }

  function showOfflineToast() {
    if (document.getElementById('og-offline-toast')) return;
    const t = document.createElement('div');
    t.id = 'og-offline-toast';
    t.style.cssText = 'position:fixed;top:80px;right:20px;z-index:99998;background:#1a1a2e;border:1px solid rgba(255,140,0,0.5);border-radius:10px;padding:12px 18px;color:#ff8c00;font-size:13px;font-weight:600;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 4px 20px rgba(255,140,0,0.15);';
    t.textContent = 'You are offline — OmniaGuard cached protection active';
    document.body.appendChild(t);
  }

  function hideOfflineToast() {
    const t = document.getElementById('og-offline-toast');
    if (t) t.remove();
    showOnlineToast();
  }

  function showOnlineToast() {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:80px;right:20px;z-index:99998;background:#0d1a12;border:1px solid rgba(0,200,83,0.5);border-radius:10px;padding:12px 18px;color:#00c853;font-size:13px;font-weight:600;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 4px 20px rgba(0,200,83,0.15);';
    t.textContent = 'Back online — OmniaGuard fully operational';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  /* ---- SIMULATED THREAT COUNTER ---- */
  function initThreatCounter() {
    // Initialise from storage or default
    if (!localStorage.getItem('og_threats_blocked')) {
      localStorage.setItem('og_threats_blocked', String(Math.floor(Math.random() * 4000) + 12000));
    }
    updateThreatDisplay();
    scheduleThreatIncrement();
  }

  function scheduleThreatIncrement() {
    const delay = 3000 + Math.random() * 5000; // 3-8 seconds
    setTimeout(() => {
      let count = parseInt(localStorage.getItem('og_threats_blocked') || '0', 10);
      count += Math.floor(Math.random() * 3) + 1;
      localStorage.setItem('og_threats_blocked', String(count));
      updateThreatDisplay();
      scheduleThreatIncrement();
    }, delay);
  }

  function updateThreatDisplay() {
    const count = localStorage.getItem('og_threats_blocked') || '0';
    document.querySelectorAll('#live-threat-count').forEach(el => {
      el.textContent = parseInt(count, 10).toLocaleString();
    });
  }

  /* ---- PRIVACY SCORE ---- */
  function initPrivacyScore() {
    if (!localStorage.getItem('og_privacy_score')) {
      localStorage.setItem('og_privacy_score', '72');
    }
  }

  window.ogGetPrivacyScore = () => parseInt(localStorage.getItem('og_privacy_score') || '72', 10);
  window.ogSetPrivacyScore = score => localStorage.setItem('og_privacy_score', String(Math.max(0, Math.min(100, score))));

  /* ---- ACTIVE SHIELD STATES ---- */
  const SHIELD_KEYS = ['og_shield_network', 'og_shield_app', 'og_shield_data', 'og_shield_ai'];

  function initShieldStates() {
    SHIELD_KEYS.forEach(key => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, 'true');
    });
  }

  window.ogGetShield = key => localStorage.getItem('og_shield_' + key) !== 'false';
  window.ogSetShield = (key, val) => localStorage.setItem('og_shield_' + key, val ? 'true' : 'false');

  /* ---- PUSH NOTIFICATIONS ---- */
  window.requestNotifications = function () {
    if (!('Notification' in window)) {
      alert('Push notifications are not supported in this browser.');
      return Promise.resolve('unsupported');
    }
    return Notification.requestPermission().then(permission => {
      localStorage.setItem('og_notify_permission', permission);
      if (permission === 'granted') {
        new Notification('OmniaGuard Active', {
          body: 'You will now receive threat alerts from OmniaGuard.',
          icon: '/omniaguard-logo.png'
        });
      }
      return permission;
    });
  };

})();
