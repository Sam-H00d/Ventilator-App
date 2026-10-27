// Clinical content: patient condition profiles, intubation checklist, Hamilton T1 setup and troubleshooting.
// Starting points only — always follow local protocol, medical direction and the Hamilton operator's manual.

export const CONDITIONS = [
  {
    id: "normal",
    name: "Normal lungs / airway protection",
    examples: "Overdose, stroke, seizure, GCS ≤ 8 without lung injury, combative patient",
    vent: { vtPerKg: 7, rate: 16, peep: 5, fio2: 100, ie: 2, spo2: "94–98%", etco2: "35–45 mmHg" },
    mode: "APVcmv / (S)CMV+",
    goals: [
      "Lung-protective Vt 6–8 mL/kg PBW even with healthy lungs.",
      "Wean FiO₂ quickly once SpO₂ is stable — avoid hyperoxia (SpO₂ 100% for long periods).",
      "Plateau pressure < 30 cmH₂O, driving pressure (Pplat − PEEP) < 15.",
    ],
    intubation: [],
  },
  {
    id: "ards",
    name: "Hypoxemic failure / ARDS / pneumonia",
    examples: "Pneumonia, sepsis with ARDS, aspiration, pulmonary contusion, near-drowning, COVID",
    vent: { vtPerKg: 6, rate: 22, peep: 10, fio2: 100, ie: 2, spo2: "88–95%", etco2: "Permissive hypercapnia OK if pH ≥ 7.25" },
    mode: "APVcmv / (S)CMV+",
    goals: [
      "Vt 6 mL/kg PBW (range 4–8). Drop by 1 mL/kg if Pplat > 30 cmH₂O.",
      "Titrate PEEP/FiO₂ with the ARDSnet table below — FiO₂ 100% pairs with PEEP 18–24.",
      "Rate 20–30 to keep up with minute ventilation; watch for auto-PEEP above 30/min.",
      "Driving pressure (Pplat − PEEP) ≤ 15 cmH₂O.",
      "Do not disconnect the circuit — derecruitment. Clamp the ETT for circuit changes.",
    ],
    intubation: [
      "High desaturation risk: pre-oxygenate with NIV/BVM + PEEP valve 10–15 cmH₂O for ≥ 3 min.",
      "Apneic oxygenation: nasal cannula 15 L/min during the attempt.",
      "If SpO₂ < 93% despite NIV, consider delayed sequence intubation (ketamine 1 mg/kg, then pre-oxygenate).",
    ],
    showArdsnet: true,
  },
  {
    id: "obstructive",
    name: "Obstructive: asthma / COPD",
    examples: "Status asthmaticus, COPD exacerbation, anaphylaxis with bronchospasm",
    vent: { vtPerKg: 6, rate: 10, peep: 5, fio2: 100, ie: 4, spo2: "88–92% (COPD) / 92–96% (asthma)", etco2: "Permissive hypercapnia, pH ≥ 7.20", pmax: 45 },
    mode: "(S)CMV (volume) or APVcmv / (S)CMV+",
    goals: [
      "Maximize expiratory time: low rate (8–12), I:E 1:4–1:5, short Tinsp (0.8–1.0 s).",
      "Check expiratory flow waveform — it must return to zero before the next breath.",
      "Measure AutoPEEP (expiratory hold / Monitoring → AutoPEEP). Keep Pplat < 30 cmH₂O.",
      "Peak pressure will be high from airway resistance — follow PLATEAU pressure, not peak.",
      "Low PEEP 5 cmH₂O (COPD: may set up to ~80% of measured AutoPEEP).",
      "Continue bronchodilators in-line (nebulizer key / MDI adapter).",
    ],
    intubation: [
      "Ketamine is the induction agent of choice (bronchodilator).",
      "Largest tube possible (≥ 8.0 adult) to reduce resistance and allow bronchoscopy.",
      "AVOID fast bagging after intubation — 6–8 breaths/min. Breath stacking → hypotension / PEA.",
      "If BP crashes after intubation: disconnect from the vent and press on the chest to let air out.",
    ],
  },
  {
    id: "metabolic",
    name: "Severe metabolic acidosis",
    examples: "DKA, salicylate toxicity, sepsis with lactic acidosis, toxic alcohols",
    vent: { vtPerKg: 8, rate: 24, peep: 5, fio2: 100, ie: 2, spo2: "94–98%", etco2: "Match pre-intubation EtCO₂ (often 15–25 mmHg)" },
    mode: "APVcmv / (S)CMV+ (or ASV at %MinVol 150–200%)",
    goals: [
      "MATCH the patient's pre-intubation minute ventilation — enter their RR and EtCO₂ in the Patient tab.",
      "Vt up to 8 mL/kg PBW with rate 24–35 if Pplat allows.",
      "Even a short period of apnea/hypoventilation can cause a fatal pH drop.",
      "Salicylate toxicity: hyperventilate aggressively; intubate only if unavoidable.",
      "Recheck blood gas within 20–30 min; target pH ≥ 7.20 or pre-intubation pH.",
    ],
    intubation: [
      "Avoid intubation if at all possible — maximize NIV and treat the cause.",
      "Minimize apnea time: experienced operator, first-pass success, bag 20–30/min with PEEP during apnea only if SpO₂ drops.",
      "Consider bicarbonate per medical direction before induction in severe acidemia.",
    ],
  },
  {
    id: "tbi",
    name: "TBI / elevated ICP",
    examples: "Traumatic brain injury, intracranial hemorrhage, herniation signs",
    vent: { vtPerKg: 7, rate: 16, peep: 5, fio2: 100, ie: 2, spo2: "≥ 94%", etco2: "35–40 mmHg (PaCO₂ 35–45)" },
    mode: "APVcmv / (S)CMV+",
    goals: [
      "Avoid hypoxia (SpO₂ < 90%) and hypotension (SBP < 110 mmHg) — each doubles mortality.",
      "Normocapnia: EtCO₂ 35–40. Adjust rate first.",
      "Brief hyperventilation to EtCO₂ 30–35 ONLY for signs of herniation (blown pupil, posturing, Cushing's), as a bridge.",
      "Head of bed 30°, C-collar loose / not compressing neck veins.",
      "PEEP 5–10 is generally safe; raise PEEP if needed for oxygenation.",
    ],
    intubation: [
      "Pre-oxygenate well — a single desaturation worsens outcome.",
      "Have push-dose pressor ready; maintain SBP ≥ 110 through induction.",
      "Ketamine is acceptable in TBI.",
      "Maintain manual in-line stabilization if C-spine not cleared.",
    ],
  },
  {
    id: "shock",
    name: "Shock / hypotension / RV failure",
    examples: "Septic, hemorrhagic, cardiogenic shock; massive PE; tamponade",
    vent: { vtPerKg: 7, rate: 18, peep: 5, fio2: 100, ie: 2, spo2: "92–98%", etco2: "35–45 mmHg (avoid hypercapnia in PE / RV failure)" },
    mode: "APVcmv / (S)CMV+",
    goals: [
      "Positive pressure lowers preload — keep PEEP low (5) and mean airway pressure minimal.",
      "Avoid hypoxia and hypercapnia (both raise pulmonary vascular resistance → RV failure).",
      "Watch for auto-PEEP if rate is high.",
      "Post-intubation hypotension: fluids/blood, pressor, check for auto-PEEP and pneumothorax.",
    ],
    intubation: [
      "RESUSCITATE BEFORE YOU INTUBATE: target SBP ≥ 90 / MAP ≥ 65 before induction.",
      "Halve induction dose (ketamine 0.5–1 mg/kg). Avoid propofol / large benzodiazepine doses.",
      "Push-dose epinephrine (10 mcg/mL, 0.5–2 mL) or phenylephrine drawn up and ready.",
      "Start norepinephrine infusion before intubation if shock index ≥ 0.9 persists.",
    ],
  },
  {
    id: "rosc",
    name: "Post-cardiac arrest (ROSC)",
    examples: "Return of spontaneous circulation after cardiac arrest",
    vent: { vtPerKg: 7, rate: 12, peep: 5, fio2: 100, ie: 2, spo2: "92–98%", etco2: "35–45 mmHg" },
    mode: "APVcmv / (S)CMV+",
    goals: [
      "Avoid hyperoxia: titrate FiO₂ down to SpO₂ 92–98% as soon as reliable.",
      "Avoid hyperventilation — normocapnia (EtCO₂ 35–45).",
      "MAP ≥ 65 (ideally ≥ 80 if neuro prognosis concern); SBP ≥ 90.",
      "Rate 10–12 to start; adjust to EtCO₂.",
    ],
    intubation: [
      "Patient may not need induction agent — reduce or omit if unresponsive.",
      "Prepare for re-arrest: pads on, push-dose pressor ready.",
    ],
  },
];

