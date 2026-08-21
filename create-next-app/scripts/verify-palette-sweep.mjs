// @ts-check

import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateThemeCss } from "../../palette/index.js";
import { measureThemeContrast } from "../src/theme-contrast.mjs";

export const EXPECTED_SEED_HASH =
  "25104d5316f9bdc8804e726842b8f1950b6bc07531aa026013aff4c1669947a9";

export const EXPECTED_TINT_CORRECTION_DIFFERENCES = Object.freeze([
  Object.freeze({
    hex: "#611431",
    mode: "dark",
    token: "primary",
    subtle: "338.7805 56.1644% 28.6275%",
    strong: "339.5745 50.5376% 36.4706%",
  }),
  Object.freeze({
    hex: "#611431",
    mode: "dark",
    token: "sidebar-primary",
    subtle: "338.7805 56.1644% 28.6275%",
    strong: "339.5745 50.5376% 36.4706%",
  }),
  Object.freeze({
    hex: "#9F46B1",
    mode: "dark",
    token: "ring",
    subtle: "289.9065 43.3198% 48.4314%",
    strong: "290.1099 79.1304% 77.451%",
  }),
  Object.freeze({
    hex: "#9F46B1",
    mode: "dark",
    token: "sidebar-ring",
    subtle: "289.9065 43.3198% 48.4314%",
    strong: "290.1099 79.1304% 77.451%",
  }),
]);

const TINT_RELEVANT_ROLES = Object.freeze([
  "primary",
  "primary-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "ring",
  "sidebar-ring",
]);

const NAMED_SEEDS = Object.freeze([
  "#A1A1A1", "#973C00", "#193CB8", "#005F78", "#006045", "#8A0194",
  "#016630", "#372AAC", "#7CCF00", "#9F2D00", "#A3004C", "#6E11B0",
  "#9F0712", "#A50036", "#00598A", "#005F5A", "#5D0EC0", "#EFB100",
]);

const REGRESSION_SEEDS = Object.freeze([
  "#000000", "#010101", "#FEFEFE", "#FFFFFF",
  "#242424", "#262626", "#D9D9D9", "#DBDBDB",
  "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
  "#00FFFF", "#FF00FF", "#940203", "#790001",
]);

function hslToHex(h, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const second = chroma * (1 - Math.abs((h / 60) % 2 - 1));
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

function correctedRoleModes(css) {
  const mediaStart = css.indexOf("@media");
  const explicitLightStart = css.indexOf('[data-theme="light"]');
  const blocks = [
    ["light", css.slice(css.indexOf(":root {"), mediaStart)],
    ["dark", css.slice(mediaStart, explicitLightStart === -1 ? undefined : explicitLightStart)],
  ];
  return Object.fromEntries(blocks.map(([mode, block]) => [
    mode,
    Object.fromEntries(
      [...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)]
        .map((match) => [match[1], match[2].trim()]),
    ),
  ]));
}

export function compareTintCorrectedRoles(hex, subtleCss, strongCss) {
  const subtle = correctedRoleModes(subtleCss);
  const strong = correctedRoleModes(strongCss);
  const differences = [];
  for (const mode of ["light", "dark"]) {
    for (const token of TINT_RELEVANT_ROLES) {
      if (subtle[mode][token] === strong[mode][token]) continue;
      differences.push({
        hex,
        mode,
        token,
        subtle: subtle[mode][token],
        strong: strong[mode][token],
      });
    }
  }
  return differences;
}

export function runPaletteSweep() {
  const { all } = buildSweepSeeds();
  const seedHash = createHash("sha256").update(all.join("\n")).digest("hex");
  if (seedHash !== EXPECTED_SEED_HASH) {
    throw new Error(`contrast-sweep seed corpus changed: ${seedHash}`);
  }

  const failures = [];
  const worstByPair = new Map();
  const tintCorrectionDifferences = [];
  let themes = 0;

  for (const hex of all) {
    /** @type {Record<string, string>} */
    const cssByTint = {};
    for (const neutralTint of ["subtle", "strong"]) {
      const css = generateThemeCss({
        hex,
        preset: "shadcn",
        format: "hsl-values",
        neutralTint,
      });
      cssByTint[neutralTint] = css;
      const result = measureThemeContrast(css);
      themes += 1;
      failures.push(...result.missing.map((failure) => `${hex} ${neutralTint} ${failure}`));

      for (const measurement of result.measurements) {
        const key = `${measurement.token}|${measurement.against}`;
        const current = worstByPair.get(key);
        const record = { hex, neutralTint, ...measurement };
        if (!current || measurement.actual < current.actual) worstByPair.set(key, record);
        if (!Number.isFinite(measurement.actual) || measurement.actual < measurement.minimum) {
          failures.push(
            `${hex} ${neutralTint} ${measurement.mode} --${measurement.token} vs --${measurement.against} = ${measurement.actual} (needs ${measurement.minimum})`,
          );
        }
      }
    }
    tintCorrectionDifferences.push(
      ...compareTintCorrectedRoles(hex, cssByTint.subtle, cssByTint.strong),
    );
  }

  if (
    JSON.stringify(tintCorrectionDifferences)
    !== JSON.stringify(EXPECTED_TINT_CORRECTION_DIFFERENCES)
  ) {
    failures.push(
      `cross-tint primary/ring scope changed: ${JSON.stringify(tintCorrectionDifferences)}`,
    );
  }

  return {
    seedHash,
    seeds: all.length,
    themes,
    pairs: worstByPair.size,
    tintCorrectionDifferences,
    failures,
    worst: [...worstByPair.values()],
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = runPaletteSweep();
    console.log(
      `contrast-sweep: ${result.seeds} unique seeds x 2 neutral tints = ${result.themes} themes`,
    );
    console.log(`contrast-sweep: seed SHA-256 ${result.seedHash}`);
    console.log(`contrast-sweep: ${result.pairs} role pairs measured in both modes per theme`);
    console.log(
      `contrast-sweep: ${result.tintCorrectionDifferences.length} locked cross-tint primary/ring alias differences`,
    );
    for (const item of result.worst) {
      console.log(
        `contrast-sweep: --${item.token} vs --${item.against} >= ${item.minimum} (${item.standard}), worst ${item.actual.toFixed(6)} at ${item.hex} ${item.neutralTint} ${item.mode}`,
      );
    }
    if (result.failures.length > 0) {
      throw new Error(`contrast-sweep failed:\n${result.failures.join("\n")}`);
    }
    console.log("contrast-sweep: all checks passed");
  } catch (error) {
    console.error(/** @type {Error} */ (error).message);
    process.exit(1);
  }
}
