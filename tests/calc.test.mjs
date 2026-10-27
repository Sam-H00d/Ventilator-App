import { test } from "node:test";
import assert from "node:assert/strict";
import {
  predictedBodyWeight, inspiratoryTime, ardsnetPeepForFio2, wintersExpectedPaCO2,
  rsiDrugs, ventSettings, shockState, cylinderMinutes, o2ConsumptionLpm,
} from "../js/calc.js";
import { CONDITIONS } from "../js/data.js";

const cond = (id) => CONDITIONS.find((c) => c.id === id);
const male175 = { sex: "male", heightCm: 175, weightKg: 80 };

test("predicted body weight matches ARDSnet formula", () => {
  assert.equal(Math.round(predictedBodyWeight("male", 175)), 71); // 50 + 0.91 * 22.6
  assert.equal(Math.round(predictedBodyWeight("female", 165)), 57);
  assert.equal(predictedBodyWeight("male", null), null);
});

test("inspiratory time from rate and I:E", () => {
  assert.equal(inspiratoryTime(20, 2), 1); // 3 s cycle, 1:2
  assert.equal(inspiratoryTime(10, 4).toFixed(2), "1.20");
});

test("ARDSnet lower-PEEP table lookup", () => {
  assert.deepEqual(ardsnetPeepForFio2(1.0), { fio2: 1.0, peepLow: 18, peepHigh: 24 });
  assert.deepEqual(ardsnetPeepForFio2(0.45), { fio2: 0.4, peepLow: 5, peepHigh: 8 });
  assert.equal(ardsnetPeepForFio2(0.21).peepLow, 5);
});

test("Winter's formula", () => {
  assert.deepEqual(wintersExpectedPaCO2(10), { low: 21, mid: 23, high: 25 });
});

test("shock detection", () => {
  assert.equal(shockState({ hr: 120, sbp: 100 }).shock, true); // SI 1.2
  assert.equal(shockState({ hr: 80, sbp: 130 }).shock, false);
  assert.equal(shockState({ hr: 70, sbp: 80 }).hypotensive, true);
});

test("RSI doses — normotensive 80 kg", () => {
  const d = rsiDrugs({ ...male175, hr: 90, sbp: 130 });
  const roc = d.paralytics.find((x) => x.name === "Rocuronium");
  assert.deepEqual(roc.mg.map(Math.round), [96]);
  const sux = d.paralytics.find((x) => x.name === "Succinylcholine");
  assert.deepEqual(sux.mg, [120]);
  const ket = d.induction.find((x) => x.name === "Ketamine");
  assert.deepEqual(ket.mg, [80, 160]);
  assert.equal(d.induction.find((x) => x.name === "Propofol").avoid, false);
});

test("RSI doses — shock reduces induction and flags propofol", () => {
  const d = rsiDrugs({ ...male175, hr: 130, sbp: 80 });
  assert.equal(d.shock, true);
  assert.deepEqual(d.induction.find((x) => x.name === "Ketamine").mg, [40, 80]);
  assert.equal(d.induction.find((x) => x.name === "Propofol").avoid, true);
});

test("succinylcholine capped at 200 mg", () => {
  const d = rsiDrugs({ sex: "male", heightCm: 180, weightKg: 160 });
  assert.deepEqual(d.paralytics.find((x) => x.name === "Succinylcholine").mg, [200]);
});

test("vent settings — normal lungs", () => {
  const v = ventSettings(male175, cond("normal"));
  assert.equal(v.vt, 490); // 7 * 70.6 = 494 → 490
  assert.equal(v.rate, 16);
  assert.equal(v.peep, 5);
  assert.equal(v.pinspLimit, 30);
});

test("vent settings — ARDS uses 6 mL/kg and PEEP 10", () => {
  const v = ventSettings(male175, cond("ards"));
  assert.equal(v.vt, 420); // 6 * 70.6 = 423 → 420
  assert.equal(v.peep, 10);
  assert.ok(v.rate >= 20);
});

test("vent settings — obstructive has long expiration", () => {
  const v = ventSettings(male175, cond("obstructive"));
  assert.equal(v.ie, 4);
  assert.ok(v.ti <= 1.2);
  assert.ok(v.rate <= 12);
});

test("vent settings — metabolic acidosis matches pre-intubation rate", () => {
  const v = ventSettings({ ...male175, preRate: 32, preEtco2: 18, hco3: 8 }, cond("metabolic"));
  assert.equal(v.rate, 32);
  assert.match(v.etco2Target, /18/);
  const capped = ventSettings({ ...male175, preRate: 45 }, cond("metabolic"));
  assert.equal(capped.rate, 35);
});

test("vent settings — obesity raises PEEP", () => {
  const v = ventSettings({ sex: "female", heightCm: 160, weightKg: 130 }, cond("normal"));
  assert.ok(v.peep >= 8);
});

test("vent settings require height", () => {
  assert.equal(ventSettings({ sex: "male", weightKg: 80 }, cond("normal")), null);
});

test("O2 cylinder duration", () => {
  const use = o2ConsumptionLpm(8, 100); // 8 L/min at 100% + 1 L margin
  assert.equal(use, 9);
  assert.equal(Math.round(cylinderMinutes("E", 2000, use)), 56); // 1800 psi * 0.28 / 9
});
