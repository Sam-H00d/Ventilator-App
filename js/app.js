import {
  LB_PER_KG, CM_PER_IN, round, predictedBodyWeight, bmi, shockState, rsiDrugs, ventSettings,
  ardsnetPeepForFio2, ARDSNET_TABLE, o2ConsumptionLpm, cylinderMinutes,
} from "./calc.js";
import {
  CONDITIONS, INTUBATION_PHASES, SUX_CONTRAINDICATIONS, HAMILTON_SETUP, TROUBLESHOOT,
} from "./data.js";

const STORE_KEY = "rsi-vent-app-v1";
const $ = (sel, root = document) => root.querySelector(sel);

// localStorage can be unavailable (private mode, blocked storage) — the app must still work.
function loadState() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {}; } catch { return {}; }
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

const state = Object.assign({ patient: {}, checks: {}, clockStart: null, disclaimerOk: false }, loadState());

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n, d = 0) => (n === null || n === undefined || Number.isNaN(n) ? "—" : Number(n).toFixed(d));

// ---------- Patient ----------

const form = $("#patient-form");
const conditionSelect = $("#condition-select");
conditionSelect.innerHTML = CONDITIONS.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");

function restoreForm() {
  for (const [k, v] of Object.entries(state.patient)) {
    const el = form.elements[k];
    if (!el) continue;
    if (el instanceof RadioNodeList) {
      for (const r of el) r.checked = r.value === v;
    } else {
      el.value = v;
    }
  }
}

function readPatient() {
  const raw = Object.fromEntries(new FormData(form).entries());
  state.patient = raw;
  saveState();
  const num = (k) => (raw[k] === "" || raw[k] === undefined ? null : Number(raw[k]));
  let heightCm = num("height");
  if (heightCm && raw.heightUnit === "in") heightCm *= CM_PER_IN;
  let weightKg = num("weight");
  if (weightKg && raw.weightUnit === "lb") weightKg /= LB_PER_KG;
  return {
    sex: raw.sex || "male",
    heightCm,
    weightKg,
    hr: num("hr"),
    sbp: num("sbp"),
    spo2: num("spo2"),
    preRate: num("preRate"),
    preEtco2: num("preEtco2"),
    hco3: num("hco3"),
    condition: CONDITIONS.find((c) => c.id === raw.condition) ?? CONDITIONS[0],
  };
}

function patientFlags(p) {
  const flags = [];
  const { si, hypotensive, shock } = shockState(p);
  if (hypotensive) {
    flags.push({ level: "danger", text: "<strong>Hypotensive.</strong> Resuscitate before you intubate: fluids/blood, push-dose pressor ready, start an infusion if needed. Induction doses reduced." });
  } else if (shock) {
    flags.push({ level: "warn", text: `<strong>Shock index ${fmt(si, 2)} (≥ 0.9).</strong> High risk of peri-intubation arrest. Optimize BP first; induction doses reduced.` });
  }
  if (p.spo2 !== null && p.spo2 < 93) {
    flags.push({ level: "danger", text: "<strong>SpO₂ < 93%.</strong> Pre-oxygenate with BVM + PEEP valve or NIV. Consider delayed sequence intubation." });
  }
  const b = bmi(p.weightKg, p.heightCm);
  if (b && b >= 30) {
    flags.push({ level: "warn", text: `<strong>BMI ${fmt(b, 0)}.</strong> Ramp position, expect rapid desaturation, use PBW for tidal volume, LBW/IBW for some drugs.` });
  }
  if (p.heightCm && (p.heightCm < 140 || p.heightCm > 215)) {
    flags.push({ level: "warn", text: "Check height — outside typical adult range. This app is for adult patients only." });
  }
  if (p.condition.id === "metabolic" && !p.preRate && !p.preEtco2) {
    flags.push({ level: "info", text: "Metabolic acidosis: enter pre-intubation RR and EtCO₂ (optional section) so vent settings can match them." });
  }
  return flags;
}

function renderFlags(container, flags) {
  container.innerHTML = flags.map((f) => `<div class="flag ${f.level}">${f.text}</div>`).join("");
}

