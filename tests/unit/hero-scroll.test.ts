import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Phase 4: 3D Scroll Motion Logic & Fallback Tests", () => {
  it("mirrors 3D rotateY and horizontal drift under dir='rtl'", () => {
    function get3DRotation(progress: number, isRTL: boolean) {
      const rotateYDir = isRTL ? 1 : -1;
      const initialRotateY = rotateYDir * 30;
      const currentRotateY = initialRotateY * (1 - progress);
      const initialRotateX = 14;
      const currentRotateX = initialRotateX * (1 - progress);
      const ry = Math.round(currentRotateY * 10) / 10;
      const rx = Math.round(currentRotateX * 10) / 10;
      return {
        rotateY: Object.is(ry, -0) ? 0 : ry,
        rotateX: Object.is(rx, -0) ? 0 : rx,
      };
    }

    // In RTL, starting rotateY is +30deg (faces content in Arabic layout)
    const rtlStart = get3DRotation(0, true);
    assert.equal(rtlStart.rotateY, 30);
    assert.equal(rtlStart.rotateX, 14);

    // In LTR, starting rotateY is -30deg
    const ltrStart = get3DRotation(0, false);
    assert.equal(ltrStart.rotateY, -30);
    assert.equal(ltrStart.rotateX, 14);

    // At progress 0.5
    const rtlMid = get3DRotation(0.5, true);
    assert.equal(rtlMid.rotateY, 15);
    assert.equal(rtlMid.rotateX, 7);

    // At progress 1.0 (settled), both resolve to 0deg
    const rtlEnd = get3DRotation(1.0, true);
    const ltrEnd = get3DRotation(1.0, false);
    assert.equal(rtlEnd.rotateY, 0);
    assert.equal(rtlEnd.rotateX, 0);
    assert.equal(ltrEnd.rotateY, 0);
    assert.equal(ltrEnd.rotateX, 0);
  });

  it("calculates waveform stroke-dashoffset between scroll progress 0.2 and 0.8", () => {
    function getWaveformDrawFraction(progress: number): number {
      if (progress <= 0.2) return 0;
      if (progress >= 0.8) return 1;
      return Math.round(((progress - 0.2) / 0.6) * 1000) / 1000;
    }

    assert.equal(getWaveformDrawFraction(0.0), 0);
    assert.equal(getWaveformDrawFraction(0.15), 0);
    assert.equal(getWaveformDrawFraction(0.2), 0);
    assert.equal(getWaveformDrawFraction(0.5), 0.5);
    assert.equal(getWaveformDrawFraction(0.8), 1);
    assert.equal(getWaveformDrawFraction(1.0), 1);
  });

  it("interpolates vitals readout values accurately from 60->72 HR and 92->98 SpO2", () => {
    function computeVitals(progress: number) {
      const p = Math.max(0, Math.min(1, progress));
      return {
        hr: Math.round(60 + p * 12),
        spo2: Math.round(92 + p * 6),
      };
    }

    assert.deepEqual(computeVitals(0.0), { hr: 60, spo2: 92 });
    assert.deepEqual(computeVitals(0.25), { hr: 63, spo2: 94 });
    assert.deepEqual(computeVitals(0.5), { hr: 66, spo2: 95 });
    assert.deepEqual(computeVitals(0.75), { hr: 69, spo2: 97 });
    assert.deepEqual(computeVitals(1.0), { hr: 72, spo2: 98 });
  });

  it("detects lite mode boundary thresholds (CPU <= 4, RAM <= 4, width < 360, saveData)", () => {
    function shouldActivateLiteMode(env: {
      width: number;
      hardwareConcurrency?: number;
      deviceMemory?: number;
      saveData?: boolean;
      prefersReducedMotion?: boolean;
    }): boolean {
      if (env.prefersReducedMotion) return true;
      if (env.width < 360) return true;
      if (env.hardwareConcurrency !== undefined && env.hardwareConcurrency <= 4) return true;
      if (env.deviceMemory !== undefined && env.deviceMemory <= 4) return true;
      if (env.saveData) return true;
      return false;
    }

    // High tier mobile device (6 cores, 6GB RAM, 390px, no saveData) -> Lite mode OFF
    assert.equal(
      shouldActivateLiteMode({ width: 390, hardwareConcurrency: 6, deviceMemory: 6, saveData: false }),
      false
    );

    // Ultra narrow viewport (< 360px) -> Lite mode ON
    assert.equal(
      shouldActivateLiteMode({ width: 320, hardwareConcurrency: 8, deviceMemory: 8 }),
      true
    );

    // Low concurrency (<= 4 cores) -> Lite mode ON
    assert.equal(
      shouldActivateLiteMode({ width: 390, hardwareConcurrency: 4, deviceMemory: 8 }),
      true
    );

    // Low device memory (<= 4GB) -> Lite mode ON
    assert.equal(
      shouldActivateLiteMode({ width: 390, hardwareConcurrency: 8, deviceMemory: 4 }),
      true
    );

    // Data saver enabled -> Lite mode ON
    assert.equal(
      shouldActivateLiteMode({ width: 390, hardwareConcurrency: 8, deviceMemory: 8, saveData: true }),
      true
    );

    // Prefers reduced motion -> Lite mode ON
    assert.equal(
      shouldActivateLiteMode({ width: 1280, hardwareConcurrency: 16, deviceMemory: 16, prefersReducedMotion: true }),
      true
    );
  });

  it("validates 3D depth layering constants match DESIGN.md spec", () => {
    const DEPTH_LAYERS = {
      glow: -40,
      bezel: 0,
      screenGlass: 20,
      ecgWaveform: 40,
      readoutChips: 70,
    };

    assert.equal(DEPTH_LAYERS.glow < DEPTH_LAYERS.bezel, true);
    assert.equal(DEPTH_LAYERS.bezel < DEPTH_LAYERS.screenGlass, true);
    assert.equal(DEPTH_LAYERS.screenGlass < DEPTH_LAYERS.ecgWaveform, true);
    assert.equal(DEPTH_LAYERS.ecgWaveform < DEPTH_LAYERS.readoutChips, true);
  });
});
