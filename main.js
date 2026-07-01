const eb = { events: {}, on(e, cb) { (this.events[e] = this.events[e] || []).push(cb); }, emit(e, d) { (this.events[e] || []).forEach(cb => cb(d)); } };

function renderThreats(state) {
  const el = document.getElementById("threatFeed");
  const level = state?.threatLevel || "LOW";
  const colors = { HIGH: "threat-high", MED: "threat-med", LOW: "threat-low" };
  el.innerHTML = `<div class="${colors[level]}">Threat Level: ${level}</div><div style="margin-top:10px;font-size:12px;">Last scan: ${new Date().toLocaleTimeString()}</div>`;
}

function renderAgents(update) {
  const el = document.getElementById("agentStatus");
  el.innerHTML = `<div>Active Agents: ${update?.active || 0}</div><div>Swarm Health: ${update?.health || "100%"}</div><div style="margin-top:10px;font-size:12px;color:#d4af37;">OmniGuard v2.0</div>`;
}

// Simulate live data
setInterval(() => {
  const levels = ["LOW", "MED", "HIGH"];
  const threats = { threatLevel: levels[Math.floor(Math.random() * 3)] };
  renderThreats(threats);
  renderAgents({ active: Math.floor(Math.random() * 45) + 1, health: "98%" });
}, 3000);

// Initial render
renderThreats({ threatLevel: "LOW" });
renderAgents({ active: 12, health: "100%" });
