(() => {
  "use strict";

  const STANDARD = window.ALL_ROUNDER_STANDARD;
  const Scoring = window.AllRounderScoring;
  const LEVELS = STANDARD.levels;
  const SCORECARD_LEVELS = STANDARD.scorecardLevels.map((id) => LEVELS.find((l) => l.id === id));

  // ---------- Helpers ----------
  function checkedValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  function num(raw) {
    if (raw == null || String(raw).trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }

  function fieldId(ev, suffix) {
    return suffix ? `perf-${ev.id}-${suffix}` : `perf-${ev.id}`;
  }

  // Full name, e.g. "300-Yard Shuttle", for labels outside the scorecard.
  function fullName(ev) {
    return ev.distance ? `${ev.distance} ${ev.name}` : ev.name;
  }

  function levelLabel(id) {
    return LEVELS.find((l) => l.id === id).label;
  }

  // ---------- Demographics ----------
  function getDemographics() {
    return {
      age: num(val("age")),
      sex: checkedValue("sex"),
      bodyweight: num(val("bodyweight")),
    };
  }

  function demographicMessage(demo, status) {
    const bw = STANDARD.bodyweightLbs;
    if (demo.age != null && !status.age) {
      return "Standards currently cover ages 18 and up.";
    }
    if (demo.bodyweight != null && !status.bodyweight) {
      return `Enter a bodyweight between ${bw.min} and ${bw.max} lbs.`;
    }
    if (!status.age || !status.sex) {
      return "Enter your age and sex to see your benchmarks.";
    }
    if (!status.bodyweight) {
      return "Add your bodyweight to calibrate the barbell lifts.";
    }
    return "";
  }

  // ---------- Performance parsing per input type ----------
  // Returns { value, invalid }. An empty field is { value: null, invalid: false }.
  function readPerformance(ev) {
    switch (ev.input) {
      case "feet_inches": {
        const ft = num(val(fieldId(ev, "ft")));
        const inch = num(val(fieldId(ev, "in")));
        if (ft == null && inch == null) return { value: null, invalid: false };
        const f = ft ?? 0;
        const i = inch ?? 0;
        if (Number.isNaN(f) || Number.isNaN(i) || f < 0 || i < 0 || i >= 12) return { value: null, invalid: true };
        return { value: f * 12 + i, invalid: false };
      }
      case "time":
      case "seconds": {
        const raw = val(fieldId(ev)).trim();
        if (raw === "") return { value: null, invalid: false };
        const sec = Scoring.parseTime(raw, ev.input === "seconds");
        return sec == null || sec <= 0 ? { value: null, invalid: true } : { value: sec, invalid: false };
      }
      default: {
        const n = num(val(fieldId(ev)));
        if (n == null) return { value: null, invalid: false };
        if (Number.isNaN(n) || n < 0) return { value: null, invalid: true };
        return { value: ev.input === "reps" ? Math.floor(n) : n, invalid: false };
      }
    }
  }

  // ---------- Markup ----------
  // Shown (and announced) beside an event's input when its value can't be read.
  const INPUT_HINTS = {
    lbs: "Enter a weight in pounds.",
    reps: "Enter a number of reps.",
    time: "Use MM:SS, e.g. 11:50.",
    seconds: "Enter seconds, e.g. 65.4.",
    feet_inches: "Enter feet, and inches from 0 to 11.",
  };

  function inputMarkup(ev) {
    const name = fullName(ev);
    const hint = `hint-${ev.id}`;
    const unit = `unit-${ev.id}`;
    const described = `aria-describedby="${unit} ${hint}"`;
    switch (ev.input) {
      case "lbs":
        return `<input type="number" id="${fieldId(ev)}" aria-label="${name} result" ${described} min="0" max="2000" inputmode="decimal" placeholder="lbs"><span class="unit-label" id="${unit}">lbs</span>`;
      case "reps":
        return `<input type="number" id="${fieldId(ev)}" aria-label="${name} result" ${described} min="0" max="999" inputmode="numeric" placeholder="reps"><span class="unit-label" id="${unit}">reps</span>`;
      case "time":
        // Standard keyboard so ":" is reachable on phones.
        return `<input type="text" id="${fieldId(ev)}" aria-label="${name} result, minutes and seconds" aria-describedby="${hint}" placeholder="MM:SS" maxlength="8" autocomplete="off">`;
      case "seconds":
        return `<input type="text" id="${fieldId(ev)}" aria-label="${name} result" ${described} placeholder="sec" maxlength="8" inputmode="decimal" autocomplete="off"><span class="unit-label" id="${unit}">sec</span>`;
      case "feet_inches":
        return `
          <input type="number" id="${fieldId(ev, "ft")}" aria-label="${name} feet" aria-describedby="${hint}" min="0" max="15" inputmode="numeric" placeholder="ft" class="short">
          <span class="unit-label" aria-hidden="true">ft</span>
          <input type="number" id="${fieldId(ev, "in")}" aria-label="${name} inches" aria-describedby="${hint}" min="0" max="11.9" step="any" inputmode="decimal" placeholder="in" class="short">
          <span class="unit-label" aria-hidden="true">in</span>`;
      default:
        return "";
    }
  }

  function renderRows() {
    const list = document.getElementById("scorecard");
    list.innerHTML = STANDARD.events.map((ev, i) => `
      <li class="event-row" data-event="${ev.id}">
        <div class="ev-head">
          <span class="ev-num">${i + 1}</span>
          <div>
            <h3 class="ev-name">${ev.distance ? `<span class="ev-distance">${ev.distance}</span> ` : ""}${ev.name}</h3>
            <button type="button" class="details-toggle" aria-expanded="false" aria-controls="details-${ev.id}">Rules</button>
          </div>
        </div>
        <div class="ev-anchors">
          ${SCORECARD_LEVELS.map((l) => `
            <div class="anchor" data-level="${l.id}">
              <span class="anchor-label">${l.short}</span>
              <span class="anchor-value" id="anchor-${ev.id}-${l.id}">—</span>
            </div>`).join("")}
        </div>
        <div class="ev-input">
          ${inputMarkup(ev)}
          <p class="ev-hint" id="hint-${ev.id}" hidden>${INPUT_HINTS[ev.input]}</p>
        </div>
        <div class="ev-score">
          <span class="score-line"><span class="score-earned" id="score-${ev.id}">—</span><span class="score-avail">/10</span></span>
          <span class="level-chip" id="level-${ev.id}"></span>
        </div>
        <div class="ev-details" id="details-${ev.id}" hidden>
          <ul>${ev.rules.map((r) => `<li>${r}</li>`).join("")}</ul>
        </div>
      </li>
    `).join("");
  }

  function renderGradeTable() {
    const rows = STANDARD.grades.map((g, i) => {
      const prev = STANDARD.grades[i - 1];
      let range;
      if (!prev) range = `${g.min}&ndash;100`;
      else if (g.min === -Infinity) range = `&lt;${prev.min}`;
      else range = `${g.min}&ndash;${prev.min - 1}`;
      return `<tr><td class="num">${range}</td><th>${g.grade}</th><td>${g.label}</td></tr>`;
    });
    document.getElementById("grade-table-body").innerHTML = rows.join("");
  }

  function renderStatic() {
    document.querySelectorAll("[data-standard-version]").forEach((el) => { el.textContent = STANDARD.version; });
    document.querySelectorAll("[data-window-hours]").forEach((el) => { el.textContent = STANDARD.timeWindowHours; });
    document.getElementById("copyright-year").textContent = new Date().getFullYear();
    document.getElementById("provisional-note").hidden = STANDARD.status !== "provisional";

    document.getElementById("sex-options").innerHTML = STANDARD.sexes.map((s) => `
      <label class="segment"><input type="radio" name="sex" value="${s.id}"><span>${s.label}</span></label>`).join("");

    document.getElementById("sources-list").innerHTML =
      STANDARD.sources.map((s) => `<li>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${s.citation}</a>` : s.citation}</li>`).join("");

    renderGradeTable();
    renderRows();
  }

  function setInvalid(el, invalid) {
    el.classList.toggle("invalid", invalid);
    if (invalid) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
  }

  // ---------- Recalculate everything ----------
  function recalcAll() {
    const demo = getDemographics();
    const status = Scoring.demographicStatus(STANDARD, demo);
    document.getElementById("demo-message").textContent = demographicMessage(demo, status);
    setInvalid(document.getElementById("age"), demo.age != null && !status.age);
    setInvalid(document.getElementById("bodyweight"), demo.bodyweight != null && !status.bodyweight);

    const values = {};
    STANDARD.events.forEach((ev) => {
      const { value, invalid } = readPerformance(ev);
      values[ev.id] = value;
      document.querySelectorAll(`[data-event="${ev.id}"] .ev-input input`).forEach((el) => setInvalid(el, invalid));
      document.getElementById(`hint-${ev.id}`).hidden = !invalid;
    });

    const result = Scoring.computeResult(STANDARD, demo, values);

    result.events.forEach((r) => {
      const ev = STANDARD.events.find((e) => e.id === r.id);
      const row = document.querySelector(`[data-event="${ev.id}"]`);
      row.classList.toggle("calibrated", !!r.anchors);
      SCORECARD_LEVELS.forEach((l) => {
        const cell = document.getElementById(`anchor-${ev.id}-${l.id}`);
        cell.textContent = r.anchors ? Scoring.formatValue(ev, r.anchors[l.id]) : "—";
        cell.parentElement.classList.toggle("reached", r.level === l.id);
      });
      document.getElementById(`score-${ev.id}`).textContent = r.score == null ? "—" : r.score;
      const chip = document.getElementById(`level-${ev.id}`);
      chip.textContent = r.level ? levelLabel(r.level) : "";
      chip.dataset.level = r.level || "";
    });

    document.getElementById("total-score").textContent = result.total;
    const gradeEl = document.getElementById("total-grade");
    if (result.complete) {
      gradeEl.textContent = result.grade.grade;
      gradeEl.classList.remove("incomplete");
      document.getElementById("grade-label").textContent = result.grade.label;
    } else {
      gradeEl.textContent = "Incomplete";
      gradeEl.classList.add("incomplete");
      document.getElementById("grade-label").textContent = "";
    }

    // Announce only when the grade itself changes, not on every keystroke.
    const announce = result.complete ? `Grade ${result.grade.grade}, ${result.grade.label}.` : "Grade incomplete.";
    const announcer = document.getElementById("grade-announce");
    if (announcer.textContent !== announce) announcer.textContent = announce;
    return result;
  }

  // ---------- State serialization (for share links) ----------
  function collectState() {
    const state = { v: STANDARD.version, age: val("age"), sex: checkedValue("sex"), bw: val("bodyweight") };
    STANDARD.events.forEach((ev) => {
      if (ev.input === "feet_inches") {
        const { value } = readPerformance(ev);
        state[ev.id] = value == null ? "" : String(Scoring.roundScore(value));
      } else {
        state[ev.id] = val(fieldId(ev)).trim();
      }
    });
    return state;
  }

  function applyState(state) {
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el && v != null && v !== "") el.value = v;
    };
    set("age", state.age);
    const sexOption = document.querySelector(`input[name="sex"][value="${CSS.escape(state.sex || "")}"]`);
    if (sexOption) sexOption.checked = true;
    set("bodyweight", state.bw);
    STANDARD.events.forEach((ev) => {
      const v = state[ev.id];
      if (v == null || v === "") return;
      if (ev.input === "feet_inches") {
        const inches = Number(v);
        if (!Number.isFinite(inches)) return;
        set(fieldId(ev, "ft"), Math.floor(inches / 12));
        set(fieldId(ev, "in"), Scoring.roundScore(inches % 12));
      } else {
        set(fieldId(ev), v);
      }
    });
  }

  // ---------- Persistence (this browser only) ----------
  // Storage can be unavailable (private mode, blocked site data), so every
  // access is guarded and the page works without it.
  const STORAGE_KEY = "all-rounder:scorecard";

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState())); } catch (e) { /* not persisted */ }
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearSaved() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nothing stored */ }
  }

  function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length === 0) return null;
    const state = {};
    for (const [k, v] of params.entries()) state[k] = v;
    return state;
  }

  // Shared links carry the standard version they were recorded under. Links
  // from the original 15-event test have no version: keep only their
  // bodyweight, since none of their event results map onto this standard.
  function reconcileVersion(state) {
    const notice = document.getElementById("version-notice");
    if (!state.v) {
      notice.textContent = `This link was recorded under the original 15-event All-Rounder. Those results don't carry over to Version ${STANDARD.version}; enter your results below to rescore.`;
      notice.hidden = false;
      return { bw: state.w };
    }
    if (state.v !== STANDARD.version) {
      notice.textContent = `This link was recorded under All-Rounder Version ${state.v}. Results are shown rescored under Version ${STANDARD.version}.`;
      notice.hidden = false;
    }
    return state;
  }

  function buildShareUrl() {
    const params = new URLSearchParams();
    Object.entries(collectState()).forEach(([k, v]) => {
      if (v !== "") params.set(k, v);
    });
    const url = new URL(window.location.href);
    url.search = params.toString();
    return url.toString();
  }

  function buildShareText(result) {
    const tag = `The All-Rounder (Version ${STANDARD.version})`;
    if (result.complete) {
      return `I scored ${result.total}% (${result.grade.grade} · ${result.grade.label}) on ${tag}. Think you can beat it?`;
    }
    if (result.completedCount > 0) {
      return `I'm ${result.completedCount}/${STANDARD.events.length} events into ${tag}: ${result.total} points so far.`;
    }
    return `Check out ${tag}: 10 events, 10 hours, 100 points. How all-round is your fitness?`;
  }

  // ---------- Wire up ----------
  function init() {
    renderStatic();

    // A shared link wins over saved entries. Opening one doesn't overwrite
    // the saved scorecard until the visitor edits something.
    const urlState = loadFromUrl();
    if (urlState) applyState(reconcileVersion(urlState));
    else {
      const saved = loadSaved();
      if (saved) applyState(saved);
    }

    let result = recalcAll();

    const onEdit = () => {
      result = recalcAll();
      saveState();
    };
    ["demo-form", "scorecard"].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener("input", onEdit);
      el.addEventListener("change", onEdit);
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
      document.getElementById("demo-form").reset();
      document.querySelectorAll("#scorecard input").forEach((el) => { el.value = ""; });
      clearSaved();
      document.getElementById("version-notice").hidden = true;
      if (window.location.search) {
        history.replaceState(null, "", window.location.pathname + window.location.hash);
      }
      result = recalcAll();
      document.getElementById("age").focus();
    });
    document.getElementById("demo-form").addEventListener("submit", (e) => e.preventDefault());

    document.getElementById("scorecard").addEventListener("click", (e) => {
      const toggle = e.target.closest(".details-toggle");
      if (!toggle) return;
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      document.getElementById(toggle.getAttribute("aria-controls")).hidden = !open;
    });

    document.getElementById("share-btn").addEventListener("click", async () => {
      const url = buildShareUrl();
      const text = buildShareText(result);
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
