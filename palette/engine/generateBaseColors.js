import {
  generateHarmoniousPalette,
  getAllHarmonyColors
} from "./ColorTheory.js";
import { generateBackgroundsOKLCH } from "./generateBackgrounds.js";
import { DEFAULT_HEX } from "./constants.js";
function normalizeHex(input) {
  if (!input) return null;
  let v = input.trim();
  if (v.startsWith("0x")) v = v.slice(2);
  if (!v.startsWith("#")) v = `#${v}`;
  if (v.length === 4) {
    const r = v[1], g = v[2], b = v[3];
    v = `#${r}${r}${g}${g}${b}${b}`;
  }
  return /^#([0-9a-fA-F]{6})$/.test(v) ? v.toUpperCase() : null;
}
function generateBaseColors(brandColor, scheme = "analogous", opts) {
  const useHarmonized = opts?.harmonized ?? true;
  const useOKLCH = opts?.useOKLCH ?? true;
  const pureColorTheory = opts?.pureColorTheory ?? false;
  const harmonyColorIndex = opts?.harmonyColorIndex ?? 0;
  const seed = normalizeHex(brandColor) ?? DEFAULT_HEX;
  const { gray, lightBg, darkBg } = generateHarmoniousPalette(seed, scheme, {
    pureColorTheory
  });
  let accent;
  if (useHarmonized) {
    const harmonyColors = getAllHarmonyColors(seed, scheme, pureColorTheory);
    const colorIndex = Math.min(
      harmonyColorIndex,
      harmonyColors.colors.length - 1
    );
    accent = harmonyColors.colors[colorIndex]?.hex ?? seed;
  } else {
    accent = seed;
  }
  if (useOKLCH) {
    const { lightBackground, darkBackground } = generateBackgroundsOKLCH(
      seed,
      accent,
      scheme
    );
    return {
      accent,
      gray,
      lightBackground,
      darkBackground
    };
  }
  return {
    accent,
    gray,
    lightBackground: lightBg,
    darkBackground: darkBg
  };
}
export {
  generateBaseColors
};
