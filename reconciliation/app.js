const CHANNELS = [
  {
    id: "pos",
    name: "POS",
    icon: "▣",
    lastRun: "2026-09-02 16:00",
    overall: { label: "In review", className: "warn" },
    matched: 1842,
    exceptions: 37,
    unmatchedSource: 12,
    unmatchedTarget: 25,
    pulse: [22, 18, 31, 14, 27, 19, 37],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    icon: "◈",
    lastRun: "2026-09-02 15:40",
    overall: { label: "Completed", className: "ok" },
    matched: 4201,
    exceptions: 4,
    unmatchedSource: 1,
    unmatchedTarget: 3,
    pulse: [9, 7, 11, 6, 5, 8, 4],
  },
  {
    id: "bank",
    name: "Bank settlement",
    icon: "⬡",
    lastRun: "2026-09-02 14:10",
    overall: { label: "Exceptions", className: "fail" },
    matched: 910,
    exceptions: 88,
    unmatchedSource: 40,
    unmatchedTarget: 48,
    pulse: [41, 55, 48, 62, 70, 81, 88],
  },
  {
    id: "card",
    name: "Card acquiring",
    icon: "◇",
    lastRun: "2026-09-02 13:55",
    overall: { label: "In review", className: "warn" },
    matched: 2750,
    exceptions: 19,
    unmatchedSource: 6,
    unmatchedTarget: 13,
    pulse: [12, 16, 10, 21, 18, 14, 19],
  },
  {
    id: "wallet",
    name: "Digital wallet",
    icon: "◎",
    lastRun: "2026-09-01 22:05",
    overall: { label: "Completed", className: "ok" },
    matched: 633,
    exceptions: 0,
    unmatchedSource: 0,
    unmatchedTarget: 0,
    pulse: [4, 2, 3, 1, 2, 0, 0],
  },
];

const filterInput = document.getElementById("channel-filter");
const channelGrid = document.getElementById("channel-grid");
const statusEmpty = document.getElementById("status-empty");
const statusBody = document.getElementById("status-body");
const statusSub = document.getElementById("status-sub");
const chatHint = document.getElementById("chat-channel");
const messages = document.getElementById("messages");
const form = document.getElementById("ask-form");
const input = document.getElementById("q");
const btn = form.querySelector("button");

let selectedChannel = null;
const CIRC = 2 * Math.PI * 58;

function matchRate(channel) {
  const total = channel.matched + channel.exceptions;
  return total === 0 ? 100 : (channel.matched / total) * 100;
}

function sparkline(values, color) {
  const w = 72;
  const h = 28;
  const max = Math.max(...values, 1);
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <polyline fill="none" stroke="${color}" stroke-width="2" points="${pts}" />
  </svg>`;
}

function pulseChart(values) {
  const w = 520;
  const h = 92;
  const max = Math.max(...values, 1);
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 12 - (v / max) * (h - 24);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  return `<svg class="pulse-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(56,189,248,0.45)" />
        <stop offset="100%" stop-color="rgba(56,189,248,0)" />
      </linearGradient>
    </defs>
    <polygon fill="url(#area)" points="${area}" />
    <polyline fill="none" stroke="#7dd3fc" stroke-width="3" points="${pts}" />
  </svg>`;
}

function add(role, text) {
  const el = document.createElement("div");
  el.className = "msg " + (role === "user" ? "user" : "bot");
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

function clearMessages() {
  messages.replaceChildren();
}

function renderChannelCards(query = "") {
  const q = query.trim().toLowerCase();
  const matches = CHANNELS.filter((c) => c.name.toLowerCase().includes(q));
  channelGrid.replaceChildren();

  if (!matches.length) {
    channelGrid.innerHTML = `<p class="empty-art">No rails match that filter.</p>`;
    return;
  }

  for (const channel of matches) {
    const rate = matchRate(channel);
    const color = rate > 99 ? "#34d399" : rate > 95 ? "#fbbf24" : "#fb7185";
    const btnEl = document.createElement("button");
    btnEl.type = "button";
    btnEl.className = "channel-card" + (selectedChannel?.id === channel.id ? " active" : "");
    btnEl.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4" />
        <circle cx="24" cy="24" r="20" fill="none" stroke="${color}" stroke-width="4"
          stroke-dasharray="${(rate / 100) * 125.6} 125.6" transform="rotate(-90 24 24)" />
        <text x="24" y="28" text-anchor="middle" fill="#e2e8f0" font-size="11">${channel.icon}</text>
      </svg>
      <div>
        <h3>${channel.name}</h3>
        <small>${channel.overall.label} · ${channel.exceptions} exceptions</small>
      </div>
      ${sparkline(channel.pulse, color)}
    `;
    btnEl.addEventListener("click", () => selectChannel(channel.id));
    channelGrid.appendChild(btnEl);
  }
}