// Intubation checklist — RSI steps for adult patients.
export const INTUBATION_PHASES = [
  {
    id: "assess",
    title: "1. Assess & decide",
    items: [
      "Indication: failure to oxygenate, failure to ventilate, failure to protect airway, or expected course.",
      "Difficult airway — LEMON: Look, Evaluate 3-3-2, Mallampati, Obstruction, Neck mobility.",
      "Difficult BVM — MOANS: Mask seal, Obesity/Obstruction, Age > 55, No teeth, Stiff lungs.",
      "Physiologically difficult: Hypoxia, Hypotension, metabolic Acidosis, RV failure (resuscitate first).",
      "Check allergies, succinylcholine contraindications, and code status.",
    ],
  },
  {
    id: "prepare",
    title: "2. Prepare (SOAP-ME)",
    items: [
      "Suction: rigid Yankauer on and working, placed by the right side of the head.",
      "Oxygen: NRB 15 L/min+, nasal cannula for apneic oxygenation, BVM with PEEP valve.",
      "Airway: laryngoscope / video laryngoscope (tested), ETT sizes 7.0 & 7.5 (F) or 7.5 & 8.0 (M), stylet, 10 mL syringe, bougie.",
      "Backup: supraglottic airway (i-gel size 3/4/5) and surgical cric kit (scalpel, bougie, 6.0 ETT) open/available.",
      "Positioning: ear-to-sternal-notch, face parallel to ceiling, head of bed 20–30° (ramp if obese).",
      "Monitoring: SpO₂, cardiac monitor, BP cycling every 3 min, waveform capnography ready.",
      "Medications: induction, paralytic, push-dose pressor and post-intubation sedation drawn up and labeled.",
      "Equipment: 2 working IVs/IO, Hamilton T1 powered on and pre-op check done (see Vent tab).",
      "Team brief: roles, plan A/B/C/D verbalized, SpO₂ floor (abort attempt at < 93% and reoxygenate).",
    ],
  },
  {
    id: "preox",
    title: "3. Pre-oxygenate (3+ min)",
    items: [
      "NRB at flush rate (≥ 15 L/min) + nasal cannula 15 L/min for 3 min, or 8 vital-capacity breaths.",
      "If SpO₂ < 93%: BVM with PEEP valve 5–15 cmH₂O or NIV (Hamilton NIV mode) with tight seal.",
      "Agitated / not tolerating: consider delayed sequence intubation (ketamine 1 mg/kg, then pre-oxygenate).",
      "Leave nasal cannula on at 15 L/min throughout the attempt (apneic oxygenation).",
      "Target SpO₂ ≥ 94% (ideally 100%) and EtO₂ ≥ 85% if available before induction.",
    ],
  },
  {
    id: "optimize",
    title: "4. Pre-intubation optimization",
    items: [
      "BP: SBP ≥ 90 / MAP ≥ 65 / shock index < 0.9 — fluids/blood and pressor first if not.",
      "Gastric decompression if distended (NG/OG) — reduce aspiration risk.",
      "Metabolic acidosis: record pre-intubation RR and EtCO₂ to match on the vent.",
      "Bronchospasm: nebulized bronchodilators before induction.",
    ],
  },
  {
    id: "induce",
    title: "5. Paralysis with induction",
    items: [
      "Push induction agent rapidly IV, flush.",
      "Immediately push paralytic, flush. Start RSI clock.",
      "Wait 45–60 s for full relaxation (jaw flaccid). Do not bag unless SpO₂ falling (then gentle BVM, PEEP valve, ≤ 10 breaths/min).",
    ],
  },
  {
    id: "place",
    title: "6. Placement",
    items: [
      "Insert laryngoscope, sweep tongue, visualize epiglottis then cords. Bimanual laryngoscopy if needed.",
      "Use bougie liberally. Pass ETT through cords until cuff is 1–2 cm past cords.",
      "Inflate cuff (5–10 mL), target cuff pressure 20–30 cmH₂O.",
      "Failed attempt (or SpO₂ < 93%): stop, reoxygenate with BVM/SGA, change one thing, try again. Max 2–3 attempts.",
      "Can't intubate, can't oxygenate: supraglottic airway → if fails, surgical cricothyrotomy NOW.",
    ],
  },
  {
    id: "confirm",
    title: "7. Proof of placement",
    items: [
      "Waveform capnography: sustained EtCO₂ waveform for ≥ 6 breaths (gold standard). No waveform = wrong hole.",
      "Bilateral breath sounds, absent epigastric sounds, chest rise, misting.",
      "Tube depth at teeth ~21 cm (F) / ~23 cm (M) — or 3 × tube size. Document depth.",
      "Secure tube (commercial holder). Consider c-collar / head blocks to limit movement in transport.",
      "Chest X-ray when available.",
    ],
  },
  {
    id: "post",
    title: "8. Post-intubation management",
    items: [
      "Connect to Hamilton T1 with settings from the Vent tab. Confirm EtCO₂ waveform on vent.",
      "Analgesia FIRST, then sedation, within 10–15 min — rocuronium lasts 45–70+ min (awake paralysis risk).",
      "Recheck BP — post-intubation hypotension is common. Treat with fluids/pressors.",
      "OG tube to decompress stomach. Head of bed 30°.",
      "ABG 15–30 min after vent changes when available. Reassess tube position after every move.",
    ],
  },
];