function renderPatient(p) {
  $("#condition-examples").textContent = p.condition.examples;
  const pbw = predictedBodyWeight(p.sex, p.heightCm);
  const b = bmi(p.weightKg, p.heightCm);
  const { si } = shockState(p);
  $("#patient-derived").innerHTML = `
    <dl>
      <div><dt>Predicted body wt (PBW)</dt><dd>${pbw ? fmt(pbw, 0) + " kg" : "—"}</dd></div>
      <div><dt>Actual weight</dt><dd>${p.weightKg ? fmt(p.weightKg, 0) + " kg" : "—"}</dd></div>
      <div><dt>BMI</dt><dd>${fmt(b, 0)}</dd></div>
      <div><dt>Shock index</dt><dd>${fmt(si, 2)}</dd></div>
      <div><dt>Vt 6 / 8 mL/kg</dt><dd>${pbw ? `${round(pbw * 6, 10)} / ${round(pbw * 8, 10)}` : "—"}</dd></div>
    </dl>`;
  renderFlags($("#patient-flags"), patientFlags(p));

  const parts = [];
  if (p.heightCm) parts.push(`${p.sex === "female" ? "F" : "M"} ${fmt(p.heightCm, 0)} cm`);
  if (p.weightKg) parts.push(`${fmt(p.weightKg, 0)} kg`);
  if (pbw) parts.push(`PBW ${fmt(pbw, 0)}`);
  parts.push(p.condition.name);
  $("#patient-summary").textContent = parts.join(" · ");
}

// ---------- Checklists ----------

function checklistHtml(group, phases) {
  return phases.map((phase, pi) => {
    const items = phase.items.map((text, ii) => {
      const id = `${group}-${phase.id ?? pi}-${ii}`;
      const checked = state.checks[id] ? "checked" : "";
      return `<li><label><input type="checkbox" data-check="${id}" ${checked}><span>${esc(text)}</span></label></li>`;
    }).join("");
    return `<div class="card" data-phase>
      <div class="phase-head"><h3>${esc(phase.title)}</h3><span class="progress"></span></div>
      <ul class="checklist">${items}</ul>
    </div>`;
  }).join("");
}

function updateProgress(root = document) {
  for (const card of root.querySelectorAll("[data-phase]")) {
    const boxes = card.querySelectorAll("input[data-check]");
    const done = [...boxes].filter((b) => b.checked).length;
    const el = card.querySelector(".progress");
    el.textContent = `${done}/${boxes.length}`;
    el.classList.toggle("done", done === boxes.length);
  }
}

document.addEventListener("change", (e) => {
  const id = e.target.dataset?.check;
  if (!id) return;
  state.checks[id] = e.target.checked;
  saveState();
  updateProgress();
});

for (const btn of document.querySelectorAll("[data-reset]")) {
  btn.addEventListener("click", () => {
    const group = btn.dataset.reset;
    for (const k of Object.keys(state.checks)) if (k.startsWith(group + "-")) delete state.checks[k];
    saveState();
    render();
  });
}

// ---------- Intubation ----------

function drugRows(list) {
  return list.map((d) => {
    let dose = "—";
    if (d.mg) {
      const unit = d.unit;
      const r = d.mg.map((m) => fmt(m, unit === "mcg" || m >= 20 ? 0 : 1));
      dose = `${r.join("–")} ${unit}`;
      if (d.conc) {
        const ml = d.mg.map((m) => fmt(m / d.conc, 1));
        dose += `<br><span class="hint">${ml.join("–")} mL</span>`;
      }
    }
    return `<tr class="${d.avoid ? "avoid" : ""}">
      <td>${esc(d.name)}${d.preferred ? '<span class="tag">preferred</span>' : ""}</td>
      <td>${esc(d.perKg)}<br><span class="hint">${d.weightBasis}</span></td>
      <td class="dose">${dose}</td>
      <td class="note">${esc(d.note)}</td>
    </tr>`;
  }).join("");
}

function drugTable(title, list) {
  return `<div class="card"><h3>${esc(title)}</h3><div class="table-wrap"><table>
    <thead><tr><th>Drug</th><th>Dose</th><th>Calculated</th><th>Notes</th></tr></thead>
    <tbody>${drugRows(list)}</tbody></table></div></div>`;
}

