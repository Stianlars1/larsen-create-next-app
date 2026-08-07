import { hexToRGB } from "./color-utils.js";
const WCAG_AA_NORMAL_TEXT = 4.5;
const WCAG_AA_LARGE_TEXT = 3;
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
function getBestForeground(background, accentScale, grayScale, minContrast = WCAG_AA_NORMAL_TEXT) {
  const findBestInScale = (scale, source) => {
    let bestStep = -1;
    let bestContrast = 0;
    for (let i = 0; i < scale.length; i++) {
      const contrast = getContrastRatio(background, scale[i]);
      if (contrast > bestContrast) {
        bestContrast = contrast;
        bestStep = i;
      }
    }
    if (bestContrast >= minContrast && bestStep >= 0) {
      return {
        color: scale[bestStep],
        contrast: bestContrast,
        source,
        step: bestStep
      };
    }
    return null;
  };
  const accentResult = findBestInScale(accentScale, "accent");
  if (accentResult) return accentResult;
  const grayResult = findBestInScale(grayScale, "gray");
  if (grayResult) return grayResult;
  const whiteContrast = getContrastRatio(background, "#FFFFFF");
  const blackContrast = getContrastRatio(background, "#000000");
  if (whiteContrast > blackContrast) {
    return {
      color: "#FFFFFF",
      contrast: whiteContrast,
      source: "white"
    };
  }
  return {
    color: "#000000",
    contrast: blackContrast,
    source: "black"
  };
}
function getBestForegroundStep(backgroundHex, colorScale, isSubtle = false) {
  const step0Contrast = getContrastRatio(backgroundHex, colorScale[0]);
  const step11Contrast = getContrastRatio(
    backgroundHex,
    isSubtle ? colorScale[10] : colorScale[11]
  );
  return step0Contrast > step11Contrast ? 0 : isSubtle ? 10 : 11;
}
export {
  getBestForeground,
  getBestForegroundStep,
  getContrastRatio
};