export const SUX_CONTRAINDICATIONS = [
  "Known or suspected hyperkalemia (renal failure, peaked T waves)",
  "Burns, crush injury, or denervation > 24–72 h old",
  "Neuromuscular disease (muscular dystrophy, ALS, MS, Guillain-Barré, myopathies)",
  "Prolonged immobility / critical illness > 3–5 days",
  "Personal or family history of malignant hyperthermia",
  "Known pseudocholinesterase deficiency",
];

// Hamilton T1 setup sequence. Menu labels can vary by software version and configuration.
export const HAMILTON_SETUP = [
  {
    title: "Before the patient",
    items: [
      "Plug into AC power if available; confirm internal + extra battery charge for the transport time.",
      "Connect O₂: high-pressure (wall/cylinder 2.8–6 bar) or low-pressure source — confirm source type in the device matches.",
      "Check O₂ duration with the cylinder calculator below. Bring a spare and keep a 30-minute reserve.",
      "Assemble breathing circuit: adult flow sensor at the Y-piece (proximal), HMEF, and CO₂ mainstream sensor/adapter per the operator's manual diagram.",
      "Power on → Standby. Run the Pre-op check: Tightness test, Flow sensor calibration, O₂ cell calibration (Tools/System → Tests & calib).",
      "If a test fails: check connections, replace flow sensor, re-run. Do not ventilate with a failed tightness test unless no alternative.",
    ],
  },
  {
    title: "Enter patient data",
    items: [
      "Select patient group: Adult/Ped.",
      "Enter Sex and Height (not weight) — the T1 calculates IBW and suggests Vt and rate. Compare to the values from this app.",
      "Select Quick setup if your service has configured one for this condition.",
    ],
  },
  {
    title: "Select mode",
    items: [
      "Tap Modes. Choose the recommended mode (below) and confirm.",
      "APVcmv / (S)CMV+ = pressure-controlled, volume-targeted (adaptive) — good default; delivers set Vt at the lowest pressure.",
      "(S)CMV = classic volume control (set Vt, flow pattern) — useful for obstructive disease to measure plateau.",
      "PCV+ = pressure control (set Pcontrol above PEEP).",
      "ASV = Adaptive Support Ventilation — set %MinVol (100% ≈ 0.1 L/kg/min IBW), PEEP, O₂; device picks Vt/rate.",
      "Mode names depend on the configured naming convention (e.g., APVcmv vs (S)CMV+).",
    ],
  },
  {
    title: "Set controls",
    items: [
      "Controls window: set Vt, Rate, PEEP, Oxygen, and timing (I:E or Tinsp — whichever your T1 displays).",
      "Trigger: flow trigger ~2–5 L/min (default) — raise if auto-triggering.",
      "P-ramp: ~50–100 ms adult (lower = faster pressurization; shorter for high flow demand / obstruction).",
      "ETS (for spontaneous breaths): 25% default; raise to 40–50% in COPD to end inspiration earlier.",
      "Confirm each control. Review Pinsp limit: in APV modes inspiratory pressure is limited to Pressure-high alarm − 10 cmH₂O.",
    ],
  },
  {
    title: "Set alarms",
    items: [
      "Alarms → Limits. Enter values from the table below.",
      "Pressure high (Pmax): typically 40 cmH₂O.",
      "ExpMinVol low/high, Vt high, fTotal low/high, PetCO₂ low/high, Apnea time 20 s.",
      "Once stable, the Auto function can set limits around current values — verify they make sense.",
    ],
  },
  {
    title: "Start & verify",
    items: [
      "Connect circuit to ETT (keep tube held). Press Start ventilation.",
      "Confirm: chest rise, EtCO₂ waveform on T1, measured VTE ≈ set Vt, SpO₂ trend, BP.",
      "Perform an inspiratory hold to read Pplateau (Hold / Manual-breath hold function per software). Target < 30.",
      "Driving pressure = Pplat − PEEP: target ≤ 15 cmH₂O.",
      "Check AutoPEEP in monitoring (expiratory hold), especially in asthma/COPD.",
      "Titrate FiO₂ down to the SpO₂ target. Recheck ABG / EtCO₂ after any change.",
    ],
  },
  {
    title: "During transport",
    items: [
      "O₂ enrichment key: 100% O₂ for ~2 min (before suctioning or moves).",
      "Clamp ETT before any disconnection when on high PEEP (ARDS) to avoid derecruitment.",
      "Reassess tube depth, EtCO₂ and vent alarms after every patient move.",
      "Keep the circuit below the patient's head; drain condensate away from the patient.",
    ],
  },
];