function showNoChannel() {
  selectedChannel = null;
  statusEmpty.classList.remove("hidden");
  statusBody.classList.add("hidden");
  statusBody.replaceChildren();
  statusSub.textContent = "Waiting for a channel.";
  chatHint.textContent = "No channel selected";
  input.disabled = true;
  btn.disabled = true;
  input.placeholder = "Select a channel first";
  clearMessages();
  add("bot", "Lock a channel on the left. Telemetry and Q&A stay dark until you do.");
  renderChannelCards(filterInput.value);
}

function renderStatus(channel) {
  const rate = matchRate(channel);
  const offset = CIRC - (rate / 100) * CIRC;
  const total = channel.matched + channel.exceptions;
  const maxSide = Math.max(channel.unmatchedSource, channel.unmatchedTarget, channel.matched, 1);

  statusEmpty.classList.add("hidden");
  statusBody.classList.remove("hidden");
  statusSub.textContent = `${channel.name} · last run ${channel.lastRun}`;
  statusBody.innerHTML = `
    <div class="hero-metrics">
      <div class="ring-wrap">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="58" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="12" />
          <circle id="rate-ring" cx="75" cy="75" r="58" fill="none" stroke="url(#ringGrad)" stroke-width="12"
            stroke-linecap="round" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}" />
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#34d399" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
        <div class="ring-label">
          <strong>${rate.toFixed(1)}%</strong>
          <span>match rate</span>
        </div>
      </div>
      <div class="kpis">
        <div class="kpi"><span>Overall</span><strong class="badge ${channel.overall.className}">${channel.overall.label}</strong></div>
        <div class="kpi"><span>Volume</span><strong>${total.toLocaleString()}</strong></div>
        <div class="kpi"><span>Matched</span><strong class="ok">${channel.matched.toLocaleString()}</strong></div>
        <div class="kpi"><span>Exceptions</span><strong class="fail">${channel.exceptions}</strong></div>
      </div>
    </div>
    <div class="bars">
      <div class="bar-row"><span>Matched</span><div class="track"><div class="fill matched" data-w="${(channel.matched / maxSide) * 100}"></div></div><span>${channel.matched}</span></div>
      <div class="bar-row"><span>Unmatched src</span><div class="track"><div class="fill source" data-w="${(channel.unmatchedSource / maxSide) * 100}"></div></div><span>${channel.unmatchedSource}</span></div>
      <div class="bar-row"><span>Unmatched tgt</span><div class="track"><div class="fill target" data-w="${(channel.unmatchedTarget / maxSide) * 100}"></div></div><span>${channel.unmatchedTarget}</span></div>
    </div>
    <div>
      <span class="channel-hint">Seven-day exception pulse</span>
      ${pulseChart(channel.pulse)}
    </div>
  `;

  requestAnimationFrame(() => {
    const ring = document.getElementById("rate-ring");
    if (ring) ring.style.strokeDashoffset = String(offset);
    statusBody.querySelectorAll(".fill").forEach((el) => {
      el.style.width = `${el.dataset.w}%`;
    });
  });
}

function selectChannel(id) {
  const channel = CHANNELS.find((c) => c.id === id);
  if (!channel) {
    showNoChannel();
    return;
  }

  selectedChannel = channel;
  renderChannelCards(filterInput.value);
  renderStatus(channel);
  chatHint.textContent = `Live on ${channel.name}`;
  input.disabled = false;
  btn.disabled = false;
  input.placeholder = `Ask about ${channel.name}…`;
  clearMessages();
  add(
    "bot",
    `${channel.name} is on the board. Match rate ${matchRate(channel).toFixed(1)}%. Ask about exceptions, unmatched sides, or the last run.`
  );
  input.focus();
}

filterInput.addEventListener("input", () => {
  renderChannelCards(filterInput.value);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedChannel) return;

  const question = input.value.trim();
  if (!question) return;

  add("user", question);
  input.value = "";
  btn.disabled = true;

  try {
    await new Promise((r) => setTimeout(r, 400));
    add(
      "bot",
      `Channel: ${selectedChannel.name}\nReceived: “${question}”\n\nWhen the local LLM and MCP are connected, the answer will appear here.`
    );
  } catch (_err) {
    add("bot", "Could not reach the assistant. Check that the local engine is running.");
  } finally {
    btn.disabled = false;
    input.focus();
  }
});

showNoChannel();
