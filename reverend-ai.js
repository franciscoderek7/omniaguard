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
      consultLink: 'https://franciscoholdingsinc.com/book.html',
      consultLabel: 'Book Consultation ($500)',
    },
    'primedox': {
      name: 'PrimeDox AI',
      avatar: '🤖',
      color: '#00d4ff',
      accent: '#0099bb',
      greeting: "I'm PrimeDox AI. I can help you understand our document automation tiers. What are you looking for?",
      consultLink: 'https://paypal.me/franciscoderek7/49CAD',
      consultLabel: 'Start Free Trial — $49',
    },
    'francisco-holdings': {
      name: 'FH Assistant',
      avatar: '🏛️',
      color: '#c9a84c',
      accent: '#9a7a2e',
      greeting: "Welcome to Francisco Holdings. I help founders get clarity fast. What challenge are you facing?",
      consultLink: 'https://franciscoholdingsinc.com/book.html',
      consultLabel: 'Book Strategy Session ($500)',
    },
    'weedlaw': {
      name: 'Weedlaw AI',
      avatar: '🌿',
      color: '#27ae60',
      accent: '#1a7a40',
      greeting: "Know Your Rights. I'm here to help. Are you facing a charge, or do you want to learn BENO-X?",
      consultLink: 'https://paypal.me/franciscoderek7/149CAD',
      consultLabel: 'Get Warrior Tier — $149',
    },
    'omniaguard': {
      name: 'OmniaGuard AI',
      avatar: '🛡️',
      color: '#6c63ff',
      accent: '#4b43cc',
      greeting: "OmniaGuard here. What's your threat surface? I can help you find the right protection tier.",
      consultLink: 'mailto:omniaguard1@gmail.com?subject=OmniaGuard%20Inquiry',
      consultLabel: 'Contact Sales',
    },
    'cleanswarm': {
      name: 'CleanSwarm AI',
      avatar: '🐝',
      color: '#f59e0b',
      accent: '#b45309',
      greeting: "Hey! CleanSwarm here. Need AI-powered document cleanup? Tell me about your workflow.",
      consultLink: 'mailto:hello@cleanswarm.ca?subject=CleanSwarm%20Inquiry',
      consultLabel: 'Contact CleanSwarm →',
    },
    'default': {
      name: 'Reverend AI',
      avatar: '✝️',
      color: '#6c63ff',
      accent: '#4b43cc',
      greeting: "Hello. I'm Reverend AI. How can I help you today?",
      consultLink: 'mailto:franciscoderek7@gmail.com',
      consultLabel: 'Contact Us',
    }
  };

  var cfg = SITE_CONFIG[SITE] || SITE_CONFIG['default'];

  // ── Knowledge Base ────────────────────────────────────────────────────────
  var KB = [
    // CCLDR / Weedlaw
    { kw: ['beno', 'beno-x', 'framework', 'constitutional', 'defense', 'defence'],
      answer: "The BENO-X Framework is a 5-pillar constitutional defense strategy covering Breach identification, Evidence exclusion, Negotiation leverage, On-record defense, and the X-multiplier. It's been used in 200+ cannabis cases.<br><br><strong>Want the full framework?</strong>" },
    { kw: ['charge', 'charged', 'arrested', 'police', 'stopped', 'cannabis charge', 'marijuana charge'],
      answer: "If you're facing a cannabis charge, time matters. The BENO-X Framework lets you build a constitutional defense using Charter breaches — evidence can be excluded, charges can be stayed.<br><br><strong>The window is now. Don't wait.</strong>" },
    { kw: ['rights', 'charter', 'section 10', 'remain silent', 'lawyer', 'detained'],
      answer: "Under s.10 of the Canadian Charter: <br>✓ Right to know why you're detained<br>✓ Right to speak to a lawyer immediately<br>✓ Right to remain silent<br><br>Say: \"I'd like to speak to a lawyer\" and nothing else." },
    { kw: ['price', 'cost', 'tier', 'warrior', 'professional', 'elite', 'sovereign', 'how much', 'pricing'],
      answer: "Weedlaw Education tiers:<br>🥉 Warrior — $149 (Stages 1-2)<br>🥈 Professional — $499 (Stages 1-5, full BENO-X)<br>🥇 Elite — $999 (Stages 1-9, trial prep)<br>👑 Sovereign — $1,499 (All 12 stages)<br><br>All one-time, lifetime access." },
    // PrimeDox
    { kw: ['primedox', 'document', 'automation', 'pdf', 'filing', 'draft', 'template'],
      answer: "PrimeDox AI automates legal, business, and strategic documents. Upload → AI structures → download court-ready PDFs in minutes. Tiers start at $49/mo." },
    { kw: ['enterprise', 'team', 'multiple users', '5 users', 'team access'],
      answer: "PrimeDox Enterprise ($499/mo) gives your team up to 5 users, a dedicated AI agent instance, priority processing, and monthly strategy calls." },
    // Francisco Holdings
    { kw: ['consulting', 'consult', 'strategy', 'session', '$500', 'book', 'meeting', 'call'],
      answer: "Francisco Holdings offers 60-minute strategy sessions at $500 CAD. Topics: revenue acceleration, AI automation, legal structure, brand architecture, strategic positioning.<br><br>Reply with 3 available time slots to book." },
    { kw: ['retainer', 'ongoing', 'monthly', 'long-term'],
      answer: "The Francisco Holdings monthly strategy retainer is $1,500/mo — 4 sessions, priority access, direct line to Derek Francisco. Reply 'RETAINER' to get the agreement." },
    { kw: ['22 brands', 'empire', 'holdings', 'how do you', 'run'],
      answer: "Derek Francisco runs 22 brands with 2 people using AI automation, Loop A/B identity architecture, and a lean AI stack. That playbook is teachable in a single consulting session." },
    // OmniaGuard
    { kw: ['omniaguard', 'security', 'threat', 'ai security', 'enterprise security', 'protection'],
      answer: "OmniaGuard offers enterprise-grade AI security:<br>🔹 Sentinel — $499/mo (monitoring)<br>🔸 Guardian — $1,499/mo (active defense)<br>🔥 Fortress — $4,999/mo (full suite)<br>💎 Sovereign — $15,000/mo (dedicated team)" },
    // CleanSwarm
    { kw: ['cleanswarm', 'clean', 'swarm', 'document cleanup', 'ocr', 'extraction'],
      answer: "CleanSwarm automates document cleanup, OCR extraction, and data structuring at scale. Tiers:<br>🐝 Starter — $399/mo<br>🐝🐝 Growth — $999/mo<br>🐝🐝🐝 Scale — $2,499/mo" },
    // General
    { kw: ['affiliate', 'commission', 'referral', 'partner', 'earn'],
      answer: "Our affiliate program pays 20% commission on every referral. Sign up at <a href='../affiliate/' style='color:inherit'>the affiliate page</a> — first payouts go through Interac or PayPal." },
    { kw: ['paypal', 'payment', 'pay', 'interac', 'etransfer', 'e-transfer'],
      answer: "All products can be purchased via PayPal or Interac e-Transfer. Send to <strong>franciscoderek7@gmail.com</strong> with the product name in the subject." },
    { kw: ['contact', 'email', 'reach', 'talk to', 'speak'],
      answer: "Best way to reach us: reply directly to your welcome email, or send to <strong>franciscoderek7@gmail.com</strong>. For OmniaGuard: omniaguard1@gmail.com." },
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
        "Good question. For a detailed answer, the fastest path is speaking directly with our team.<br><br>" +
        "Reply via email: <strong>franciscoderek7@gmail.com</strong> — or click below."
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