// Troubleshooting: DOPE(S) and common Hamilton alarms.
export const TROUBLESHOOT = [
  {
    title: "Sudden desaturation or crash — DOPES",
    items: [
      "Disconnect from the vent and bag with 100% O₂ (BVM with PEEP valve). If the patient improves, it's the vent/circuit.",
      "D — Displacement: tube out or in right mainstem. Check EtCO₂ waveform, depth, breath sounds.",
      "O — Obstruction: kinked tube, secretions, biting. Pass suction catheter; bite block.",
      "P — Pneumothorax: unilateral absent sounds, high pressures, hypotension → needle/finger thoracostomy.",
      "E — Equipment: O₂ source empty/disconnected, circuit leak, flow sensor, power/battery.",
      "S — Stacked breaths (auto-PEEP): disconnect, press chest, then lower rate / lengthen expiration.",
    ],
  },
  {
    title: "Pressure high alarm",
    items: [
      "Check plateau pressure: high peak with NORMAL plateau = resistance (secretions, kinks, bronchospasm, biting).",
      "High peak AND high plateau = compliance problem (pneumothorax, mainstem, ARDS, abdominal distension, auto-PEEP).",
      "In APV modes the T1 will not exceed Pmax − 10 cmH₂O, so Vt may fall short — fix the cause, don't just raise Pmax.",
    ],
  },
  {
    title: "Low ExpMinVol / low Vt",
    items: [
      "Leak: check cuff pressure, circuit connections, flow sensor.",
      "Pressure-limited: see Pressure high above.",
      "Patient fighting vent: assess pain/sedation, then trigger and settings.",
    ],
  },
  {
    title: "Hypotension after intubation",
    items: [
      "Expected from sedation + positive pressure. Fluid bolus / blood, push-dose pressor, start infusion.",
      "Rule out auto-PEEP (disconnect test), tension pneumothorax, and tube malposition.",
      "Lower PEEP if high and oxygenation allows.",
    ],
  },
  {
    title: "Patient–ventilator dyssynchrony",
    items: [
      "Rule out pain, agitation, hypoxia, full bladder — treat with analgesia then sedation.",
      "Flow-starved (scooped pressure curve): shorten P-ramp, increase Vt or switch to APV mode.",
      "Double triggering: increase Vt / Tinsp, or deepen sedation.",
      "Auto-triggering: check for leaks/condensate; increase trigger value.",
    ],
  },
  {
    title: "Oxygenation & ventilation adjustments",
    items: [
      "Low SpO₂: raise FiO₂ and/or PEEP (ARDSnet table). Check tube and pneumothorax first.",
      "High EtCO₂/PaCO₂: increase rate first (watch auto-PEEP), then Vt if Pplat < 30.",
      "Low EtCO₂/PaCO₂ (unless intentional): decrease rate.",
      "New PaCO₂ ≈ old PaCO₂ × old minute volume ÷ new minute volume.",
    ],
  },
];
