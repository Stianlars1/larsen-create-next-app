import Color from "colorjs.io";
import { hexToHSL, hslToHex } from "./colorConverters.js";
function mixHues(h1, h2, weight = 0.5) {
  const diff = h2 - h1;
  const shortest = diff > 180 ? diff - 360 : diff < -180 ? diff + 360 : diff;
  return ((h1 + shortest * weight) % 360 + 360) % 360;
}
function calculateBackgroundHue(seedHue, accentHue, scheme) {
  switch (scheme) {
    case "complementary":
      return mixHues(seedHue, accentHue, 0.08);
    // Very subtle
    case "triadic":
      return mixHues(seedHue, accentHue, 0.18);
    case "analogous":
      return mixHues(seedHue, accentHue, 0.32);
    case "monochromatic":
    default:
      return seedHue;
  }
}
function getHueAdaptiveLightness(hue, baseL) {
  const h = (hue % 360 + 360) % 360;
  if (baseL > 0.5) {
    if (h >= 40 && h < 80) {
      return baseL * 0.995;
    }
    if (h >= 220 && h < 280) {
      return Math.min(baseL * 1.005, 0.99);
    }
    return baseL;
  }
  if (h >= 40 && h < 80) {
    return baseL * 0.98;
  }
  if (h >= 220 && h < 280) {
    return baseL * 1.02;
  }
  if (h >= 160 && h < 200) {
    return baseL * 0.97;
  }
  return baseL;
}
function calculateBackgroundChroma(scheme, isDark) {
  let baseChroma;
  switch (scheme) {
    case "monochromatic":
      baseChroma = isDark ? 8e-3 : 8e-3;
      break;
    case "analogous":
      baseChroma = isDark ? 6e-3 : 6e-3;
      break;
    case "complementary":
      baseChroma = isDark ? 4e-3 : 4e-3;
      break;
    case "triadic":
      baseChroma = isDark ? 5e-3 : 5e-3;
      break;
    default:
      baseChroma = isDark ? 5e-3 : 5e-3;
  }
  return baseChroma;
}
function generateBackgroundsOKLCH(seedHex, accentHex, scheme) {
  const seedHSL = hexToHSL(seedHex);
  const accentHSL = hexToHSL(accentHex);
  const isGrayscale = seedHSL.s < 6 && accentHSL.s < 6;
  const seedHue = seedHSL.s < 6 ? 210 : seedHSL.h;
  const accentHue = accentHSL.s < 6 ? 210 : accentHSL.h;
  const bgHue = calculateBackgroundHue(seedHue, accentHue, scheme);
  const chromaMultiplier = isGrayscale ? 0 : 1;
  let lightL = 0.96;
  lightL = getHueAdaptiveLightness(bgHue, lightL);
  const lightC = 0;
  const lightBgOKLCH = new Color("oklch", [lightL, lightC, bgHue]);
  if (!lightBgOKLCH.inGamut("srgb")) {
    lightBgOKLCH.toGamut({ space: "srgb", method: "css" });
  }
  const lightBackground = lightBgOKLCH.to("srgb").toString({ format: "hex" });
  let darkL = 0.172;
  darkL = getHueAdaptiveLightness(bgHue, darkL);
  const darkC = 0;
  const darkBgOKLCH = new Color("oklch", [darkL, darkC, bgHue]);
  if (!darkBgOKLCH.inGamut("srgb")) {
    darkBgOKLCH.toGamut({ space: "srgb", method: "css" });
  }
  const darkBackground = darkBgOKLCH.to("srgb").toString({ format: "hex" });
  const darkColor = new Color(darkBackground);
  const darkOKLCH = darkColor.to("oklch");
  if (darkOKLCH.coords[0] < 0.12) {
    const safeDark = new Color("oklch", [0.172, 0, 0]);
    return {
      lightBackground,
      darkBackground: safeDark.to("srgb").toString({ format: "hex" })
    };
  }
  return {
    lightBackground,
    darkBackground
  };
}
function convertHSLBackgroundsToOKLCH(lightHSL, darkHSL) {
  const lightHex = hslToHex(lightHSL);
  const darkHex = hslToHex(darkHSL);
  const lightOKLCH = new Color(lightHex).to("oklch");
  const darkOKLCH = new Color(darkHex).to("oklch");
  return {
    lightBackground: lightOKLCH.to("srgb").toString({ format: "hex" }),
    darkBackground: darkOKLCH.to("srgb").toString({ format: "hex" })
  };
}
function getAPCAContrast(foreground, background) {
  const fgColor = new Color(foreground).to("oklch");
  const bgColor = new Color(background).to("oklch");
  if (typeof fgColor.contrastAPCA === "function") {
    return Math.abs(fgColor.contrastAPCA(bgColor));
  }
  return 100;
}
function getOptimalForeground(background, colorScale, targetContrast = 75) {
  const bgColor = new Color(background).to("oklch");
  const bgLightness = bgColor.coords[0];
  if (bgLightness > 0.85) {
    for (let i = 11; i >= 0; i--) {
      const contrast = getAPCAContrast(colorScale[i], background);
      if (contrast >= targetContrast) {
        return colorScale[i];
      }
    }
    return colorScale[11];
  }
  if (bgLightness < 0.15) {
    for (let i = 0; i <= 11; i++) {
      const contrast = getAPCAContrast(colorScale[i], background);
      if (contrast >= targetContrast) {
        return colorScale[i];
      }
    }
    return colorScale[0];
  }
  let bestContrast = 0;
  let bestIndex = 0;
  for (let i = 0; i <= 11; i++) {
    const contrast = getAPCAContrast(colorScale[i], background);
    if (contrast > bestContrast) {
      bestContrast = contrast;
      bestIndex = i;
    }
  }
  return colorScale[bestIndex];
}
export {
  convertHSLBackgroundsToOKLCH,
  generateBackgroundsOKLCH,
  getAPCAContrast,
  getOptimalForeground
};
