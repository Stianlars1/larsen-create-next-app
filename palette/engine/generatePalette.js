import { generateBaseColors } from "./generateBaseColors.js";
import { generateRadixColors } from "./generateRadixColors.js";
import { generateSemanticColors } from "./generateSemanticColors.js";
function generatePalette({
  harmonized = false,
  hex,
  scheme = "analogous",
  semanticSeed = hex,
  pureColorTheory = false,
  harmonyColorIndex = 0
}) {
  const baseColors = generateBaseColors(hex, scheme, {
    harmonized,
    pureColorTheory,
    harmonyColorIndex
  });
  const baseColorsAnalogous = generateBaseColors(hex, "analogous", {
    harmonized: true,
    pureColorTheory
  });
  const baseColorsComplementary = generateBaseColors(hex, "complementary", {
    harmonized: true,
    pureColorTheory
  });
  const light = generateRadixColors({
    appearance: "light",
    accent: baseColors.accent,
    gray: baseColors.gray,
    background: baseColors.lightBackground
  });
  const dark = generateRadixColors({
    appearance: "dark",
    accent: baseColors.accent,
    gray: baseColors.gray,
    background: baseColors.darkBackground
  });
  const lightAnalogous = generateRadixColors({
    appearance: "light",
    accent: baseColorsAnalogous.accent,
    gray: baseColorsAnalogous.gray,
    background: baseColorsAnalogous.lightBackground
  });
  const darkAnalogous = generateRadixColors({
    appearance: "dark",
    accent: baseColorsAnalogous.accent,
    gray: baseColorsAnalogous.gray,
    background: baseColorsAnalogous.darkBackground
  });
  const lightComplementary = generateRadixColors({
    appearance: "light",
    accent: baseColorsComplementary.accent,
    gray: baseColorsComplementary.gray,
    background: baseColorsComplementary.lightBackground
  });
  const darkComplementary = generateRadixColors({
    appearance: "dark",
    accent: baseColorsComplementary.accent,
    gray: baseColorsComplementary.gray,
    background: baseColorsComplementary.darkBackground
  });
  const semanticColors = generateSemanticColors(
    semanticSeed,
    light.grayScale,
    dark.grayScale,
  );
  return {
    // Preserve original user input for reference
    brandColor: hex.toUpperCase(),
    scheme,
    harmonized,
    pureColorTheory,
    accent: baseColors.accent,
    gray: baseColors.gray,
    lightBackground: baseColors.lightBackground,
    darkBackground: baseColors.darkBackground,
    accentScale: {
      light: light.accentScale,
      dark: dark.accentScale
    },
    grayScale: {
      light: light.grayScale,
      dark: dark.grayScale
    },
    accentScaleAlpha: {
      light: light.accentScaleAlpha,
      dark: dark.accentScaleAlpha
    },
    grayScaleAlpha: {
      light: light.grayScaleAlpha,
      dark: dark.grayScaleAlpha
    },
    radixOriginalLight: light,
    radixOriginalDark: dark,
    analogous: {
      accent: baseColorsAnalogous.accent,
      gray: baseColorsAnalogous.gray,
      lightBackground: baseColorsAnalogous.lightBackground,
      darkBackground: baseColorsAnalogous.darkBackground,
      accentScale: {
        light: lightAnalogous.accentScale,
        dark: darkAnalogous.accentScale
      },
      grayScale: {
        light: lightAnalogous.grayScale,
        dark: darkAnalogous.grayScale
      },
      accentScaleAlpha: {
        light: lightAnalogous.accentScaleAlpha,
        dark: darkAnalogous.accentScaleAlpha
      },
      grayScaleAlpha: {
        light: lightAnalogous.grayScaleAlpha,
        dark: darkAnalogous.grayScaleAlpha
      },
      radixAnalogousLight: lightAnalogous,
      radixAnalogousDark: darkAnalogous
    },
    complementary: {
      accent: baseColorsComplementary.accent,
      gray: baseColorsComplementary.gray,
      lightBackground: baseColorsComplementary.lightBackground,
      darkBackground: baseColorsComplementary.darkBackground,
      accentScale: {
        light: lightComplementary.accentScale,
        dark: darkComplementary.accentScale
      },
      grayScale: {
        light: lightComplementary.grayScale,
        dark: darkComplementary.grayScale
      },
      accentScaleAlpha: {
        light: lightComplementary.accentScaleAlpha,
        dark: darkComplementary.accentScaleAlpha
      },
      grayScaleAlpha: {
        light: lightComplementary.grayScaleAlpha,
        dark: darkComplementary.grayScaleAlpha
      },
      radixComplementaryLight: lightComplementary,
      radixComplementaryDark: darkComplementary
    },
    // Add semantic colors
    semantic: semanticColors
  };
}
export {
  generatePalette
};
