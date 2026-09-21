import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
// @ts-check

import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateThemeCss } from "../../palette/index.js";
import { measureThemeContrast } from "../src/theme-contrast.mjs";

export const EXPECTED_SEED_HASH =
  "25104d5316f9bdc8804e726842b8f1950b6bc07531aa026013aff4c1669947a9";

const NAMED_SEEDS = Object.freeze([
  "#A1A1A1",
  "#973C00",
  "#193CB8",
  "#005F78",
  "#006045",
  "#8A0194",
  "#016630",
  "#372AAC",
  "#7CCF00",
  "#9F2D00",
  "#A3004C",
  "#6E11B0",
  "#9F0712",
  "#A50036",
  "#00598A",
  "#005F5A",
  "#5D0EC0",
  "#EFB100",
]);

const REGRESSION_SEEDS = Object.freeze([
  "#000000",
  "#010101",
  "#FEFEFE",
  "#FFFFFF",
  "#242424",
  "#262626",
  "#D9D9D9",
  "#DBDBDB",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#00FFFF",
  "#FF00FF",
  "#940203",
  "#790001",
]);

function hslToHex(h, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const second = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const offset = l - chroma / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = chroma;
    g = second;
  } else if (h < 120) {
    r = second;
    g = chroma;
  } else if (h < 180) {
    g = chroma;
    b = second;
  } else if (h < 240) {
    g = second;
    b = chroma;
  } else if (h < 300) {
    r = second;
    b = chroma;
  } else {
    r = chroma;
    b = second;
  }

  const channel = (value) =>
    Math.round((value + offset) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function edgeSeeds() {
  const generated = [];
  for (const hue of [0, 45, 90, 135, 180, 225, 270, 315]) {
    for (const saturation of [5, 7, 50, 100]) {
      for (const lightness of [14, 15, 85, 86]) {
        generated.push(hslToHex(hue, saturation, lightness));
      }
    }
  }
  return [...REGRESSION_SEEDS, ...generated];
}

function randomSeeds(reserved) {
  const accepted = [];
  let state = 0x5eed0501;
  while (accepted.length < 600) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const candidate = `#${(state >>> 8).toString(16).padStart(6, "0").toUpperCase()}`;
    if (reserved.has(candidate)) continue;
    reserved.add(candidate);
    accepted.push(candidate);
  }
  return accepted;
}

export function buildSweepSeeds() {
  const named = [...NAMED_SEEDS];
  const edge = edgeSeeds();
  const reserved = new Set([...named, ...edge]);
  const random = randomSeeds(reserved);
  const all = [...named, ...random, ...edge];
  return { named, random, edge, all };
}

const BOUNDARY_REJECTIONS = {
  "#7B534B": "light --destructive-foreground vs --destructive = 4.599920 (needs 4.6)",
  "#5736FE": "light --warning-foreground vs --warning = 4.599756 (needs 4.6)",
  "#FE9762": "light --destructive-foreground vs --destructive = 4.599678 (needs 4.6)",
};
function verifySeeds(seeds) {
  const failures = [], rejected = [];
  let completed = 0, weakest = Infinity;
  for (const hex of seeds) for (const neutralTint of ["none", "weak", "strong"]) {
    try {
      const css = generateThemeCss({ hex, neutralTint });
      const measured = measureThemeContrast(css);
      failures.push(...measured.missing.map(f => `${hex}/${neutralTint}: ${f}`));
      for (const pair of measured.measurements) {
        if (!Number.isFinite(pair.actual) || pair.actual < pair.minimum) failures.push(`${hex}/${neutralTint}/${pair.mode}: ${pair.token} on ${pair.against} = ${pair.actual}, needs ${pair.minimum}`);
        if (pair.minimum === 4.6) weakest = Math.min(weakest, pair.actual);
      }
      if (BOUNDARY_REJECTIONS[hex]) failures.push(`${hex}/${neutralTint}: expected the locked consumer rejection; review engine drift`);
    } catch (error) {
      if (BOUNDARY_REJECTIONS[hex] && error.message.startsWith("Consumer contrast rejected") && JSON.stringify(error.diagnostics) === JSON.stringify([BOUNDARY_REJECTIONS[hex]])) rejected.push(`${hex}/${neutralTint}`);
      else failures.push(`${hex}/${neutralTint}: ${error.message}`);
    }
    completed++;
  }
  return { completed, weakest, failures, rejected };
}
export async function runSweep() {
  const { all } = buildSweepSeeds();
  const hash = createHash("sha256").update(all.join("\n")).digest("hex");
  if (hash !== EXPECTED_SEED_HASH) throw new Error("Seed corpus drift");
  const results = await Promise.all(Array.from({ length: 4 }, (_, shard) => new Promise((resolveResult, reject) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: all.filter((_, i) => i % 4 === shard) });
    worker.once("message", result => { console.log(`Verified shard ${shard + 1}: ${result.completed} exports`); resolveResult(result); });
    worker.once("error", reject);
    worker.once("exit", code => { if (code) reject(new Error(`Sweep worker exited ${code}`)); });
  })));
  const rejected = results.flatMap(r => r.rejected).sort();
  const failures = results.flatMap(r => r.failures);
  if (rejected.length !== 9) failures.push(`Expected 9 locked boundary rejections, got ${rejected.length}`);
  console.log(JSON.stringify({ seeds: all.length, exports: results.reduce((n,r)=>n+r.completed,0), hash, weakestTextContrast: Math.min(...results.map(r=>r.weakest)), rejected, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}
if (!isMainThread) parentPort.postMessage(verifySeeds(workerData));
else if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runSweep();