function renderIntubation(p) {
  const flags = patientFlags(p).filter((f) => f.level !== "info");
  if (p.condition.intubation.length) {
    flags.unshift({
      level: "info",
      text: `<strong>${esc(p.condition.name)}:</strong><ul>${p.condition.intubation.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`,
    });
  }
  renderFlags($("#intubate-flags"), flags);
  $("#intubate-steps").innerHTML = checklistHtml("intubate", INTUBATION_PHASES);

  const drugs = rsiDrugs(p);
  if (!drugs) {
    $("#drug-tables").innerHTML = `<div class="card empty">Enter weight (and height) on the Patient tab to calculate doses.</div>`;
  } else {
    const basis = `TBW ${fmt(drugs.tbw, 0)} kg · IBW ${fmt(drugs.ibw, 0)} kg · LBW ${fmt(drugs.lbw, 0)} kg` +
      (drugs.shock ? " · <strong>shock dosing</strong>" : "");
    $("#drug-tables").innerHTML =
      `<p class="hint">${basis}</p>` +
      drugTable("Induction (choose one)", drugs.induction) +
      drugTable("Paralytic (choose one)", drugs.paralytics) +
      drugTable("Post-intubation analgesia & sedation", drugs.postIntubation) +
      `<div class="card"><h3>Push-dose pressors</h3><div class="table-wrap"><table><tbody>
        <tr><td>Epinephrine 10 mcg/mL</td><td class="dose">10–20 mcg</td><td>0.5–2 mL IV q 2–5 min. Mix: 1 mL of 0.1 mg/mL (1 mg/10 mL) epi + 9 mL NS.</td></tr>
        <tr><td>Phenylephrine 100 mcg/mL</td><td class="dose">50–200 mcg</td><td>0.5–2 mL IV q 2–5 min. Pure vasoconstrictor — avoid in cardiogenic shock.</td></tr>
      </tbody></table></div></div>`;
  }
  $("#sux-contra").innerHTML = SUX_CONTRAINDICATIONS.map((t) => `<li>${esc(t)}</li>`).join("");
}

// ---------- Vent ----------

let currentMv = null;

function renderVent(p) {
  const c = p.condition;
  const v = ventSettings(p, c);
  const box = $("#vent-settings");
  if (!v) {
    currentMv = null;
    box.innerHTML = `<div class="card empty">Enter sex and height on the Patient tab to calculate settings (tidal volume uses predicted body weight).</div>`;
  } else {
    currentMv = v.mv;
    const tile = (k, val, sub = "") => `<div class="setting"><div class="k">${k}</div><div class="v">${val}</div><div class="s">${sub}</div></div>`;
    const ardsnet = c.showArdsnet ? ardsnetHtml(v.fio2) : "";
    box.innerHTML = `<div class="card">
        <h3>${esc(c.name)}</h3>
        <div class="mode">Mode: ${esc(c.mode)}</div>
        <div class="settings-grid">
          ${tile("Vt", `${v.vt} mL`, `${v.vtPerKg} mL/kg × PBW ${fmt(v.pbw, 0)} kg`)}
          ${tile("Rate", `${v.rate} /min`)}
          ${tile("PEEP", `${v.peep} cmH₂O`)}
          ${tile("Oxygen", `${v.fio2}%`, `Titrate to SpO₂ ${esc(v.spo2Target)}`)}
          ${tile("I:E", `1:${v.ie}`, `Tinsp ≈ ${fmt(v.ti, 2)} s`)}
          ${tile("Minute vol.", `${fmt(v.mv, 1)} L/min`)}
          ${tile("Pressure high", `${v.pmax} cmH₂O`, `APV Pinsp limit ${v.pinspLimit}`)}
          ${tile("Trigger", "Flow 2–5 L/min", "ETS 25%")}
        </div>
        <p><strong>EtCO₂ / PaCO₂ target:</strong> ${esc(v.etco2Target)}</p>
        ${v.notes.map((n) => `<div class="flag info">${esc(n)}</div>`).join("")}
        <h3>Goals & tips</h3>
        <ul>${c.goals.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>
      </div>
      ${ardsnet}
      <div class="card"><h3>Alarm limits (starting point)</h3><div class="table-wrap"><table><tbody>
        <tr><td>Pressure high (Pmax)</td><td class="dose">${v.alarms.pressureHigh} cmH₂O</td></tr>
        <tr><td>ExpMinVol low / high</td><td class="dose">${fmt(v.alarms.expMinVolLow, 1)} / ${fmt(v.alarms.expMinVolHigh, 1)} L/min</td></tr>
        <tr><td>Vt high</td><td class="dose">${v.alarms.vtHigh} mL</td></tr>
        <tr><td>fTotal low / high</td><td class="dose">${v.alarms.fTotalLow} / ${v.alarms.fTotalHigh} /min</td></tr>
        <tr><td>PetCO₂ low / high</td><td class="dose">Bracket the EtCO₂ target ±5–10 mmHg</td></tr>
        <tr><td>Apnea time</td><td class="dose">${v.alarms.apnea} s</td></tr>
      </tbody></table></div></div>`;
  }
  $("#vent-steps").innerHTML = checklistHtml("vent", HAMILTON_SETUP.map((s, i) => ({ ...s, id: i })));
  renderO2();
}

