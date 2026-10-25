(() => {
  "use strict";

  const RANKS = [
    { at: 0, name: "Seedling", emoji: "🌱" },
    { at: 10, name: "Blossom", emoji: "🌸" },
    { at: 25, name: "Peel Apprentice", emoji: "🧤" },
    { at: 50, name: "Segment Sorter", emoji: "🍊" },
    { at: 100, name: "Zest Collector", emoji: "✨" },
    { at: 250, name: "Grove Keeper", emoji: "🌳" },
    { at: 500, name: "Citrus Scholar", emoji: "📜" },
    { at: 1000, name: "Orchard Master", emoji: "🧺" },
    { at: 2500, name: "Clementine Knight", emoji: "🛡️" },
    { at: 5000, name: "Tangerine Baron", emoji: "🎩" },
    { at: 10000, name: "Satsuma Shogun", emoji: "⛩️" },
    { at: 25000, name: "Ponkan Prince", emoji: "🤴" },
    { at: 50000, name: "Dekopon Duke", emoji: "👑" },
    { at: 100000, name: "Citrus Emperor", emoji: "🐉" },
    { at: 250000, name: "Golden Peel Legend", emoji: "🏆" },
    { at: 500000, name: "Celestial Mandarin", emoji: "🌟" },
    { at: 1000000, name: "Mandarin Deity", emoji: "☀️" },
  ];
  const FACTS = window.MANDARIN_FACTS || [];
  const NEW_FACT_EVERY = 50;
  const STORAGE_KEY = "mandarin-clicker:v1";

  const $ = (id) => document.getElementById(id);
  const el = {
    count: $("count"),
    countLabel: $("countLabel"),
    clicker: $("clicker"),
    shapePath: $("shapePath"),
    particles: $("particles"),
    rankChip: $("rankChip"),
    rankEmoji: $("rankEmoji"),
    rankName: $("rankName"),
    rankEmojiBig: $("rankEmojiBig"),
    rankNameBig: $("rankNameBig"),
    rankIndex: $("rankIndex"),
    rankNext: $("rankNext"),
    rankList: $("rankList"),
    progress: $("progress"),
    progressActive: $("progressActive"),
    factText: $("factText"),
    factIndex: $("factIndex"),
    prevFact: $("prevFact"),
    nextFact: $("nextFact"),
    shuffleFact: $("shuffleFact"),
    vibeBtn: $("vibeBtn"),
    resetBtn: $("resetBtn"),
    resetDialog: $("resetDialog"),
    snackbar: $("snackbar"),
  };

  const fmt = new Intl.NumberFormat();
  const canVibrate = typeof navigator.vibrate === "function";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- State ----------
  const state = load();

  function load() {
    const fallback = { count: 0, vibe: true, fact: Math.floor(Math.random() * FACTS.length) };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || typeof saved !== "object") return fallback;
      return {
        count: Number.isFinite(saved.count) && saved.count >= 0 ? Math.floor(saved.count) : 0,
        vibe: saved.vibe !== false,
        fact: Number.isInteger(saved.fact) && saved.fact >= 0 && saved.fact < FACTS.length ? saved.fact : fallback.fact,
      };
    } catch {
      return fallback;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be unavailable (private mode); the game still works for this visit.
    }
  }

  // ---------- Expressive "cookie" shape behind the mandarin ----------
  const SHAPE_POINTS = 180;
  function cookiePath(lobes, depth, radius) {
    let d = "";
    for (let i = 0; i < SHAPE_POINTS; i++) {
      const t = (i / SHAPE_POINTS) * Math.PI * 2;
      const r = radius * (1 - depth + depth * Math.cos(lobes * t));
      d += (i ? "L" : "M") + (r * Math.cos(t)).toFixed(2) + " " + (r * Math.sin(t)).toFixed(2);
    }
    return d + "Z";
  }
  const SHAPE_IDLE = cookiePath(9, 0.07, 98);
  const SHAPE_PRESSED = cookiePath(12, 0.035, 90);
  const supportsCssD = window.CSS && CSS.supports && CSS.supports("d", 'path("M0 0")');

  function setShape(d) {
    if (supportsCssD) el.shapePath.style.d = `path("${d}")`;
    else el.shapePath.setAttribute("d", d);
  }
  el.shapePath.setAttribute("d", SHAPE_IDLE);

  // ---------- Ranks ----------
  function rankIndexFor(count) {
    let idx = 0;
    for (let i = 0; i < RANKS.length; i++) if (count >= RANKS[i].at) idx = i;
    return idx;
  }

  function buildRankList() {
    el.rankList.innerHTML = "";
    RANKS.forEach((r, i) => {
      const li = document.createElement("li");
      li.dataset.index = i;
      li.innerHTML =
        `<span class="r-emoji" aria-hidden="true">${r.emoji}</span>` +
        `<span class="r-name">${r.name}</span>` +
        `<span class="r-need">${fmt.format(r.at)}</span>`;
      el.rankList.appendChild(li);
    });
  }

  function renderRank(idx) {
    const rank = RANKS[idx];
    const next = RANKS[idx + 1];
    el.rankEmoji.textContent = rank.emoji;
    el.rankName.textContent = rank.name;
    el.rankEmojiBig.textContent = rank.emoji;
    el.rankNameBig.textContent = rank.name;
    el.rankIndex.textContent = `${idx + 1} / ${RANKS.length}`;

    let pct = 100;
    if (next) {
      pct = ((state.count - rank.at) / (next.at - rank.at)) * 100;
      const left = next.at - state.count;
      el.rankNext.textContent = `${fmt.format(left)} more to reach ${next.emoji} ${next.name}`;
    } else {
      el.rankNext.textContent = "You've reached the highest rank. The grove bows to you.";
    }
    pct = Math.max(0, Math.min(100, pct));
    el.progressActive.style.width = `calc(${pct}% - ${pct > 0 && pct < 100 ? 11 : 0}px)`;
    el.progress.classList.toggle("full", pct >= 100);
    el.progress.setAttribute("aria-valuenow", Math.round(pct));

    for (const li of el.rankList.children) {
      const i = Number(li.dataset.index);
      li.classList.toggle("locked", i > idx);
      li.classList.toggle("current", i === idx);
    }
  }

  // ---------- Facts ----------
  function renderFact(animate) {
    if (!FACTS.length) return;
    el.factText.textContent = FACTS[state.fact];
    el.factIndex.textContent = `${state.fact + 1} / ${FACTS.length}`;
    if (animate && !reduceMotion.matches) {
      el.factText.classList.remove("swap");
      void el.factText.offsetWidth;
      el.factText.classList.add("swap");
    }
  }

  function stepFact(delta) {
    state.fact = (state.fact + delta + FACTS.length) % FACTS.length;
    renderFact(true);
    save();
  }

  function randomFact() {
    if (FACTS.length < 2) return;
    let n;
    do n = Math.floor(Math.random() * FACTS.length); while (n === state.fact);
    state.fact = n;
    renderFact(true);
    save();
  }

  // ---------- Counter ----------
  let currentRank = rankIndexFor(state.count);
  let bumpTimer;

  function renderCount() {
    el.count.textContent = fmt.format(state.count);
    el.countLabel.textContent = state.count === 1 ? "mandarin" : "mandarins";
    document.title = state.count ? `${fmt.format(state.count)} 🍊 Mandarin Clicker` : "Mandarin Clicker";
  }

  function vibrate(pattern) {
    if (!canVibrate || !state.vibe) return;
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }

  function addMandarin(x, y) {
    state.count += 1;
    renderCount();

    el.count.classList.add("bump");
    clearTimeout(bumpTimer);
    bumpTimer = setTimeout(() => el.count.classList.remove("bump"), 70);

    const idx = rankIndexFor(state.count);
    if (idx > currentRank) {
      currentRank = idx;
      onRankUp(RANKS[idx], x, y);
    } else {
      vibrate(12);
    }
    renderRank(currentRank);

    if (state.count % NEW_FACT_EVERY === 0) stepFact(1);

    spawnFloat(x, y);
    save();
  }

  function onRankUp(rank, x, y) {
    vibrate([40, 60, 40, 60, 120]);
    showSnackbar(`New rank: <strong>${rank.emoji} ${rank.name}</strong>`);
    el.rankChip.classList.remove("pop");
    void el.rankChip.offsetWidth;
    el.rankChip.classList.add("pop");
    burst(x, y, 22);
  }

  // ---------- Effects ----------
  function spawnFloat(x, y) {
    if (reduceMotion.matches) return;
    const f = document.createElement("span");
    f.className = "float";
    f.textContent = "+1";
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    f.style.setProperty("--dx", `${(Math.random() - 0.5) * 60}px`);
    f.addEventListener("animationend", () => f.remove(), { once: true });
    el.particles.appendChild(f);
    burst(x, y, 4);
  }

  function burst(x, y, n) {
    if (reduceMotion.matches) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "peel-bit";
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * (n > 10 ? 120 : 50);
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      p.style.setProperty("--rot", `${Math.random() * 540 - 270}deg`);
      if (Math.random() < 0.3) p.style.background = "#3f8f3a";
      p.addEventListener("animationend", () => p.remove(), { once: true });
      el.particles.appendChild(p);
    }
  }

  let snackTimer;
  function showSnackbar(html) {
    el.snackbar.innerHTML = html;
    el.snackbar.classList.add("show");
    clearTimeout(snackTimer);
    snackTimer = setTimeout(() => el.snackbar.classList.remove("show"), 2800);
  }

  // ---------- Press handling ----------
  let activePointers = 0;
  let keyboardPress = false;
  function pressStart() {
    el.clicker.classList.add("pressed");
    setShape(SHAPE_PRESSED);
  }
  function pressEnd() {
    if (activePointers > 0) return;
    el.clicker.classList.remove("pressed");
    setShape(SHAPE_IDLE);
  }
  function centerPoint() {
    const r = el.particles.getBoundingClientRect();
    return [r.width / 2, r.height / 2];
  }

  el.clicker.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    activePointers++;
    const r = el.particles.getBoundingClientRect();
    pressStart();
    addMandarin(e.clientX - r.left, e.clientY - r.top);
  });
  const release = () => {
    activePointers = Math.max(0, activePointers - 1);
    pressEnd();
  };
  el.clicker.addEventListener("pointerup", release);
  el.clicker.addEventListener("pointercancel", release);
  el.clicker.addEventListener("pointerleave", () => { activePointers = 0; pressEnd(); });
  el.clicker.addEventListener("contextmenu", (e) => e.preventDefault());

  // Clicks from assistive technology (no pointer, no key handled below) still count.
  el.clicker.addEventListener("click", (e) => {
    if (e.detail === 0 && !keyboardPress) addMandarin(...centerPoint());
  });

  // Keyboard: one mandarin per key press, ignoring auto-repeat.
  document.addEventListener("keydown", (e) => {
    if (e.key !== " " && e.key !== "Enter") return;
    const t = e.target;
    const onClicker = t === el.clicker;
    const onPage = t === document.body || t === document.documentElement;
    if (!onClicker && !onPage) return;
    if (el.resetDialog.open) return;
    e.preventDefault();
    if (e.repeat) return;
    keyboardPress = true;
    pressStart();
    addMandarin(...centerPoint());
  });
  document.addEventListener("keyup", (e) => {
    if ((e.key === " " || e.key === "Enter") && keyboardPress) {
      e.preventDefault();
      keyboardPress = false;
      pressEnd();
    }
  });

  // ---------- Controls ----------
  function renderVibe() {
    if (!canVibrate) {
      el.vibeBtn.disabled = true;
      el.vibeBtn.setAttribute("aria-pressed", "false");
      el.vibeBtn.title = "Vibration isn't supported on this device";
      el.vibeBtn.querySelector(".msr").textContent = "mobile_off";
      return;
    }
    el.vibeBtn.setAttribute("aria-pressed", String(state.vibe));
    el.vibeBtn.title = state.vibe ? "Vibration on" : "Vibration off";
    el.vibeBtn.querySelector(".msr").textContent = state.vibe ? "vibration" : "mobile_off";
  }

  el.vibeBtn.addEventListener("click", () => {
    state.vibe = !state.vibe;
    renderVibe();
    save();
    if (state.vibe) vibrate(30);
    showSnackbar(state.vibe ? "Vibration on" : "Vibration off");
  });

  el.prevFact.addEventListener("click", () => stepFact(-1));
  el.nextFact.addEventListener("click", () => stepFact(1));
  el.shuffleFact.addEventListener("click", randomFact);

  el.resetBtn.addEventListener("click", () => {
    if (typeof el.resetDialog.showModal === "function") el.resetDialog.showModal();
    else if (confirm("Reset your mandarin count and rank?")) reset();
  });
  el.resetDialog.addEventListener("close", () => {
    if (el.resetDialog.returnValue === "confirm") reset();
  });

  function reset() {
    state.count = 0;
    currentRank = 0;
    save();
    renderCount();
    renderRank(0);
    showSnackbar("Progress reset. Back to the grove! 🌱");
  }

  // ---------- Init ----------
  buildRankList();
  renderCount();
  renderRank(currentRank);
  renderFact(false);
  renderVibe();
})();
