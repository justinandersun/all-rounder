(() => {
  "use strict";

  // ---------- Event definitions ----------
  // kind determines input markup and scoring formula. `criteria` doubles as
  // the Benchmark column's placeholder text before stats are calculated.
  const EVENTS = [
    {
      num: 1, id: "broad_jump", name: "Standing Broad Jump",
      criteria: "Jump ≥ your height", points: 1, kind: "pass_fail",
    },
    {
      num: 2, id: "deep_squat", name: "Deep Squat",
      criteria: "Hold for 30 sec", points: 1, kind: "pass_fail",
    },
    {
      num: 3, id: "floor_rise", name: "Floor Rise",
      criteria: "Feet → floor → feet without hands", points: 1, kind: "pass_fail",
    },
    {
      num: 4, id: "single_leg_balance", name: "Single-Leg Balance",
      criteria: "Hold 10 sec on each leg", points: 1, kind: "pass_fail",
    },
    {
      num: 5, id: "pullups", name: "Pullups",
      criteria: "10 strict reps", points: 10, kind: "reps_cap",
    },
    {
      num: 6, id: "squat", name: "Squat",
      criteria: "1.50× bodyweight × 3 reps", points: 10, kind: "strength_pct",
      multiplier: 1.5,
    },
    {
      num: 7, id: "bench", name: "Bench Press",
      criteria: "1.00× bodyweight × 3 reps", points: 10, kind: "strength_pct",
      multiplier: 1.0,
    },
    {
      num: 8, id: "ohp", name: "Overhead Press",
      criteria: "0.75× bodyweight × 3 reps", points: 10, kind: "strength_pct",
      multiplier: 0.75,
    },
    {
      num: 9, id: "deadlift", name: "Deadlift",
      criteria: "1.75× bodyweight × 3 reps", points: 10, kind: "strength_pct",
      multiplier: 1.75,
    },
    {
      num: 10, id: "pushups", name: "Pushups",
      criteria: "30 strict reps", points: 5, kind: "count_shortfall",
      benchmarkReps: 30, increment: 6,
    },
    {
      num: 11, id: "dead_hang", name: "Dead Hang",
      criteria: "45 sec", points: 5, kind: "time_shortfall",
      benchmarkSec: 45, increment: 9,
    },
    {
      num: 12, id: "farmer_carry", name: "Farmer Carry",
      criteria: "Bodyweight for 100 feet", points: 5, kind: "distance_shortfall",
      benchmarkFeet: 100, increment: 20,
    },
    {
      num: 13, id: "shuttle", name: "300-Yard Shuttle",
      criteria: "≤ 70 sec", points: 10, kind: "time_over",
      benchmarkSec: 70, increment: 5,
    },
    {
      num: 14, id: "run", name: "1.5-Mile Run",
      criteria: "≤ 12:00", points: 10, kind: "time_over",
      benchmarkSec: 720, increment: 20,
    },
    {
      num: 15, id: "swim", name: "0.5-Mile Swim",
      criteria: "≤ 20:00", points: 10, kind: "time_over",
      benchmarkSec: 1200, increment: 20,
    },
  ];

  const GRADE_BANDS = [
    { min: 90, grade: "A" },
    { min: 80, grade: "B" },
    { min: 70, grade: "C" },
    { min: 60, grade: "D" },
    { min: -Infinity, grade: "E" },
  ];

  // ---------- Helpers ----------
  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  // Meeting the benchmark exactly (or beating it) earns full points. Any
  // shortfall at all costs at least 1 point, and further points are lost
  // as each additional whole increment of shortfall is crossed.
  function steppedScore(shortfall, increment, points) {
    if (shortfall <= 0) return points;
    const lost = Math.ceil(shortfall / increment);
    return clamp(points - lost, 0, points);
  }

  function parseTime(raw) {
    if (raw == null) return null;
    const s = String(raw).trim();
    const m = /^(\d{1,3}):([0-5]\d)$/.exec(s);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  function formatFeetInches(totalInches) {
    const ft = Math.floor(totalInches / 12);
    const inch = totalInches % 12;
    return `${ft}'${inch}"`;
  }

  function gradeFor(total) {
    return GRADE_BANDS.find((b) => total >= b.min).grade;
  }

  function fieldId(ev, suffix) {
    return suffix ? `perf-${ev.num}-${suffix}` : `perf-${ev.num}`;
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  // ---------- Stats (height/weight) ----------
  function getStats() {
    const heightFt = parseFloat(val("height-ft"));
    const heightIn = parseFloat(val("height-in"));
    const weight = parseFloat(val("weight-lbs"));
    const validStats =
      Number.isFinite(heightFt) && Number.isFinite(heightIn) && Number.isFinite(weight) && weight > 0;
    return {
      heightFt: Number.isFinite(heightFt) ? heightFt : null,
      heightIn: Number.isFinite(heightIn) ? heightIn : null,
      weight: Number.isFinite(weight) ? weight : null,
      totalHeightInches: validStats ? heightFt * 12 + heightIn : null,
      valid: validStats,
    };
  }

  // ---------- Benchmark cell text per event ----------
  // Before stats are calculated, shows the event's criteria as placeholder
  // text. After calculation, weight/height-dependent events show a computed
  // number in place of the variable; fixed events show the same criteria,
  // just bolded (the caller applies the "calculated" state as a CSS class).
  function benchmarkCellText(ev, stats) {
    if (!stats.valid) return { text: ev.criteria, calculated: false };
    if (ev.id === "broad_jump") {
      return { text: `Jump ≥ ${formatFeetInches(Math.round(stats.totalHeightInches))}`, calculated: true };
    }
    if (ev.kind === "strength_pct") {
      return { text: `${Math.round(ev.multiplier * stats.weight)} lbs for 3 reps`, calculated: true };
    }
    if (ev.kind === "distance_shortfall") {
      return { text: `${Math.round(stats.weight)} lbs for 100 feet`, calculated: true };
    }
    return { text: ev.criteria, calculated: true };
  }

  // ---------- Input markup per event ----------
  function inputMarkup(ev) {
    switch (ev.kind) {
      case "pass_fail":
        return `
          <select id="${fieldId(ev)}">
            <option value="">—</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>`;
      case "reps_cap":
      case "count_shortfall":
        return `<input type="number" id="${fieldId(ev)}" min="0" max="999" inputmode="numeric" placeholder="reps">`;
      case "strength_pct":
        return `<input type="number" id="${fieldId(ev)}" min="0" max="9999" inputmode="numeric" placeholder="lbs">`;
      case "distance_shortfall":
        return `<input type="number" id="${fieldId(ev)}" min="0" max="9999" inputmode="numeric" placeholder="feet">`;
      case "time_shortfall":
      case "time_over":
        return `<input type="text" id="${fieldId(ev)}" placeholder="MM:SS" maxlength="6">`;
      default:
        return "";
    }
  }

  // ---------- Score + attempted per event ----------
  function computeEvent(ev, stats) {
    switch (ev.kind) {
      case "pass_fail": {
        const v = val(fieldId(ev));
        if (v === "") return { score: 0, attempted: false, invalid: false };
        return { score: v === "pass" ? ev.points : 0, attempted: true, invalid: false };
      }
      case "reps_cap": {
        const raw = val(fieldId(ev));
        if (raw === "") return { score: 0, attempted: false, invalid: false };
        const reps = parseFloat(raw);
        if (!Number.isFinite(reps) || reps < 0) return { score: 0, attempted: false, invalid: true };
        return { score: clamp(Math.floor(reps), 0, ev.points), attempted: true, invalid: false };
      }
      case "strength_pct": {
        const raw = val(fieldId(ev));
        if (raw === "") return { score: 0, attempted: false, invalid: false };
        const lifted = parseFloat(raw);
        if (!Number.isFinite(lifted) || lifted < 0) return { score: 0, attempted: false, invalid: true };
        if (!stats.valid) return { score: 0, attempted: true, invalid: false };
        const benchmarkLbs = ev.multiplier * stats.weight;
        const shortfallPct = Math.max(0, ((benchmarkLbs - lifted) / stats.weight) * 100);
        return { score: steppedScore(shortfallPct, 5, ev.points), attempted: true, invalid: false };
      }
      case "count_shortfall": {
        const raw = val(fieldId(ev));
        if (raw === "") return { score: 0, attempted: false, invalid: false };
        const reps = parseFloat(raw);
        if (!Number.isFinite(reps) || reps < 0) return { score: 0, attempted: false, invalid: true };
        const missed = Math.max(0, ev.benchmarkReps - reps);
        return { score: steppedScore(missed, ev.increment, ev.points), attempted: true, invalid: false };
      }
      case "distance_shortfall": {
        const raw = val(fieldId(ev));
        if (raw === "") return { score: 0, attempted: false, invalid: false };
        const feet = parseFloat(raw);
        if (!Number.isFinite(feet) || feet < 0) return { score: 0, attempted: false, invalid: true };
        const shortfall = Math.max(0, ev.benchmarkFeet - feet);
        return { score: steppedScore(shortfall, ev.increment, ev.points), attempted: true, invalid: false };
      }
      case "time_shortfall": {
        const raw = val(fieldId(ev));
        if (raw === "") return { score: 0, attempted: false, invalid: false };
        const sec = parseTime(raw);
        if (sec == null) return { score: 0, attempted: false, invalid: true };
        const shortfall = Math.max(0, ev.benchmarkSec - sec);
        return { score: steppedScore(shortfall, ev.increment, ev.points), attempted: true, invalid: false };
      }
      case "time_over": {
        const raw = val(fieldId(ev));
        if (raw === "") return { score: 0, attempted: false, invalid: false };
        const sec = parseTime(raw);
        if (sec == null) return { score: 0, attempted: false, invalid: true };
        const over = Math.max(0, sec - ev.benchmarkSec);
        return { score: steppedScore(over, ev.increment, ev.points), attempted: true, invalid: false };
      }
      default:
        return { score: 0, attempted: false, invalid: false };
    }
  }

  // ---------- Render table rows (once) ----------
  function renderRows() {
    const tbody = document.getElementById("test-table-body");
    tbody.innerHTML = EVENTS.map((ev) => `
      <tr data-event="${ev.num}">
        <td class="col-num">${ev.num}</td>
        <td class="col-event">${ev.name}</td>
        <td class="col-benchmark" id="bench-${ev.num}">${ev.criteria}</td>
        <td class="col-performance">${inputMarkup(ev)}</td>
        <td class="col-score"><span class="score-earned" id="score-${ev.num}">0</span><span class="score-sep">/</span><span class="score-avail">${ev.points}</span></td>
      </tr>
    `).join("") + `
      <tr>
        <td colspan="2" class="col-event">Completion</td>
        <td class="col-benchmark" id="bench-completion">Valid attempt at all 15 events</td>
        <td class="col-performance">—</td>
        <td class="col-score"><span class="score-earned" id="score-completion">0</span><span class="score-sep">/</span><span class="score-avail">1</span></td>
      </tr>
    `;
  }

  // ---------- Recalculate everything ----------
  function recalcAll() {
    const stats = getStats();
    let total = 0;
    let allAttempted = true;

    EVENTS.forEach((ev) => {
      const result = computeEvent(ev, stats);
      document.getElementById(`score-${ev.num}`).textContent = result.score;
      total += result.score;
      if (!result.attempted) allAttempted = false;

      // mark invalid inputs
      const el = document.getElementById(fieldId(ev));
      if (el) el.classList.toggle("invalid", !!result.invalid);
    });

    const completionScore = allAttempted ? 1 : 0;
    document.getElementById("score-completion").textContent = completionScore;
    total += completionScore;

    document.getElementById("total-score").textContent = total;
    // A letter grade is only awarded once all 15 events have a valid attempt.
    document.getElementById("total-grade").textContent = allAttempted ? gradeFor(total) : "—";
  }

  function recalcBenchmarks() {
    const stats = getStats();
    EVENTS.forEach((ev) => {
      const { text, calculated } = benchmarkCellText(ev, stats);
      const cell = document.getElementById(`bench-${ev.num}`);
      cell.textContent = text;
      cell.classList.toggle("calculated", calculated);
    });
    document.getElementById("bench-completion").classList.toggle("calculated", stats.valid);
    recalcAll();
  }

  // ---------- State serialization (for share links) ----------
  function collectState() {
    const state = {
      hf: val("height-ft"), hi: val("height-in"), w: val("weight-lbs"),
    };
    EVENTS.forEach((ev) => {
      state[`e${ev.num}`] = val(fieldId(ev));
    });
    return state;
  }

  function applyState(state) {
    if (!state) return;
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el && v != null && v !== "") el.value = v;
    };
    set("height-ft", state.hf);
    set("height-in", state.hi);
    set("weight-lbs", state.w);
    EVENTS.forEach((ev) => {
      set(fieldId(ev), state[`e${ev.num}`]);
    });
  }

  function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length === 0) return null;
    const state = {};
    for (const [k, v] of params.entries()) state[k] = v;
    return state;
  }

  function buildShareUrl() {
    const state = collectState();
    const params = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => {
      if (v !== "") params.set(k, v);
    });
    const url = new URL(window.location.href);
    url.search = params.toString();
    return url.toString();
  }

  function buildShareText() {
    const stats = getStats();
    if (!stats.valid) {
      return "Check out The All-Rounder, a general physical fitness test for men. Can you meet the standard?";
    }
    const total = document.getElementById("total-score").textContent;
    const grade = document.getElementById("total-grade").textContent;
    return `I scored ${total}/100 (${grade}) on The All-Rounder fitness test. Think you can beat it?`;
  }

  // ---------- Wire up ----------
  function init() {
    renderRows();

    applyState(loadFromUrl());

    recalcBenchmarks();

    document.getElementById("stats-form").addEventListener("submit", (e) => {
      e.preventDefault();
      recalcBenchmarks();
    });

    document.getElementById("test-table-body").addEventListener("input", recalcAll);
    document.getElementById("test-table-body").addEventListener("change", recalcAll);

    document.getElementById("share-btn").addEventListener("click", async () => {
      const url = buildShareUrl();
      const text = buildShareText();
      const btn = document.getElementById("share-btn");
      const original = btn.textContent;
      const flash = (label, delay) => {
        btn.textContent = label;
        setTimeout(() => { btn.textContent = original; }, delay);
      };

      if (navigator.share) {
        try {
          await navigator.share({ title: "The All-Rounder", text, url });
        } catch (e) {
          if (e.name !== "AbortError") flash("Share failed", 1800);
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        flash("Copied!", 1800);
      } catch (e) {
        try {
          window.prompt("Copy this to share:", `${text} ${url}`);
        } catch (e2) {
          console.log("Share text:", text);
          console.log("Share link:", url);
          flash("See console for link", 2500);
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
