# RSI → Hamilton T1 Vent Guide

An offline-capable mobile web app that walks through adult rapid sequence intubation (RSI) and then gives starting settings for the **Hamilton T1** transport ventilator based on the patient's condition.

> **Clinical reference only.** These are starting points for trained providers. Always follow local protocols, medical direction, and the Hamilton T1 operator's manual. Verify every dose and setting. Adult patients only.

## Features

- **Patient**: sex, height, weight, HR, SBP, SpO₂ and condition. Calculates predicted body weight, BMI and shock index, and flags hypotension, hypoxia and obesity.
- **Intubate**: an 8-phase RSI checklist (assess, SOAP-ME prep, pre-oxygenation, optimization, induction, placement, confirmation, post-intubation care) with condition-specific cautions. Weight-based induction, paralytic and post-intubation sedation doses, with automatic shock dosing and obesity weight bases.
- **Vent**: mode, Vt, rate, PEEP, FiO₂, I:E/Tinsp, minute volume, Pmax and alarm limits for each condition:
  - Normal lungs / airway protection
  - Hypoxemic failure / ARDS (with the ARDSnet PEEP/FiO₂ table)
  - Obstructive (asthma/COPD)
  - Severe metabolic acidosis (matches pre-intubation RR/EtCO₂, Winter's formula)
  - TBI / elevated ICP
  - Shock / RV failure
  - Post-ROSC

  It also has a step-by-step Hamilton T1 setup checklist (pre-op check, patient data, mode, controls, alarms, start and verify, transport) and an O₂ cylinder duration estimate.
- **Trouble**: DOPES, the pressure-high alarm, low minute volume, post-intubation hypotension, dyssynchrony, and how to adjust oxygenation and ventilation.
- An RSI clock, checklist progress that survives a page reload, and offline use through a service worker.

## Run

ES modules don't load from `file://`, so serve the folder over HTTP:

```sh
npm start            # python3 -m http.server 8080 → http://localhost:8080
```

To use it on a phone, host it on any static host (GitHub Pages works) and use "Add to Home Screen".

## Test

```sh
npm test
```

## Structure

- `js/calc.js`: pure calculations (PBW, LBW, drug doses, vent settings, ARDSnet table, O₂ duration)
- `js/data.js`: clinical content (conditions, checklists, Hamilton steps, troubleshooting)
- `js/app.js`: UI
- `tests/`: unit tests for the calculations
