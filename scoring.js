// Pure scoring functions for the All-Rounder. No DOM access: everything here
// takes the standard (from standard.js) plus plain values, so it can be
// exercised directly in Node.
(function (root) {
  "use strict";

  const LEVEL_ORDER = ["advanced", "intermediate", "beginner", "unfit"];

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function roundScore(n) {
    return Math.round(n * 10) / 10;
  }

  // Accepts "M:SS", "MM:SS", "M:SS.s", and colon-free "MSS"/"MMSS" ("1150"
  // for 11:50, handy on phone keypads). With allowSeconds, bare digits are
  // seconds instead ("62.4"). Numbers pass through unchanged.
  function parseTime(raw, allowSeconds) {
    if (raw == null) return null;
    if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 ? raw : null;
    const s = String(raw).trim();
    const m = /^(\d{1,3}):([0-5]\d(?:\.\d+)?)$/.exec(s);
    if (m) return parseInt(m[1], 10) * 60 + parseFloat(m[2]);
    if (allowSeconds && /^\d+(?:\.\d+)?$/.test(s)) return parseFloat(s);
    if (!allowSeconds && /^\d{3,4}$/.test(s)) {
      const sec = parseInt(s.slice(-2), 10);
      if (sec < 60) return parseInt(s.slice(0, -2), 10) * 60 + sec;
    }
    return null;
  }

  function formatTime(sec) {
    const whole = Math.round(sec * 10) / 10;
    const m = Math.floor(whole / 60);
    const s = whole - m * 60;
    const ss = Number.isInteger(s) ? String(s).padStart(2, "0") : s.toFixed(1).padStart(4, "0");
    return `${m}:${ss}`;
  }

  function formatValue(ev, v) {
    if (v == null) return "—";
    switch (ev.input) {
      case "lbs": return String(v);
      case "reps": return String(v);
      case "time": return formatTime(v);
      case "seconds": return String(roundScore(v));
      case "feet_inches": {
        const inches = Math.round(v);
        return `${Math.floor(inches / 12)}′${inches % 12}″`;
      }
      default: return String(v);
    }
  }

  // ---------- Demographics ----------
  function ageBandFor(standard, age) {
    if (!Number.isFinite(age)) return null;
    return standard.ageBands.find((b) => age >= b.min && age <= b.max) || null;
  }

  // Returns which demographic variables are present and valid.
  function demographicStatus(standard, demo) {
    const bw = standard.bodyweightLbs;
    return {
      age: !!ageBandFor(standard, demo.age),
      sex: standard.sexes.some((s) => s.id === demo.sex),
      bodyweight: Number.isFinite(demo.bodyweight) && demo.bodyweight >= bw.min && demo.bodyweight <= bw.max,
    };
  }

  function missingVariables(ev, status) {
    return ev.variables.filter((v) => !status[v]);
  }

  // ---------- Anchors ----------
  function toAnchorObject(values) {
    const out = {};
    LEVEL_ORDER.forEach((level, i) => { out[level] = values[i]; });
    return out;
  }

  // Rounds a (possibly blended) anchor to the precision its input is entered in.
  function roundAnchor(ev, v) {
    return ev.input === "seconds" ? roundScore(v) : Math.round(v);
  }

  // A sex with `blend` (e.g. "Other") takes the mean of the listed sexes'
  // values; any other sex uses its own.
  function valuesForSex(standard, sexId, valuesFor) {
    const sex = standard.sexes.find((s) => s.id === sexId);
    if (!sex || !sex.blend) return valuesFor(sexId);
    const rows = sex.blend.map(valuesFor);
    if (rows.some((r) => !r)) return null;
    return rows[0].map((_, i) => rows.reduce((sum, r) => sum + r[i], 0) / rows.length);
  }

  // Resolves an event's four absolute anchors for the given demographics, or
  // null if a variable the event depends on is missing.
  function resolveAnchors(standard, ev, demo) {
    const status = demographicStatus(standard, demo);
    if (missingVariables(ev, status).length) return null;
    const band = ageBandFor(standard, demo.age);

    if (ev.model === "table") {
      const parse = (v) => (ev.input === "time" || ev.input === "seconds" ? parseTime(v, true) : v);
      const values = valuesForSex(standard, demo.sex, (id) => {
        const row = ev.anchors[id] && ev.anchors[id][band.id];
        return row ? row.map(parse) : null;
      });
      return values ? toAnchorObject(values.map((v) => roundAnchor(ev, v))) : null;
    }
    if (ev.model === "bodyweight_ratio") {
      const ratios = valuesForSex(standard, demo.sex, (id) => ev.ratios[id] || null);
      if (!ratios) return null;
      const factor = standard.ageFactors[band.id] ?? 1;
      const step = standard.roundLoadsTo || 1;
      const loads = ratios.map((r) => Math.round((r * demo.bodyweight * factor) / step) * step);
      return toAnchorObject(loads);
    }
    return null;
  }

  // ---------- Scoring ----------
  function meets(ev, value, threshold) {
    return ev.direction === "lower" ? value <= threshold : value >= threshold;
  }

  function levelFor(ev, anchors, value) {
    return LEVEL_ORDER.find((level) => level === "unfit" || meets(ev, value, anchors[level]));
  }

  function zeroPointFor(ev, anchors) {
    if (ev.zeroAt != null) return ev.zeroAt;
    const gap = Math.abs(anchors.beginner - anchors.unfit);
    return ev.direction === "lower"
      ? anchors.unfit + gap
      : Math.max(0, anchors.unfit - gap);
  }

  // Piecewise-linear interpolation through (zero, 0), (U, 2.5), (B, 5),
  // (I, 7.5), (A, 10). Nothing beyond Advanced.
  function scoreEvent(standard, ev, anchors, value) {
    const pts = standard.scoring.anchorPoints;
    const max = standard.scoring.maxPoints;
    // Flip lower-is-better events so every curve rises left to right.
    const sign = ev.direction === "lower" ? -1 : 1;
    const curve = [
      [zeroPointFor(ev, anchors), 0],
      [anchors.unfit, pts.unfit],
      [anchors.beginner, pts.beginner],
      [anchors.intermediate, pts.intermediate],
      [anchors.advanced, pts.advanced],
    ].map(([x, y]) => [sign * x, y]);

    const x = sign * value;
    if (x >= curve[curve.length - 1][0]) return max;
    if (x <= curve[0][0]) return 0;
    for (let i = 1; i < curve.length; i++) {
      const [x1, y1] = curve[i];
      if (x <= x1) {
        const [x0, y0] = curve[i - 1];
        if (x1 === x0) return y1;
        return clamp(y0 + ((x - x0) / (x1 - x0)) * (y1 - y0), 0, max);
      }
    }
    return max;
  }

  function gradeFor(standard, total) {
    return standard.grades.find((g) => total >= g.min);
  }

  // values: { [eventId]: number | null } of already-parsed performances.
  function computeResult(standard, demo, values) {
    const events = standard.events.map((ev) => {
      const anchors = resolveAnchors(standard, ev, demo);
      const value = values[ev.id];
      if (!anchors || value == null) return { id: ev.id, anchors, value, score: null, level: null };
      return {
        id: ev.id,
        anchors,
        value,
        score: roundScore(scoreEvent(standard, ev, anchors, value)),
        level: levelFor(ev, anchors, value),
      };
    });
    const scored = events.filter((e) => e.score != null);
    // The total is shown and graded as a whole number, rounded down so a
    // grade is never awarded for points not earned. Summing to one decimal
    // first keeps float error (e.g. 89.99999) from dropping a point.
    const total = Math.floor(roundScore(scored.reduce((sum, e) => sum + e.score, 0)));
    const complete = scored.length === standard.events.length;
    return {
      events,
      total,
      completedCount: scored.length,
      complete,
      grade: complete ? gradeFor(standard, total) : null,
    };
  }

  const api = {
    LEVEL_ORDER,
    roundScore,
    parseTime,
    formatTime,
    formatValue,
    ageBandFor,
    demographicStatus,
    missingVariables,
    resolveAnchors,
    levelFor,
    scoreEvent,
    gradeFor,
    computeResult,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AllRounderScoring = api;
})(typeof window !== "undefined" ? window : globalThis);
