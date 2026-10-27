// Pure calculation helpers. No DOM access, so these can be unit tested in Node.

export const LB_PER_KG = 2.20462;
export const CM_PER_IN = 2.54;

export function round(value, step = 1) {
  return Math.round(value / step) * step;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Predicted (ideal) body weight, ARDSnet / Devine formula. Used for tidal volume.
export function predictedBodyWeight(sex, heightCm) {
  if (!heightCm || heightCm <= 0) return null;
  const base = sex === "female" ? 45.5 : 50;
  return Math.max(base + 0.91 * (heightCm - 152.4), 20);
}

export function bmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

// Janmahasatian lean body weight.
export function leanBodyWeight(sex, weightKg, heightCm) {
  const b = bmi(weightKg, heightCm);
  if (!b) return null;
  return sex === "female"
    ? (9270 * weightKg) / (8780 + 244 * b)
    : (9270 * weightKg) / (6680 + 216 * b);
}

export function shockIndex(hr, sbp) {
  if (!hr || !sbp) return null;
  return hr / sbp;
}

// Winter's formula: expected PaCO2 for a primary metabolic acidosis.
export function wintersExpectedPaCO2(hco3) {
  if (!hco3) return null;
  const mid = 1.5 * hco3 + 8;
  return { low: mid - 2, mid, high: mid + 2 };
}

// Inspiratory time (s) for a given rate and I:E ratio expressed as 1:x.
export function inspiratoryTime(rate, ieExpiratory) {
  if (!rate || !ieExpiratory) return null;
  const cycle = 60 / rate;
  return cycle / (1 + ieExpiratory);
}

// ARDSnet lower-PEEP / higher-FiO2 table. Returns the PEEP range for a FiO2 (0.3–1.0).
const ARDSNET_LOW_PEEP = [
  [0.3, [5, 5]],
  [0.4, [5, 8]],
  [0.5, [8, 10]],
  [0.6, [10, 10]],
  [0.7, [10, 14]],
  [0.8, [14, 14]],
  [0.9, [14, 18]],
  [1.0, [18, 24]],
];

export function ardsnetPeepForFio2(fio2) {
  let match = ARDSNET_LOW_PEEP[0];
  for (const row of ARDSNET_LOW_PEEP) {
    if (fio2 + 1e-9 >= row[0]) match = row;
  }
  return { fio2: match[0], peepLow: match[1][0], peepHigh: match[1][1] };
}

export const ARDSNET_TABLE = ARDSNET_LOW_PEEP;

export function shockState(p) {
  const si = shockIndex(p.hr, p.sbp);
  const hypotensive = (p.sbp && p.sbp < 90) || (p.map && p.map < 65);
  return { si, hypotensive: Boolean(hypotensive), shock: Boolean(hypotensive || (si !== null && si >= 0.9)) };
}

// Weight-based RSI and post-intubation drug doses for adults.
export function rsiDrugs(p) {
  const tbw = p.weightKg;
  if (!tbw) return null;
  const ibw = predictedBodyWeight(p.sex, p.heightCm) ?? tbw;
  const lbw = leanBodyWeight(p.sex, tbw, p.heightCm) ?? tbw;
  const obese = (bmi(tbw, p.heightCm) ?? 0) >= 30;
  const { shock } = shockState(p);
  // In obesity, induction agents and rocuronium are dosed on lean/ideal weight; succinylcholine on total weight.
  const inductionWt = obese ? lbw : tbw;
  const rocWt = obese ? ibw : tbw;

  const dose = (perKg, wt, cap) => {
    const mg = perKg * wt;
    return cap ? Math.min(mg, cap) : mg;
  };

  const induction = [
    {
      name: "Ketamine",
      perKg: shock ? "0.5–1 mg/kg" : "1–2 mg/kg",
      mg: shock ? [dose(0.5, inductionWt), dose(1, inductionWt)] : [dose(1, inductionWt), dose(2, inductionWt)],
      unit: "mg",
      weightBasis: obese ? "LBW" : "TBW",
      note: "Preferred in hypotension and bronchospasm. Concentration varies (10/50/100 mg/mL) — verify vial.",
      preferred: true,
    },
    {
      name: "Etomidate",
      perKg: shock ? "0.15–0.2 mg/kg" : "0.3 mg/kg",
      mg: shock ? [dose(0.15, inductionWt), dose(0.2, inductionWt)] : [dose(0.3, inductionWt)],
      unit: "mg",
      conc: 2,
      weightBasis: obese ? "LBW" : "TBW",
      note: "Hemodynamically neutral. 2 mg/mL.",
    },
    {
      name: "Propofol",
      perKg: shock ? "AVOID in shock" : "1–1.5 mg/kg",
      mg: shock ? null : [dose(1, inductionWt), dose(1.5, inductionWt)],
      unit: "mg",
      conc: 10,
      weightBasis: obese ? "LBW" : "TBW",
      note: "Causes hypotension. Only if hemodynamically stable. 10 mg/mL.",
      avoid: shock,
    },
  ];

  const paralytics = [
    {
      name: "Rocuronium",
      perKg: shock ? "1.2–1.6 mg/kg" : "1.2 mg/kg",
      mg: shock ? [dose(1.2, rocWt), dose(1.6, rocWt)] : [dose(1.2, rocWt)],
      unit: "mg",
      conc: 10,
      weightBasis: obese ? "IBW" : "TBW",
      note: "Onset 45–60 s, duration 45–70+ min. No hyperkalemia risk. 10 mg/mL.",
      preferred: true,
    },
    {
      name: "Succinylcholine",
      perKg: "1.5 mg/kg (max 200 mg)",
      mg: [dose(1.5, tbw, 200)],
      unit: "mg",
      conc: 20,
      weightBasis: "TBW",
      note: "Onset 45 s, duration 8–10 min. Check contraindications below. 20 mg/mL.",
    },
  ];

  const postIntubation = [
    {
      name: "Fentanyl (analgesia first)",
      perKg: "1 mcg/kg bolus; infusion 0.5–2 mcg/kg/h",
      mg: [dose(1, ibw)],
      unit: "mcg",
      conc: 50,
      weightBasis: "IBW",
      note: "Typical 25–100 mcg IV q 10–15 min PRN. 50 mcg/mL.",
    },
    {
      name: "Ketamine",
      perKg: "0.5–1 mg/kg bolus PRN; infusion 0.5–2 mg/kg/h",
      mg: [dose(0.5, inductionWt), dose(1, inductionWt)],
      unit: "mg",
      weightBasis: obese ? "LBW" : "TBW",
      note: "Good choice when hypotensive.",
    },
    {
      name: "Midazolam",
      perKg: "0.02–0.05 mg/kg bolus; infusion 0.02–0.1 mg/kg/h",
      mg: [dose(0.02, ibw), dose(0.05, ibw)],
      unit: "mg",
      weightBasis: "IBW",
      note: "Can drop BP — use smaller doses in shock.",
    },
    {
      name: "Propofol infusion",
      perKg: "5–50 mcg/kg/min",
      mg: null,
      unit: "",
      weightBasis: obese ? "LBW" : "TBW",
      note: "Only if BP tolerates. Start low and titrate.",
      avoid: shock,
    },
  ];

  return { tbw, ibw, lbw, obese, shock, induction, paralytics, postIntubation };
}

// Initial Hamilton T1 settings for a patient + condition profile.
export function ventSettings(p, condition) {
  const pbw = predictedBodyWeight(p.sex, p.heightCm);
  if (!pbw || !condition) return null;
  const v = condition.vent;

  const vtPerKg = v.vtPerKg;
  const vt = round(clamp(vtPerKg * pbw, 200, 800), 10);
  let rate = v.rate;
  let peep = v.peep;
  const fio2 = v.fio2;
  const notes = [];

  if (condition.id === "metabolic" && p.preRate) {
    // Match the patient's own compensatory minute ventilation as closely as possible.
    rate = clamp(Math.max(rate, p.preRate), rate, 35);
    notes.push(`Rate matched toward pre-intubation RR of ${p.preRate}/min (max 35).`);
  }

  const b = bmi(p.weightKg, p.heightCm);
  if (b && b >= 35 && condition.id !== "obstructive") {
    peep = Math.max(peep, 8);
    notes.push("BMI ≥ 35: PEEP raised to at least 8 cmH₂O to offset chest-wall weight; titrate 8–12.");
  }

  const ie = v.ie;
  const ti = inspiratoryTime(rate, ie);
  const mv = (vt * rate) / 1000;
  const pmax = v.pmax ?? 40;

  let etco2Target = v.etco2;
  if (condition.id === "metabolic") {
    const w = wintersExpectedPaCO2(p.hco3);
    if (w) {
      etco2Target = `PaCO₂ ≈ ${round(w.low)}–${round(w.high)} mmHg (Winter's, HCO₃ ${p.hco3})`;
    }
    if (p.preEtco2) {
      etco2Target = `Match pre-intubation EtCO₂ ≈ ${p.preEtco2} mmHg` + (p.hco3 ? `; ${etco2Target}` : "");
    }
  }

  return {
    pbw,
    vtPerKg,
    vt,
    rate,
    peep,
    fio2,
    ie,
    ti,
    mv,
    pmax,
    pinspLimit: pmax - 10,
    spo2Target: v.spo2,
    etco2Target,
    notes,
    alarms: {
      pressureHigh: pmax,
      expMinVolLow: round(mv * 0.6, 0.1),
      expMinVolHigh: round(mv * 1.5, 0.1),
      vtHigh: round(vt * 1.5, 10),
      fTotalHigh: rate + 10,
      fTotalLow: Math.max(rate - 6, 4),
      apnea: 20,
    },
  };
}

// Oxygen cylinder duration. Factors are L/psi for standard US cylinders.
export const CYLINDER_FACTORS = { D: 0.16, E: 0.28, M: 1.56, H: 3.14 };

// Estimated O2 use (L/min) for a turbine ventilator that blends room air with O2,
// plus a fixed safety margin for leaks/bias flow.
export function o2ConsumptionLpm(mvL, fio2Pct, marginLpm = 1) {
  const fraction = clamp((fio2Pct - 21) / 79, 0, 1);
  return mvL * fraction + marginLpm;
}

export function cylinderMinutes(cylinder, psi, consumptionLpm, residualPsi = 200) {
  const factor = CYLINDER_FACTORS[cylinder];
  if (!factor || !psi || !consumptionLpm) return null;
  return Math.max(0, ((psi - residualPsi) * factor) / consumptionLpm);
}
