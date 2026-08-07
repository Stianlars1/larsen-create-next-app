import {
  hexToHSL,
  hslToHex
} from "./colorConverters.js";
import { DEFAULT_HEX } from "./constants.js";
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const modHue = (h) => (h % 360 + 360) % 360;
const rotateHue = (h, delta) => modHue(h + delta);
const isNearGray = (s) => s <= 6;
const fallbackHueFromLightness = (l) => l < 50 ? 210 : 265;
const mixHues = (h1, h2, weight = 0.5) => {
  const diff = h2 - h1;
  const shortest = diff > 180 ? diff - 360 : diff < -180 ? diff + 360 : diff;
  return modHue(h1 + shortest * weight);
};
const calculateAdaptiveSaturation = (lightness, baseSaturation, isDark) => {
  if (isDark) {
    const multiplier2 = Math.pow(lightness / 100, 0.8);
    return clamp(baseSaturation * multiplier2, 1.2, 7);
  }
  const multiplier = 1 - Math.pow((lightness - 50) / 50, 2);
  return clamp(baseSaturation * multiplier, 1.8, 9);
};
const tonePreservingMap = (base, targetHue, scheme) => {
  let saturationBias = 0;
  let sMin = 32, sMax = 78;
  const lMin = 35, lMax = 65;
  switch (scheme) {
    case "complementary":
      saturationBias = -6;
      sMin = 38;
      break;
    case "triadic":
      saturationBias = 3;
      sMin = 35;
      break;
    case "analogous":
      saturationBias = -2;
      break;
    case "monochromatic":
      saturationBias = 8;
      sMax = 82;
      break;
  }
  const s = clamp(base.s + saturationBias, sMin, sMax);
  const l = clamp(base.l, lMin, lMax);
  return { h: modHue(targetHue), s, l };
};
const createTintedNeutral = (hue, scheme) => {
  const saturation = scheme === "monochromatic" ? 4 : 2.5;
  return { h: modHue(hue), s: saturation, l: 42 };
};
const getAccentHue = (baseHue, scheme) => {
  switch (scheme) {
    case "complementary":
      return rotateHue(baseHue, 180);
    case "triadic": {
      const option1 = rotateHue(baseHue, 120);
      const option2 = rotateHue(baseHue, 240);
      const isMuddy = (h) => h >= 60 && h <= 140;
      return isMuddy(option1) ? option2 : option1;
    }
    case "analogous": {
      if (baseHue >= 60 && baseHue <= 140) {
        return rotateHue(baseHue, -42);
      } else if (baseHue >= 0 && baseHue < 30) {
        return rotateHue(baseHue, baseHue < 15 ? 32 : -32);
      } else if (baseHue >= 240 && baseHue < 300) {
        return rotateHue(baseHue, 38);
      }
      return rotateHue(baseHue, 30);
    }
    case "monochromatic":
      return baseHue;
    default:
      return rotateHue(baseHue, 30);
  }
};
const createBackgrounds = (seedHue, accentHue, scheme) => {
  let bgHue = seedHue;
  switch (scheme) {
    case "complementary":
      bgHue = mixHues(seedHue, accentHue, 0.08);
      break;
    case "triadic":
      bgHue = mixHues(seedHue, accentHue, 0.18);
      break;
    case "analogous":
      bgHue = mixHues(seedHue, accentHue, 0.32);
      break;
    case "monochromatic":
    default:
      bgHue = seedHue;
      break;
  }
  const lightL = 97;
  const lightBaseSat = scheme === "monochromatic" ? 4 : 2.5;
  const lightS = calculateAdaptiveSaturation(lightL, lightBaseSat, false);
  const darkL = 6;
  const darkBaseSat = scheme === "monochromatic" ? 8 : 5;
  const darkS = calculateAdaptiveSaturation(darkL, darkBaseSat, true);
  return {
    lightBg: { h: bgHue, s: lightS, l: lightL },
    darkBg: { h: bgHue, s: darkS, l: darkL }
  };
};
function generateHarmoniousPalette(seedHex, scheme = "analogous", options = {}) {
  const { pureColorTheory = false } = options;
  let baseHSL;
  try {
    baseHSL = hexToHSL(seedHex, pureColorTheory);
    if (!baseHSL || typeof baseHSL.h !== "number" || isNaN(baseHSL.h) || typeof baseHSL.s !== "number" || isNaN(baseHSL.s) || typeof baseHSL.l !== "number" || isNaN(baseHSL.l) || baseHSL.h < 0 || baseHSL.h >= 360 || baseHSL.s < 0 || baseHSL.s > 100 || baseHSL.l < 0 || baseHSL.l > 100) {
      throw new Error("Invalid HSL values");
    }
  } catch (error) {
    console.warn(`Invalid color input "${seedHex}", using fallback`);
    const fallback = DEFAULT_HEX;
    baseHSL = hexToHSL(fallback);
  }
  const seedHue = isNearGray(baseHSL.s) ? fallbackHueFromLightness(baseHSL.l) : baseHSL.h;
  const targetHue = getAccentHue(seedHue, scheme);
  let accentHSL;
  if (pureColorTheory) {
    accentHSL = {
      h: modHue(targetHue),
      s: baseHSL.s,
      l: baseHSL.l
    };
  } else {
    accentHSL = scheme === "monochromatic" ? tonePreservingMap({ ...baseHSL, h: seedHue }, seedHue, scheme) : tonePreservingMap(baseHSL, targetHue, scheme);
  }
  const grayHSL = createTintedNeutral(seedHue, scheme);
  const { lightBg, darkBg } = createBackgrounds(seedHue, targetHue, scheme);
  try {
    return {
      accent: hslToHex(accentHSL),
      gray: hslToHex(grayHSL),
      lightBg: hslToHex(lightBg),
      darkBg: hslToHex(darkBg)
    };
  } catch (error) {
    console.error("Color conversion failed, using safe defaults");
    return {
      accent: DEFAULT_HEX,
      gray: "#6B7280",
      lightBg: "#F9FAFB",
      darkBg: "#0F0F0F"
    };
  }
}
function getAllHarmonyColors(seedHex, scheme, pureColorTheory = false) {
  const baseHSL = hexToHSL(seedHex, true);
  const seedHue = isNearGray(baseHSL.s) ? fallbackHueFromLightness(baseHSL.l) : baseHSL.h;
  const createColor = (rotation, label) => {
    const targetHue = modHue(seedHue + rotation);
    let resultHSL;
    if (pureColorTheory) {
      resultHSL = { h: targetHue, s: baseHSL.s, l: baseHSL.l };
    } else {
      resultHSL = tonePreservingMap(baseHSL, targetHue, scheme);
    }
    return {
      hex: hslToHex(resultHSL),
      rotation,
      label
    };
  };
  const isMuddy = (rotation) => {
    const hue = modHue(seedHue + rotation);
    return hue >= 60 && hue <= 140;
  };
  let colors;
  let recommendedIndex;
  switch (scheme) {
    case "complementary":
      colors = [createColor(180, "Complement")];
      recommendedIndex = 0;
      break;
    case "triadic":
      colors = [createColor(120, "Triadic 1"), createColor(240, "Triadic 2")];
      recommendedIndex = isMuddy(120) ? 1 : 0;
      break;
    case "analogous":
      colors = [
        createColor(30, "Analogous +30\xB0"),
        createColor(-30, "Analogous -30\xB0")
      ];
      recommendedIndex = isMuddy(30) ? 1 : 0;
      break;
    case "monochromatic":
      const lightnessVariations = [-15, 0, 15];
      colors = lightnessVariations.map((lDelta, i) => {
        const newL = clamp(baseHSL.l + lDelta, 15, 85);
        const resultHSL = { h: seedHue, s: baseHSL.s, l: newL };
        return {
          hex: hslToHex(resultHSL),
          rotation: 0,
          label: `Mono ${i + 1}`
        };
      });
      recommendedIndex = 1;
      break;
    default:
      colors = [createColor(30, "Default")];
      recommendedIndex = 0;
  }
  return {
    scheme,
    baseColor: seedHex.toUpperCase(),
    colors,
    recommendedIndex
  };
}
export {
  generateHarmoniousPalette,
  getAllHarmonyColors
};
