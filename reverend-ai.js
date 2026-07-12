/**
 * Reverend AI — Floating Chat Widget
 * Deploy: <script src="reverend-ai.js"></script> before </body>
 * No API key. Pure JS keyword matching.
 * Site context set via window.REVEREND_SITE before script loads.
 */
(function () {
  'use strict';

  // ── Site Context ──────────────────────────────────────────────────────────
  var SITE = window.REVEREND_SITE || 'default';

  var SITE_CONFIG = {
    'ccldr': {
      name: 'Doc Weedlaw AI',
      avatar: '⚖️',
      color: '#27ae60',
      accent: '#1a7a40',
      greeting: "I'm Doc Weedlaw AI. Facing a cannabis charge? Ask me anything about your rights or BENO-X.",
      consultLink: 'https://paypal.me/techpetcage/500CAD',
      consultLabel: 'Book Consultation ($500)',
    },
    'primedox': {
      name: 'PrimeDox AI',
      avatar: '🤖',
      color: '#00d4ff',
      accent: '#0099bb',
      greeting: "I'm PrimeDox AI. I can help you understand our document automation tiers. What are you looking for?",
      consultLink: 'https://paypal.me/techpetcage/49CAD',
      consultLabel: 'Start Free Trial — $49',
    },
    'francisco-holdings': {
      name: 'FH Assistant',
      avatar: '🏛️',
      color: '#c9a84c',
      accent: '#9a7a2e',
      greeting: "Welcome to Francisco Holdings. I help founders get clarity fast. What challenge are you facing?",
      consultLink: 'https://paypal.me/techpetcage/500CAD',
      consultLabel: 'Book Strategy Session ($500)',
    },
    'weedlaw': {
      name: 'Weedlaw AI',
      avatar: '🌿',
      color: '#27ae60',
      accent: '#1a7a40',
      greeting: "Know Your Rights. I'm here to help. Are you facing a charge, or do you want to learn BENO-X?",
      consultLink: 'https://paypal.me/techpetcage/149CAD',
      consultLabel: 'Get Warrior Tier — $149',
    },
    'omniaguard': {
      name: 'OmniGuard AI',
      avatar: '🛡️',
      color: '#6c63ff',
      accent: '#4b43cc',
      greeting: "OmniGuard here. What's your threat surface? I can help you find the right protection tier.",
      consultLink: 'https://paypal.me/techpetcage/499CAD',
      consultLabel: 'Start OmniGuard Sentinel — $499/mo',
    },
    'cleanswarm': {
      name: 'CleanSwarm AI',
      avatar: '🐝',
      color: '#f59e0b',
      accent: '#b45309',
      greeting: "Hey! CleanSwarm here. Let's automate your workflow. What are you cleaning up?",
      consultLink: 'https://paypal.me/techpetcage/399CAD',
      consultLabel: 'Start CleanSwarm Starter — $399/mo',
    },
    'default': {
      name: 'Francisco Holdings AI',
      avatar: '🏛️',
      color: '#c9a84c',
      accent: '#9a7a2e',
      greeting: "Welcome to Francisco Holdings. I help founders get clarity fast. What challenge are you facing?",
      consultLink: 'https://paypal.me/techpetcage/500CAD',
      consultLabel: 'Book Strategy Session — $500',
    }
  };

  var cfg = SITE_CONFIG[SITE] || SITE_CONFIG['default'];

  // ── Knowledge Base (OmniaGuard ONLY — isolated, no cross-brand KB) ─────────
  var KB = [
    // Founder — only answered if explicitly asked, then pivots back to security
    { kw: ['who built', 'who is the founder', 'who created', 'who founded', 'founder of omniaguard', 'who is behind', 'who owns omniaguard'],
      answer: "OmniGuard was founded by Derek Francisco.<br><br>Now — what's your threat surface? Tell me your industry and team size and I'll point you to the right protection tier." },
    // Off-topic legal routing (cannabis/legal — not a security question)
    { kw: ['cannabis charge', 'cannabis charges', 'marijuana charge', 'weed charge', 'cannabis', 'marijuana', 'possession charge', 'drug charge'],
      answer: "I specialize in cybersecurity, not legal matters. For cannabis defense, visit Floor 2 (BENO-X / Doc Weedlaw) or PrimeDox AI HQ at zprimedoxaihq.com." },
    // Healthcare / regulated industry — Warden minimum
    { kw: ['healthcare', 'pharmacy', 'pharmacies', 'pharmacist', 'prescription', 'prescriptions', 'hospital', 'clinic', 'patient data', 'medical ai'],
      answer: "For healthcare or pharmacy AI handling patient data, the minimum recommended tier is <strong>Warden — $5,000/mo</strong>. It includes HIPAA-aligned controls with a signed Business Associate Agreement (BAA) for US healthcare clients, PIPEDA/Bill C-27 compliance, full 14-layer protection, and a dedicated integration engineer — live and protected within 48 hours, guaranteed." },
    // 14-layer stack
    { kw: ['14-layer', '14 layer', '14layer', 'fourteen layer', 'what layers', 'prompt injection', 'stack'],
      answer: "OmniaGuard's 14-layer stack: (1) Input sanitization, (2) Intent classification, (3) Prompt injection detection, (4) Role confusion prevention, (5) Context window monitoring, (6) Memory poisoning defense, (7) Token smuggling detection, (8) Output validation, (9) Data exfiltration prevention, (10) Agent cascade monitoring, (11) Cross-agent contamination detection, (12) Adversarial input filtering, (13) Policy enforcement, (14) Real-time human oversight integration. Each layer runs in under 12ms — no perceptible latency." },
    // Small business — Guardian
    { kw: ['small business', 'startup', '5-20 agents', '5 to 20 agents', 'few agents', 'growing team'],
      answer: "For a small business running 5-20 AI agents, <strong>Guardian — $2,499/mo</strong> is the right fit: 24/7 SOC monitoring, full compliance package, and active defense across your whole agent fleet." },
    // Individual — Sentinel
    { kw: ['individual', '1-5 devices', 'personal use', 'freelancer', 'solo', 'single device'],
      answer: "For individual or 1-5 device use, <strong>Sentinel — $499/mo</strong> covers you: self-serve setup, live in under 2 hours, core monitoring included." },
    // National enterprise / critical infrastructure — Archon
    { kw: ['national enterprise', 'critical infrastructure', 'large enterprise', 'regional corporation'],
      answer: "For national enterprise or critical infrastructure deployments, <strong>Archon — $15,000/mo</strong> is the tier: ITAR + CIRA Shield, unlimited deployment scope, and full regulatory compliance at scale." },
    // Fortune 500 / government — Sovereign
    { kw: ['fortune 500', 'government', 'federal', 'military', 'intelligence agency', 'public sector'],
      answer: "For Fortune 500 or government-scale deployments, <strong>Sovereign — $25,000/mo</strong> is the tier: unlimited agents, custom architecture, on-premise available, classified-grade encryption, 24/7 direct hotline." },
    // Compliance / certifications
    { kw: ['compliance', 'certification', 'certifications', 'soc 2', 'soc2', 'iso 27001', 'iso27001', 'nist', 'pipeda', 'bill c-27', 'itar', 'cira shield', 'audit'],
      answer: "Compliance by framework:<br>• SOC 2 Type II — Audit-ready, available on Warden tier and above<br>• HIPAA + BAA — Available on Warden tier and above, signed BAA for US healthcare<br>• PIPEDA / Bill C-27 — Compliant for Canadian operations, all tiers<br>• ISO 27001 — Aligned, audit-ready on Warden tier and above<br>• NIST AI RMF — Aligned, all tiers<br>• ITAR / CIRA Shield — Archon tier only" },
    // Deployment timeline
    { kw: ['how long', 'deployment time', 'go live', 'timeline', 'how fast', 'when can i start', 'deploy'],
      answer: "Deployment timeline by tier:<br>• Sentinel / Guardian — self-serve, live in 2 hours<br>• Warden and above — dedicated engineer, live in 48 hours<br>• Archon / Sovereign — custom scoping, 5-10 business days" },
    // Payment
    { kw: ['pay', 'payment', 'how do i pay', 'interac', 'bitcoin', 'wire transfer', 'corporate cheque', 'paypal'],
      answer: "We accept PayPal, Interac e-Transfer, Bitcoin, wire transfer, and corporate cheque. Click the button below to pay via PayPal — accounts are activated within 2 business hours of confirmed payment." },
    // General pricing fallback
    { kw: ['price', 'cost', 'tier', 'how much', 'pricing', 'plan', 'plans'],
      answer: "OmniaGuard tiers:<br>🔹 Sentinel — $499/mo<br>🔸 Guardian — $2,499/mo<br>🛡️ Warden — $5,000/mo ★ Recommended<br>🔥 Archon — $15,000/mo<br>💎 Sovereign — $25,000/mo<br><br>Tell me your industry and team size and I'll recommend the right one." },
    // Contact
    { kw: ['contact', 'email', 'reach', 'talk to', 'speak to someone', 'sales'],
      answer: "Book directly using the button below — that's the fastest way to reach our security team. We respond within 1 business hour." },
    { kw: ['hello', 'hi', 'hey', 'start', 'help', 'what can you do'],
      answer: null } // triggers default greeting repeat
  ];

  function findAnswer(input) {
    var lower = input.toLowerCase();
    for (var i = 0; i < KB.length; i++) {
      var entry = KB[i];
      for (var j = 0; j < entry.kw.length; j++) {
        if (lower.indexOf(entry.kw[j]) !== -1) {
          return entry.answer;
        }
      }
    }
    return null;
  }

  // ── Inject CSS ────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#rev-ai-btn{position:fixed;bottom:24px;right:24px;z-index:99999;width:56px;height:56px;border-radius:50%;background:' + cfg.color + ';border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.4);font-size:24px;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;}',
    '#rev-ai-btn:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(0,0,0,.5);}',
    '#rev-ai-btn .rev-pulse{position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:50%;background:#f00;border:2px solid #111;animation:rev-ping 2s infinite;}',
    '@keyframes rev-ping{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.6}}',
    '#rev-ai-box{position:fixed;bottom:90px;right:24px;z-index:99999;width:340px;max-height:520px;background:#111;border:1px solid ' + cfg.color + ';border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.6);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;opacity:0;transform:translateY(10px) scale(.97);transition:opacity .2s,transform .2s;pointer-events:none;}',
    '#rev-ai-box.rev-open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}',
    '#rev-ai-header{background:' + cfg.color + ';padding:12px 16px;display:flex;align-items:center;gap:10px;}',
    '#rev-ai-header .rev-name{font-weight:800;color:#fff;font-size:14px;}',
    '#rev-ai-header .rev-status{font-size:11px;color:rgba(255,255,255,.75);}',
    '#rev-ai-close{margin-left:auto;background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:0 4px;line-height:1;}',
    '#rev-ai-msgs{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:' + cfg.accent + ' #111;}',
    '.rev-msg{max-width:85%;padding:9px 13px;border-radius:12px;line-height:1.5;word-wrap:break-word;}',
    '.rev-bot{background:#1a1a1a;border:1px solid #2a2a2a;color:#e0e0e0;align-self:flex-start;border-radius:4px 12px 12px 12px;}',
    '.rev-user{background:' + cfg.color + ';color:#fff;align-self:flex-end;border-radius:12px 4px 12px 12px;}',
    '.rev-cta{display:inline-block;margin-top:8px;background:' + cfg.color + ';color:#fff;font-weight:700;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:12px;}',
    '#rev-ai-input-row{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #222;background:#0d0d0d;}',
    '#rev-ai-input{flex:1;background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:9px 12px;color:#e0e0e0;font-size:13px;outline:none;}',
    '#rev-ai-input:focus{border-color:' + cfg.color + ';}',
    '#rev-ai-send{background:' + cfg.color + ';border:none;border-radius:8px;padding:9px 14px;color:#fff;font-weight:700;cursor:pointer;font-size:13px;}',
    '#rev-ai-send:hover{background:' + cfg.accent + ';}',
    '@media(max-width:400px){#rev-ai-box{width:calc(100vw - 16px);right:8px;bottom:80px;}}'
  ].join('');
  document.head.appendChild(style);

  // ── Build DOM ─────────────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.id = 'rev-ai-btn';
  btn.title = 'Chat with ' + cfg.name;
  btn.innerHTML = cfg.avatar + '<span class="rev-pulse"></span>';

  var box = document.createElement('div');
  box.id = 'rev-ai-box';
  box.innerHTML = [
    '<div id="rev-ai-header">',
      '<span style="font-size:20px">' + cfg.avatar + '</span>',
      '<div><div class="rev-name">' + cfg.name + '</div><div class="rev-status">● Online now</div></div>',
      '<button id="rev-ai-close" aria-label="Close">✕</button>',
    '</div>',
    '<div id="rev-ai-msgs"></div>',
    '<div id="rev-ai-input-row">',
      '<input id="rev-ai-input" type="text" placeholder="Ask a question…" maxlength="200" autocomplete="off"/>',
      '<button id="rev-ai-send">Send</button>',
    '</div>'
  ].join('');

  document.body.appendChild(btn);
  document.body.appendChild(box);

  var msgs = document.getElementById('rev-ai-msgs');
  var input = document.getElementById('rev-ai-input');
  var sendBtn = document.getElementById('rev-ai-send');
  var closeBtn = document.getElementById('rev-ai-close');
  var isOpen = false;

  function addMsg(text, role) {
    var d = document.createElement('div');
    d.className = 'rev-msg rev-' + role;
    d.innerHTML = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function botReply(html) {
    setTimeout(function () {
      var d = addMsg(html, 'bot');
      if (cfg.consultLink) {
        var a = document.createElement('a');
        a.className = 'rev-cta';
        a.href = cfg.consultLink;
        a.target = '_blank';
        a.textContent = cfg.consultLabel;
        d.appendChild(document.createElement('br'));
        d.appendChild(a);
      }
    }, 420);
  }

  function handleSend() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg(text, 'user');

    var answer = findAnswer(text);
    if (answer) {
      botReply(answer);
    } else {
      botReply(
        "I specialize in cybersecurity — ask me about our tiers, the 14-layer stack, compliance, or deployment timelines.<br><br>" +
        "For a detailed conversation, book directly using the button below."
      );
    }
  }

  function openChat() {
    isOpen = true;
    box.classList.add('rev-open');
    btn.querySelector('.rev-pulse').style.display = 'none';
    if (msgs.children.length === 0) {
      setTimeout(function () { addMsg(cfg.greeting, 'bot'); }, 300);
    }
    setTimeout(function () { input.focus(); }, 400);
  }

  function closeChat() {
    isOpen = false;
    box.classList.remove('rev-open');
  }

  btn.addEventListener('click', function () { isOpen ? closeChat() : openChat(); });
  closeBtn.addEventListener('click', closeChat);
  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleSend(); });

  // Auto-open after 8s if not already opened
  setTimeout(function () {
    if (!isOpen && !sessionStorage.getItem('rev_dismissed')) { openChat(); }
  }, 8000);

  closeBtn.addEventListener('click', function () {
    sessionStorage.setItem('rev_dismissed', '1');
  });

})();