function ardsnetHtml(fio2Pct) {
  const current = ardsnetPeepForFio2(fio2Pct / 100);
  const rows = ARDSNET_TABLE.map(([f, [lo, hi]]) => {
    const peep = lo === hi ? `${lo}` : `${lo}–${hi}`;
    const mark = f === current.fio2 ? ' style="font-weight:800"' : "";
    return `<tr${mark}><td>${Math.round(f * 100)}%</td><td>${peep}</td></tr>`;
  }).join("");
  return `<div class="card"><h3>ARDSnet PEEP / FiO₂ (lower-PEEP table)</h3>
    <p class="hint">Start PEEP 10, then step up PEEP with FiO₂ to keep SpO₂ 88–95%. Watch BP as PEEP rises.</p>
    <div class="table-wrap"><table><thead><tr><th>FiO₂</th><th>PEEP (cmH₂O)</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

const o2Form = $("#o2-calc");
function renderO2() {
  const cyl = o2Form.querySelector("[name=cyl]").value;
  const psi = Number(o2Form.querySelector("[name=psi]").value);
  const fio2 = Number(o2Form.querySelector("[name=fio2]").value);
  const out = $("#o2-result");
  if (!currentMv) { out.textContent = "Enter patient height to estimate minute volume."; return; }
  const use = o2ConsumptionLpm(currentMv, fio2);
  const mins = cylinderMinutes(cyl, psi, use);
  out.textContent = mins === null
    ? "Enter cylinder pressure."
    : `≈ ${fmt(use, 1)} L/min O₂ → about ${fmt(mins, 0)} min to 200 psi. Estimate only — watch the gauge.`;
}
o2Form.addEventListener("input", renderO2);

// ---------- Troubleshooting ----------

function renderTrouble() {
  $("#trouble-list").innerHTML = TROUBLESHOOT.map((t) =>
    `<div class="card"><h3>${esc(t.title)}</h3><ul>${t.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`
  ).join("");
}

// ---------- RSI clock ----------

const clockBtn = $("#clock-btn");
const clockTime = $("#clock-time");
let clockTimer = null;

function tickClock() {
  const s = Math.floor((Date.now() - state.clockStart) / 1000);
  clockTime.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function syncClock() {
  clearInterval(clockTimer);
  if (state.clockStart) {
    clockTime.hidden = false;
    clockBtn.textContent = "Stop";
    tickClock();
    clockTimer = setInterval(tickClock, 1000);
  } else {
    clockTime.hidden = true;
    clockBtn.textContent = "Start RSI clock";
  }
}
clockBtn.addEventListener("click", () => {
  if (state.clockStart && !confirm("Stop and reset the RSI clock?")) return;
  state.clockStart = state.clockStart ? null : Date.now();
  saveState();
  syncClock();
});

// ---------- Navigation ----------

function showTab() {
  const name = location.hash.replace("#", "") || "patient";
  for (const sec of document.querySelectorAll(".tab")) sec.hidden = sec.dataset.tab !== name;
  for (const a of document.querySelectorAll("[data-nav]")) a.classList.toggle("active", a.dataset.nav === name);
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", showTab);

// ---------- Wiring ----------

function render() {
  const p = readPatient();
  renderPatient(p);
  renderIntubation(p);
  renderVent(p);
  updateProgress();
}

form.addEventListener("input", render);
form.addEventListener("change", render);
$("#clear-patient").addEventListener("click", () => {
  form.reset();
  state.checks = {};
  render();
});

const disclaimer = $("#disclaimer");
if (state.disclaimerOk) disclaimer.hidden = true;
$("#dismiss-disclaimer").addEventListener("click", () => {
  state.disclaimerOk = true;
  saveState();
  disclaimer.hidden = true;
});

restoreForm();
renderTrouble();
render();
syncClock();
showTab();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
