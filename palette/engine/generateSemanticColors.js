import { generateRadixColors } from "./generateRadixColors.js";
import { hexToHSL, hslToHex } from "./colorConverters.js";
import { getBestForegroundStep } from "./contrast-utils.js";
import { hexToRGB } from "./color-utils.js";
const SEMANTIC_HUES = {
  success: 140,
  // Green
  danger: 10,
  // Red
  warning: 35,
  // Orange/Amber
  info: 215
  // Blue
};
function getLuminance(hex) {
  const { r, g, b } = hexToRGB(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const normalized = c / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}
function hueDistance(h1, h2) {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}
function calculateOptimalHue(targetHue, accentHue, minDistance = 35) {
  const distance = hueDistance(targetHue, accentHue);
  if (distance >= minDistance) {
    return targetHue;
  }
  const shift1 = (targetHue + minDistance) % 360;
  const shift2 = (targetHue - minDistance + 360) % 360;
  const dist1 = hueDistance(shift1, accentHue);
  const dist2 = hueDistance(shift2, accentHue);
  const isMuddy1 = shift1 >= 60 && shift1 <= 140;
  const isMuddy2 = shift2 >= 60 && shift2 <= 140;
  if (isMuddy1 && !isMuddy2) return shift2;
  if (isMuddy2 && !isMuddy1) return shift1;
  return dist1 > dist2 ? shift1 : shift2;
}
function avoidMuddyZone(hue, type) {
  if (hue >= 60 && hue <= 140) {
    if (type === "success") {
      return 145;
    }
    if (type === "warning") {
      return 35;
    }
  }
  return hue;
}
function generateSemanticBase(type, accentHex, accentHue) {
  const targetHue = SEMANTIC_HUES[type];
  const accentHSL = hexToHSL(accentHex);
  let optimalHue = calculateOptimalHue(targetHue, accentHue);
  optimalHue = avoidMuddyZone(optimalHue, type);
  const isGrayscale = accentHSL.s < 6;
  const isNearWhite = accentHSL.l > 95;
  const isNearBlack = accentHSL.l < 5;
  let saturation;
  if (isGrayscale || isNearWhite || isNearBlack) {
    saturation = 68;
  } else {
    saturation = Math.max(55, Math.min(75, accentHSL.s + 10));
  }
  let lightness;
  switch (type) {
    case "success":
      lightness = 52;
      break;
    case "danger":
      lightness = 48;
      break;
    case "warning":
      lightness = 50;
      break;
    case "info":
      lightness = 51;
      break;
  }
  return hslToHex({ h: optimalHue, s: saturation, l: lightness });
}
function generateSemanticColorSet(type, accentHex, grayHex, backgroundHex, appearance) {
  const accentHSL = hexToHSL(accentHex);
  const accentHue = accentHSL.s < 6 ? 210 : accentHSL.h;
  const semanticBaseHex = generateSemanticBase(type, accentHex, accentHue);
  const radixScale = generateRadixColors({
    appearance,
    accent: semanticBaseHex,
    gray: grayHex,
    background: backgroundHex
  });
  const base = radixScale.accentScale[8];
  const muted = radixScale.accentScale[2];
  const border = radixScale.accentScale[6];
  let foregroundStep = getBestForegroundStep(base, radixScale.accentScale);
  let foreground = radixScale.accentScale[foregroundStep];
  let baseForegroundContrast = getContrastRatio(base, foreground);
  if (baseForegroundContrast < 4.5) {
    foregroundStep = foregroundStep === 0 ? 11 : 0;
    foreground = radixScale.accentScale[foregroundStep];
    baseForegroundContrast = getContrastRatio(base, foreground);
    if (baseForegroundContrast < 4.5) {
      const baseLuminance = getLuminance(base);
      foreground = baseLuminance > 0.18 ? "#000000" : "#FFFFFF";
    }
  }
  let mutedForegroundStep = getBestForegroundStep(
    muted,
    radixScale.accentScale
  );
  let mutedForeground = radixScale.accentScale[mutedForegroundStep];
  let mutedContrast = getContrastRatio(muted, mutedForeground);
  if (mutedContrast < 4.5) {
    mutedForegroundStep = mutedForegroundStep === 0 ? 11 : 0;
    mutedForeground = radixScale.accentScale[mutedForegroundStep];
    mutedContrast = getContrastRatio(muted, mutedForeground);
    if (mutedContrast < 4.5) {
      const mutedLuminance = getLuminance(muted);
      mutedForeground = mutedLuminance > 0.18 ? radixScale.grayScale[11] : radixScale.grayScale[0];
    }
  }
  return {
    base,
    foreground,
    muted,
    mutedForeground,
    border
  };
}
function generateSemanticColors(accentHex, grayHex, lightBackgroundHex, darkBackgroundHex) {
  const semanticTypes = [
    "success",
    "danger",
    "warning",
    "info"
  ];
  const light = {};
  const dark = {};
  for (const type of semanticTypes) {
    light[type] = generateSemanticColorSet(
      type,
      accentHex,
      grayHex,
      lightBackgroundHex,
      "light"
    );
    dark[type] = generateSemanticColorSet(
      type,
      accentHex,
      grayHex,
      darkBackgroundHex,
      "dark"
    );
  }
  return { light, dark };
}
export {
  generateSemanticColors
};
