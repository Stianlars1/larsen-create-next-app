import Color from "colorjs.io";
import { hexToRGB } from "./color-utils.js";
import { getBestForeground, getContrastRatio } from "./contrast-utils.js";
function generateExportCode(data, options) {
  switch (options.preset) {
    case "shadcn":
      return generateShadcnCSS(data, options.format);
    case "css-variables":
      return generateCSSVariables(data, options.format);
    case "radix":
      return generateRadixCSS(data, options.format);
    case "tailwind":
      return generateTailwindConfig(data, options.format);
    case "css-in-js":
      return generateCSSInJS(data, options.format);
    case "scss":
      return generateSCSS(data, options.format);
    case "material-ui":
      return generateMaterialUI(data, options.format);
    case "chakra-ui":
      return generateChakraUI(data, options.format);
    default:
      return generateShadcnCSS(data, options.format);
  }
}
function alphaFromHex(color) {
  const clean = color.trim().replace(/^#/, "");
  if (clean.length !== 8) return undefined;
  return Number((parseInt(clean.slice(6, 8), 16) / 255).toFixed(4));
}
function preciseHSL(color) {
  const [rawHue, rawSaturation, rawLightness] = new Color(color).to("hsl").coords;
  const round = (value) => Number(value.toFixed(4));
  return {
    h: Number.isFinite(rawHue) ? round(rawHue) : 0,
    s: round(rawSaturation),
    l: round(rawLightness)
  };
}
function formatColor(color, format) {
  const isHex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color);
  const parsed = isHex ? undefined : new Color(color);
  const hex = parsed
    ? parsed.to("srgb").toString({ format: "hex", collapse: false })
    : color;
  const alpha = parsed && parsed.alpha < 1
    ? Number(parsed.alpha.toFixed(4))
    : alphaFromHex(hex);
  switch (format) {
    case "HSL_VALUES": {
      const hsl = preciseHSL(hex);
      return `${hsl.h} ${hsl.s}% ${hsl.l}%${alpha === undefined ? "" : ` / ${alpha}`}`;
    }
    case "HSL": {
      const hsl = preciseHSL(hex);
      return alpha === undefined
        ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
        : `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`;
    }
    case "RGB": {
      const rgb = hexToRGB(hex);
      return alpha === undefined
        ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
        : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }
    // Local fix (not in upstream rampkit): OKLAB/OKLCH were listed but fell
    // through to HEX. Serialized via colorjs.io, which is already a dependency.
    case "OKLAB": {
      return new Color(color).to("oklab").toString({ precision: 4 });
    }
    case "OKLCH": {
      return new Color(color).to("oklch").toString({ precision: 4 });
    }
    case "HEX":
    default:
      return hex;
  }
}
function formatSemanticColorSet(name, colorSet, format, indent = "  ") {
  const formatFn = (hex) => formatColor(hex, format);
  return [
    `${indent}--${name}: ${formatFn(colorSet.base)};`,
    `${indent}--${name}-foreground: ${formatFn(colorSet.foreground)};`,
    `${indent}--${name}-muted: ${formatFn(colorSet.muted)};`,
    `${indent}--${name}-muted-foreground: ${formatFn(colorSet.mutedForeground)};`,
    `${indent}--${name}-border: ${formatFn(colorSet.border)};`
  ].join("\n");
}
function closestContrastSafeColor(preferred, background, accentScale, grayScale, minimum) {
  if (getContrastRatio(preferred, background) >= minimum) return preferred;

  const preferredColor = new Color(preferred);
  const candidates = accentScale
    .filter((color) => getContrastRatio(color, background) >= minimum)
    .map((color) => ({ color, distance: preferredColor.deltaEOK(new Color(color)) }))
    .sort((a, b) => a.distance - b.distance);

  return candidates[0]?.color
    ?? getBestForeground(background, accentScale, grayScale, minimum).color;
}
/**
 * The closest gray to `preferred` that clears `minimum` against every surface
 * the token can sit on. Used for --input, whose border is the only thing that
 * identifies a text field, select or outline button, so WCAG 2.1 SC 1.4.11
 * applies to it. --border stays where it is: cards and separators are not
 * user interface components and the same floor would give every card a heavy
 * outline.
 */
function closestNeutralOverSurfaces(preferred, surfaces, grayScale, minimum) {
  const worst = (color) => Math.min(...surfaces.map((surface) => getContrastRatio(color, surface)));
  if (worst(preferred) >= minimum) return preferred;

  const preferredColor = new Color(preferred);
  const candidates = grayScale
    .filter((color) => worst(color) >= minimum)
    .map((color) => ({ color, distance: preferredColor.deltaEOK(new Color(color)) }))
    .sort((a, b) => a.distance - b.distance);

  return candidates[0]?.color ?? preferred;
}
/**
 * Keeps the preferred gray when it already passes, otherwise finds the first
 * displayable sRGB color on the OKLAB path toward the fallback that reaches
 * the text contrast floor. This preserves gray-10's deliberately subtle role
 * instead of replacing it wholesale with gray-11.
 */
function minimallyCorrectedNeutral(preferred, fallback, background, minimum) {
  if (getContrastRatio(preferred, background) >= minimum) return preferred;
  if (getContrastRatio(fallback, background) < minimum) return fallback;

  const preferredColor = new Color(preferred);
  const fallbackColor = new Color(fallback);
  let failingAmount = 0;
  let passingAmount = 1;
  let passingColor = fallback;

  // Twenty-four rounds isolate the passing 8-bit sRGB boundary far beyond the
  // emitted format's quantization resolution while keeping it deterministic.
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const amount = (failingAmount + passingAmount) / 2;
    const candidate = preferredColor
      .mix(fallbackColor, amount, { space: "oklab" })
      .to("srgb")
      .toString({ format: "hex", collapse: false });

    if (getContrastRatio(candidate, background) >= minimum) {
      passingAmount = amount;
      passingColor = candidate;
    } else {
      failingAmount = amount;
    }
  }

  return passingColor;
}
function generateShadcnCSS(data, format) {
  const formatFn = (hex) => formatColor(hex, format);
  // Light mode paints card and popover with the page background; dark mode
  // lifts them to gray-2 and gray-3, which is the harder surface to clear.
  const lightInput = closestNeutralOverSurfaces(
    data.grayScale.light[6],
    [data.lightBackground],
    data.grayScale.light,
    3
  );
  const darkInput = closestNeutralOverSurfaces(
    data.grayScale.dark[6],
    [data.darkBackground, data.grayScale.dark[1], data.grayScale.dark[2]],
    data.grayScale.dark,
    3
  );
  const lightForegroundSubtle = minimallyCorrectedNeutral(
    data.grayScale.light[9],
    data.grayScale.light[10],
    data.lightBackground,
    4.5
  );
  const darkForegroundSubtle = minimallyCorrectedNeutral(
    data.grayScale.dark[9],
    data.grayScale.dark[10],
    data.darkBackground,
    4.5
  );
  const lightPrimary = closestContrastSafeColor(
    data.accent,
    data.lightBackground,
    data.accentScale.light,
    data.grayScale.light,
    1.5
  );
  const lightRing = closestContrastSafeColor(
    data.accent,
    data.lightBackground,
    data.accentScale.light,
    data.grayScale.light,
    3
  );
  const darkPrimary = closestContrastSafeColor(
    data.accent,
    data.darkBackground,
    data.accentScale.dark,
    data.grayScale.dark,
    1.5
  );
  const darkRing = closestContrastSafeColor(
    data.accent,
    data.darkBackground,
    data.accentScale.dark,
    data.grayScale.dark,
    3
  );
  const lightForeground = getBestForeground(
    data.lightBackground,
    data.grayScale.light,
    data.grayScale.light
  );
  const lightPrimaryForeground = getBestForeground(
    lightPrimary,
    data.accentScale.light,
    data.grayScale.light
  );
  const lightSecondaryForeground = getBestForeground(
    data.accentScale.light[2],
    data.accentScale.light,
    data.grayScale.light
  );
  const lightMutedForeground = getBestForeground(
    data.grayScale.light[2],
    data.grayScale.light,
    data.grayScale.light
  );
  const lightAccentForeground = getBestForeground(
    data.accentScale.light[2],
    data.accentScale.light,
    data.grayScale.light
  );
  const darkForeground = getBestForeground(
    data.darkBackground,
    data.grayScale.dark,
    data.grayScale.dark
  );
  const darkPrimaryForeground = getBestForeground(
    darkPrimary,
    data.accentScale.dark,
    data.grayScale.dark
  );
  const darkSecondaryForeground = getBestForeground(
    data.accentScale.dark[2],
    data.accentScale.dark,
    data.grayScale.dark
  );
  const darkMutedForeground = getBestForeground(
    data.grayScale.dark[2],
    data.grayScale.dark,
    data.grayScale.dark
  );
  const darkAccentForeground = getBestForeground(
    data.accentScale.dark[2],
    data.accentScale.dark,
    data.grayScale.dark
  );
  const lightAnalogousForeground = getBestForeground(
    data.analogous.accentScale.light[8],
    data.analogous.accentScale.light,
    data.grayScale.light
  );
  const lightComplementaryForeground = getBestForeground(
    data.complementary.accentScale.light[8],
    data.complementary.accentScale.light,
    data.grayScale.light
  );
  const darkAnalogousForeground = getBestForeground(
    data.analogous.accentScale.dark[8],
    data.analogous.accentScale.dark,
    data.grayScale.dark
  );
  const darkComplementaryForeground = getBestForeground(
    data.complementary.accentScale.dark[8],
    data.complementary.accentScale.dark,
    data.grayScale.dark
  );
  return `:root {
  --background: ${formatFn(data.lightBackground)};
  --foreground: ${formatFn(lightForeground.color)};
  --foreground-subtle: ${formatFn(lightForegroundSubtle)};
  --card: ${formatFn(data.lightBackground)};
  --card-foreground: ${formatFn(lightForeground.color)};
  --popover: ${formatFn(data.lightBackground)};
  --popover-foreground: ${formatFn(lightForeground.color)};
  --primary: ${formatFn(lightPrimary)};
  --primary-foreground: ${formatFn(lightPrimaryForeground.color)};
  --secondary: ${formatFn(data.accentScale.light[2])};
  --secondary-foreground: ${formatFn(lightSecondaryForeground.color)};
  --muted: ${formatFn(data.grayScale.light[2])};
  --muted-foreground: ${formatFn(lightMutedForeground.color)};
  --accent: ${formatFn(data.accentScale.light[2])};
  --accent-foreground: ${formatFn(lightAccentForeground.color)};
  --destructive: ${formatFn(data.semantic.light.danger.base)};
  --destructive-foreground: ${formatFn(data.semantic.light.danger.foreground)};
  --border: ${formatFn(data.grayScale.light[6])};
  --input: ${formatFn(lightInput)};
  --ring: ${formatFn(lightRing)};
  --chart-1: ${formatFn(data.accentScale.light[8])};
  --chart-2: ${formatFn(data.analogous.accentScale.light[8])};
  --chart-3: ${formatFn(data.complementary.accentScale.light[8])};
  --chart-4: ${formatFn(data.semantic.light.warning.base)};
  --chart-5: ${formatFn(data.semantic.light.success.base)};
  --radius: var(--radius-md);
  --sidebar: ${formatFn(data.lightBackground)};
  --sidebar-foreground: ${formatFn(lightForeground.color)};
  --sidebar-primary: ${formatFn(lightPrimary)};
  --sidebar-primary-foreground: ${formatFn(lightPrimaryForeground.color)};
  --sidebar-accent: ${formatFn(data.accentScale.light[2])};
  --sidebar-accent-foreground: ${formatFn(lightAccentForeground.color)};
  --sidebar-border: ${formatFn(data.grayScale.light[6])};
  --sidebar-ring: ${formatFn(lightRing)};
  --analogous: ${formatFn(data.analogous.accentScale.light[8])};
  --analogous-foreground: ${formatFn(lightAnalogousForeground.color)};
  --complementary: ${formatFn(data.complementary.accentScale.light[8])};
  --complementary-foreground: ${formatFn(lightComplementaryForeground.color)};

  /* Accent Scale - Light */
${data.accentScale.light.map((color, i) => `  --accent-${i + 1}: ${formatFn(color)};`).join("\n")}

  /* Gray Scale - Light */
${data.grayScale.light.map((color, i) => `  --gray-${i + 1}: ${formatFn(color)};`).join("\n")}

  /* Semantic Colors - Light */
${formatSemanticColorSet("success", data.semantic.light.success, format)}
${formatSemanticColorSet("danger", data.semantic.light.danger, format)}
${formatSemanticColorSet("warning", data.semantic.light.warning, format)}
${formatSemanticColorSet("info", data.semantic.light.info, format)}
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: ${formatFn(data.darkBackground)};
    --foreground: ${formatFn(darkForeground.color)};
    --foreground-subtle: ${formatFn(darkForegroundSubtle)};
    --card: ${formatFn(data.grayScale.dark[1])};
    --card-foreground: ${formatFn(darkForeground.color)};
    --popover: ${formatFn(data.grayScale.dark[2])};
    --popover-foreground: ${formatFn(darkForeground.color)};
    --primary: ${formatFn(darkPrimary)};
    --primary-foreground: ${formatFn(darkPrimaryForeground.color)};
    --secondary: ${formatFn(data.accentScale.dark[2])};
    --secondary-foreground: ${formatFn(darkSecondaryForeground.color)};
    --muted: ${formatFn(data.grayScale.dark[2])};
    --muted-foreground: ${formatFn(darkMutedForeground.color)};
    --accent: ${formatFn(data.accentScale.dark[2])};
    --accent-foreground: ${formatFn(darkAccentForeground.color)};
    --destructive: ${formatFn(data.semantic.dark.danger.base)};
    --destructive-foreground: ${formatFn(data.semantic.dark.danger.foreground)};
    --border: ${formatFn(data.grayScale.dark[6])};
    --input: ${formatFn(darkInput)};
    --ring: ${formatFn(darkRing)};
    --chart-1: ${formatFn(data.accentScale.dark[8])};
    --chart-2: ${formatFn(data.analogous.accentScale.dark[8])};
    --chart-3: ${formatFn(data.complementary.accentScale.dark[8])};
    --chart-4: ${formatFn(data.semantic.dark.warning.base)};
    --chart-5: ${formatFn(data.semantic.dark.success.base)};
    --sidebar: ${formatFn(data.grayScale.dark[1])};
    --sidebar-foreground: ${formatFn(darkForeground.color)};
    --sidebar-primary: ${formatFn(darkPrimary)};
    --sidebar-primary-foreground: ${formatFn(darkPrimaryForeground.color)};
    --sidebar-accent: ${formatFn(data.accentScale.dark[2])};
    --sidebar-accent-foreground: ${formatFn(darkAccentForeground.color)};
    --sidebar-border: ${formatFn(data.grayScale.dark[6])};
    --sidebar-ring: ${formatFn(darkRing)};
    --analogous: ${formatFn(data.analogous.accentScale.dark[8])};
    --analogous-foreground: ${formatFn(darkAnalogousForeground.color)};
    --complementary: ${formatFn(data.complementary.accentScale.dark[8])};
    --complementary-foreground: ${formatFn(darkComplementaryForeground.color)};

    /* Accent Scale - Dark */
${data.accentScale.dark.map((color, i) => `    --accent-${i + 1}: ${formatFn(color)};`).join("\n")}

    /* Gray Scale - Dark */
${data.grayScale.dark.map((color, i) => `    --gray-${i + 1}: ${formatFn(color)};`).join("\n")}

    /* Semantic Colors - Dark */
${formatSemanticColorSet("success", data.semantic.dark.success, format, "    ")}
${formatSemanticColorSet("danger", data.semantic.dark.danger, format, "    ")}
${formatSemanticColorSet("warning", data.semantic.dark.warning, format, "    ")}
${formatSemanticColorSet("info", data.semantic.dark.info, format, "    ")}
  }
}`;
}
function generateCSSVariables(data, format) {
  const formatFn = (hex) => formatColor(hex, format);
  const lightForeground = getBestForeground(
    data.lightBackground,
    data.grayScale.light,
    data.grayScale.light
  );
  const darkForeground = getBestForeground(
    data.darkBackground,
    data.grayScale.dark,
    data.grayScale.dark
  );
  const lightAnalogousForeground = getBestForeground(
    data.analogous.accentScale.light[8],
    data.analogous.accentScale.light,
    data.grayScale.light
  );
  const darkAnalogousForeground = getBestForeground(
    data.analogous.accentScale.dark[8],
    data.analogous.accentScale.dark,
    data.grayScale.dark
  );
  const lightComplementaryForeground = getBestForeground(
    data.complementary.accentScale.light[8],
    data.complementary.accentScale.light,
    data.grayScale.light
  );
  const darkComplementaryForeground = getBestForeground(
    data.complementary.accentScale.dark[8],
    data.complementary.accentScale.dark,
    data.grayScale.dark
  );
  return `:root {
  /* Base */
  --background: ${formatFn(data.lightBackground)};
  --foreground: ${formatFn(lightForeground.color)};

  /* Accent Colors */
${data.accentScale.light.map((color, i) => `  --accent-${i + 1}: ${formatFn(color)};`).join("\n")}

  /* Gray Colors */
${data.grayScale.light.map((color, i) => `  --gray-${i + 1}: ${formatFn(color)};`).join("\n")}

  /* Analogous Harmony */
  --analogous: ${formatFn(data.analogous.accentScale.light[8])};
  --analogous-foreground: ${formatFn(lightAnalogousForeground.color)};

  /* Complementary Harmony */
  --complementary: ${formatFn(data.complementary.accentScale.light[8])};
  --complementary-foreground: ${formatFn(lightComplementaryForeground.color)};

  /* Semantic Colors */
${formatSemanticColorSet("success", data.semantic.light.success, format)}
${formatSemanticColorSet("danger", data.semantic.light.danger, format)}
${formatSemanticColorSet("warning", data.semantic.light.warning, format)}
${formatSemanticColorSet("info", data.semantic.light.info, format)}
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Base */
    --background: ${formatFn(data.darkBackground)};
    --foreground: ${formatFn(darkForeground.color)};

    /* Accent Colors - Dark */
${data.accentScale.dark.map((color, i) => `    --accent-${i + 1}: ${formatFn(color)};`).join("\n")}

    /* Gray Colors - Dark */
${data.grayScale.dark.map((color, i) => `    --gray-${i + 1}: ${formatFn(color)};`).join("\n")}

    /* Analogous Harmony - Dark */
    --analogous: ${formatFn(data.analogous.accentScale.dark[8])};
    --analogous-foreground: ${formatFn(darkAnalogousForeground.color)};

    /* Complementary Harmony - Dark */
    --complementary: ${formatFn(data.complementary.accentScale.dark[8])};
    --complementary-foreground: ${formatFn(darkComplementaryForeground.color)};

    /* Semantic Colors - Dark */
${formatSemanticColorSet("success", data.semantic.dark.success, format, "    ")}
${formatSemanticColorSet("danger", data.semantic.dark.danger, format, "    ")}
${formatSemanticColorSet("warning", data.semantic.dark.warning, format, "    ")}
${formatSemanticColorSet("info", data.semantic.dark.info, format, "    ")}
  }
}`;
}
function formatRadixMode(data, mode, format, indent) {
  const formatFn = (color) => formatColor(color, format);
  const isLight = mode === "light";
  const radix = isLight ? data.radixOriginalLight : data.radixOriginalDark;
  const background = isLight ? data.lightBackground : data.darkBackground;
  const grayScale = data.grayScale[mode];
  const analogousScale = data.analogous.accentScale[mode];
  const complementaryScale = data.complementary.accentScale[mode];
  const foreground = getBestForeground(background, grayScale, grayScale);
  const grayContrast = getBestForeground(radix.grayScale[8], radix.grayScale, radix.grayScale);
  const accentContrast = getContrastRatio(radix.accentContrast, radix.accentScale[8]) >= 4.5
    ? radix.accentContrast
    : getBestForeground(radix.accentScale[8], radix.accentScale, radix.grayScale).color;
  const analogousForeground = getBestForeground(
    analogousScale[8],
    analogousScale,
    grayScale
  );
  const complementaryForeground = getBestForeground(
    complementaryScale[8],
    complementaryScale,
    grayScale
  );
  const semantic = data.semantic[mode];

  return `${indent}/* Larsen base */
${indent}--background: ${formatFn(background)};
${indent}--foreground: ${formatFn(foreground.color)};
${indent}--color-background: ${formatFn(radix.background)};

${indent}/* Radix accent */
${radix.accentScale.map((color, i) => `${indent}--accent-${i + 1}: ${formatFn(color)};`).join("\n")}
${radix.accentScaleAlpha.map((color, i) => `${indent}--accent-a${i + 1}: ${formatFn(color)};`).join("\n")}
${indent}--accent-contrast: ${formatFn(accentContrast)};
${indent}--accent-surface: ${formatFn(radix.accentSurface)};
${indent}--accent-indicator: ${formatFn(radix.accentScale[8])};
${indent}--accent-track: ${formatFn(radix.accentScale[8])};

${indent}/* Radix gray */
${radix.grayScale.map((color, i) => `${indent}--gray-${i + 1}: ${formatFn(color)};`).join("\n")}
${radix.grayScaleAlpha.map((color, i) => `${indent}--gray-a${i + 1}: ${formatFn(color)};`).join("\n")}
${indent}--gray-contrast: ${formatFn(grayContrast.color)};
${indent}--gray-surface: ${formatFn(radix.graySurface)};
${indent}--gray-indicator: ${formatFn(radix.grayScale[8])};
${indent}--gray-track: ${formatFn(radix.grayScale[8])};

${indent}/* Larsen harmony */
${indent}--analogous: ${formatFn(analogousScale[8])};
${indent}--analogous-foreground: ${formatFn(analogousForeground.color)};
${indent}--complementary: ${formatFn(complementaryScale[8])};
${indent}--complementary-foreground: ${formatFn(complementaryForeground.color)};

${indent}/* Larsen semantic colors */
${formatSemanticColorSet("success", semantic.success, format, indent)}
${formatSemanticColorSet("danger", semantic.danger, format, indent)}
${formatSemanticColorSet("warning", semantic.warning, format, indent)}
${formatSemanticColorSet("info", semantic.info, format, indent)}`;
}
function generateRadixCSS(data, format) {
  return `:root {
${formatRadixMode(data, "light", format, "  ")}
}

@media (prefers-color-scheme: dark) {
  :root {
${formatRadixMode(data, "dark", format, "    ")}
  }
}`;
}
function generateTailwindConfig(data, format) {
  const formatFn = (hex) => formatColor(hex, format);
  const lightForeground = getBestForeground(
    data.lightBackground,
    data.grayScale.light,
    data.grayScale.light
  );
  const lightAnalogousForeground = getBestForeground(
    data.analogous.accentScale.light[8],
    data.analogous.accentScale.light,
    data.grayScale.light
  );
  const lightComplementaryForeground = getBestForeground(
    data.complementary.accentScale.light[8],
    data.complementary.accentScale.light,
    data.grayScale.light
  );
  return `module.exports = {
  theme: {
    extend: {
      colors: {
        background: '${formatFn(data.lightBackground)}',
        foreground: '${formatFn(lightForeground.color)}',
        accent: {
${data.accentScale.light.map((color, i) => `          ${i + 1}: '${formatFn(color)}',`).join("\n")}
        },
        gray: {
${data.grayScale.light.map((color, i) => `          ${i + 1}: '${formatFn(color)}',`).join("\n")}
        },
        analogous: {
          DEFAULT: '${formatFn(data.analogous.accentScale.light[8])}',
          foreground: '${formatFn(lightAnalogousForeground.color)}',
        },
        complementary: {
          DEFAULT: '${formatFn(data.complementary.accentScale.light[8])}',
          foreground: '${formatFn(lightComplementaryForeground.color)}',
        },
        success: {
          DEFAULT: '${formatFn(data.semantic.light.success.base)}',
          foreground: '${formatFn(data.semantic.light.success.foreground)}',
          muted: '${formatFn(data.semantic.light.success.muted)}',
          'muted-foreground': '${formatFn(data.semantic.light.success.mutedForeground)}',
          border: '${formatFn(data.semantic.light.success.border)}',
        },
        danger: {
          DEFAULT: '${formatFn(data.semantic.light.danger.base)}',
          foreground: '${formatFn(data.semantic.light.danger.foreground)}',
          muted: '${formatFn(data.semantic.light.danger.muted)}',
          'muted-foreground': '${formatFn(data.semantic.light.danger.mutedForeground)}',
          border: '${formatFn(data.semantic.light.danger.border)}',
        },
        warning: {
          DEFAULT: '${formatFn(data.semantic.light.warning.base)}',
          foreground: '${formatFn(data.semantic.light.warning.foreground)}',
          muted: '${formatFn(data.semantic.light.warning.muted)}',
          'muted-foreground': '${formatFn(data.semantic.light.warning.mutedForeground)}',
          border: '${formatFn(data.semantic.light.warning.border)}',
        },
        info: {
          DEFAULT: '${formatFn(data.semantic.light.info.base)}',
          foreground: '${formatFn(data.semantic.light.info.foreground)}',
          muted: '${formatFn(data.semantic.light.info.muted)}',
          'muted-foreground': '${formatFn(data.semantic.light.info.mutedForeground)}',
          border: '${formatFn(data.semantic.light.info.border)}',
        }
      }
    }
  }
}`;
}
function generateCSSInJS(data, format) {
  const formatFn = (hex) => formatColor(hex, format);
  const lightForeground = getBestForeground(
    data.lightBackground,
    data.grayScale.light,
    data.grayScale.light
  );
  const lightAnalogousForeground = getBestForeground(
    data.analogous.accentScale.light[8],
    data.analogous.accentScale.light,
    data.grayScale.light
  );
  const lightComplementaryForeground = getBestForeground(
    data.complementary.accentScale.light[8],
    data.complementary.accentScale.light,
    data.grayScale.light
  );
  return `export const colors = {
  background: '${formatFn(data.lightBackground)}',
  foreground: '${formatFn(lightForeground.color)}',
  accent: {
${data.accentScale.light.map((color, i) => `    ${i + 1}: '${formatFn(color)}',`).join("\n")}
  },
  gray: {
${data.grayScale.light.map((color, i) => `    ${i + 1}: '${formatFn(color)}',`).join("\n")}
  },
  analogous: {
    base: '${formatFn(data.analogous.accentScale.light[8])}',
    foreground: '${formatFn(lightAnalogousForeground.color)}',
  },
  complementary: {
    base: '${formatFn(data.complementary.accentScale.light[8])}',
    foreground: '${formatFn(lightComplementaryForeground.color)}',
  },
  semantic: {
    success: {
      base: '${formatFn(data.semantic.light.success.base)}',
      foreground: '${formatFn(data.semantic.light.success.foreground)}',
      muted: '${formatFn(data.semantic.light.success.muted)}',
      mutedForeground: '${formatFn(data.semantic.light.success.mutedForeground)}',
      border: '${formatFn(data.semantic.light.success.border)}',
    },
    danger: {
      base: '${formatFn(data.semantic.light.danger.base)}',
      foreground: '${formatFn(data.semantic.light.danger.foreground)}',
      muted: '${formatFn(data.semantic.light.danger.muted)}',
      mutedForeground: '${formatFn(data.semantic.light.danger.mutedForeground)}',
      border: '${formatFn(data.semantic.light.danger.border)}',
    },
    warning: {
      base: '${formatFn(data.semantic.light.warning.base)}',
      foreground: '${formatFn(data.semantic.light.warning.foreground)}',
      muted: '${formatFn(data.semantic.light.warning.muted)}',
      mutedForeground: '${formatFn(data.semantic.light.warning.mutedForeground)}',
      border: '${formatFn(data.semantic.light.warning.border)}',
    },
    info: {
      base: '${formatFn(data.semantic.light.info.base)}',
      foreground: '${formatFn(data.semantic.light.info.foreground)}',
      muted: '${formatFn(data.semantic.light.info.muted)}',
      mutedForeground: '${formatFn(data.semantic.light.info.mutedForeground)}',
      border: '${formatFn(data.semantic.light.info.border)}',
    },
  }
};`;
}
function generateSCSS(data, format) {
  const formatFn = (hex) => formatColor(hex, format);
  const lightForeground = getBestForeground(
    data.lightBackground,
    data.grayScale.light,
    data.grayScale.light
  );
  const lightAnalogousForeground = getBestForeground(
    data.analogous.accentScale.light[8],
    data.analogous.accentScale.light,
    data.grayScale.light
  );
  const lightComplementaryForeground = getBestForeground(
    data.complementary.accentScale.light[8],
    data.complementary.accentScale.light,
    data.grayScale.light
  );
  return `// Base
$background: ${formatFn(data.lightBackground)};
$foreground: ${formatFn(lightForeground.color)};

// Accent Colors
${data.accentScale.light.map((color, i) => `$accent-${i + 1}: ${formatFn(color)};`).join("\n")}

// Gray Colors
${data.grayScale.light.map((color, i) => `$gray-${i + 1}: ${formatFn(color)};`).join("\n")}

// Harmony - Analogous
$analogous: ${formatFn(data.analogous.accentScale.light[8])};
$analogous-foreground: ${formatFn(lightAnalogousForeground.color)};

// Harmony - Complementary
$complementary: ${formatFn(data.complementary.accentScale.light[8])};
$complementary-foreground: ${formatFn(lightComplementaryForeground.color)};

// Semantic Colors - Success
$success: ${formatFn(data.semantic.light.success.base)};
$success-foreground: ${formatFn(data.semantic.light.success.foreground)};
$success-muted: ${formatFn(data.semantic.light.success.muted)};
$success-muted-foreground: ${formatFn(data.semantic.light.success.mutedForeground)};
$success-border: ${formatFn(data.semantic.light.success.border)};

// Semantic Colors - Danger
$danger: ${formatFn(data.semantic.light.danger.base)};
$danger-foreground: ${formatFn(data.semantic.light.danger.foreground)};
$danger-muted: ${formatFn(data.semantic.light.danger.muted)};
$danger-muted-foreground: ${formatFn(data.semantic.light.danger.mutedForeground)};
$danger-border: ${formatFn(data.semantic.light.danger.border)};

// Semantic Colors - Warning
$warning: ${formatFn(data.semantic.light.warning.base)};
$warning-foreground: ${formatFn(data.semantic.light.warning.foreground)};
$warning-muted: ${formatFn(data.semantic.light.warning.muted)};
$warning-muted-foreground: ${formatFn(data.semantic.light.warning.mutedForeground)};
$warning-border: ${formatFn(data.semantic.light.warning.border)};

// Semantic Colors - Info
$info: ${formatFn(data.semantic.light.info.base)};
$info-foreground: ${formatFn(data.semantic.light.info.foreground)};
$info-muted: ${formatFn(data.semantic.light.info.muted)};
$info-muted-foreground: ${formatFn(data.semantic.light.info.mutedForeground)};
$info-border: ${formatFn(data.semantic.light.info.border)};`;
}
function generateMaterialUI(data, format) {
  const formatFn = (hex) => formatColor(hex, format);
  const lightForeground = getBestForeground(
    data.lightBackground,
    data.grayScale.light,
    data.grayScale.light
  );
  const lightAnalogousForeground = getBestForeground(
    data.analogous.accentScale.light[8],
    data.analogous.accentScale.light,
    data.grayScale.light
  );
  const lightComplementaryForeground = getBestForeground(
    data.complementary.accentScale.light[8],
    data.complementary.accentScale.light,
    data.grayScale.light
  );
  return `import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    background: {
      default: '${formatFn(data.lightBackground)}',
    },
    text: {
      primary: '${formatFn(lightForeground.color)}',
    },
    primary: {
      main: '${formatFn(data.accent)}',
    },
    secondary: {
      main: '${formatFn(data.analogous.accentScale.light[8])}',
      contrastText: '${formatFn(lightAnalogousForeground.color)}',
    },
    success: {
      main: '${formatFn(data.semantic.light.success.base)}',
      contrastText: '${formatFn(data.semantic.light.success.foreground)}',
    },
    error: {
      main: '${formatFn(data.semantic.light.danger.base)}',
      contrastText: '${formatFn(data.semantic.light.danger.foreground)}',
    },
    warning: {
      main: '${formatFn(data.semantic.light.warning.base)}',
      contrastText: '${formatFn(data.semantic.light.warning.foreground)}',
    },
    info: {
      main: '${formatFn(data.semantic.light.info.base)}',
      contrastText: '${formatFn(data.semantic.light.info.foreground)}',
    },
    accent: {
${data.accentScale.light.map((color, i) => `      ${i + 1}: '${formatFn(color)}',`).join("\n")}
    },
    gray: {
${data.grayScale.light.map((color, i) => `      ${i + 1}: '${formatFn(color)}',`).join("\n")}
    },
    analogous: {
      main: '${formatFn(data.analogous.accentScale.light[8])}',
      contrastText: '${formatFn(lightAnalogousForeground.color)}',
    },
    complementary: {
      main: '${formatFn(data.complementary.accentScale.light[8])}',
      contrastText: '${formatFn(lightComplementaryForeground.color)}',
    }
  }
});

export default theme;`;
}
function generateChakraUI(data, format) {
  const formatFn = (hex) => formatColor(hex, format);
  const lightForeground = getBestForeground(
    data.lightBackground,
    data.grayScale.light,
    data.grayScale.light
  );
  const lightAnalogousForeground = getBestForeground(
    data.analogous.accentScale.light[8],
    data.analogous.accentScale.light,
    data.grayScale.light
  );
  const lightComplementaryForeground = getBestForeground(
    data.complementary.accentScale.light[8],
    data.complementary.accentScale.light,
    data.grayScale.light
  );
  return `import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    background: '${formatFn(data.lightBackground)}',
    foreground: '${formatFn(lightForeground.color)}',
    accent: {
${data.accentScale.light.map((color, i) => `      ${i + 1}: '${formatFn(color)}',`).join("\n")}
    },
    gray: {
${data.grayScale.light.map((color, i) => `      ${i + 1}: '${formatFn(color)}',`).join("\n")}
    },
    analogous: {
      base: '${formatFn(data.analogous.accentScale.light[8])}',
      fg: '${formatFn(lightAnalogousForeground.color)}',
    },
    complementary: {
      base: '${formatFn(data.complementary.accentScale.light[8])}',
      fg: '${formatFn(lightComplementaryForeground.color)}',
    },
    success: {
      base: '${formatFn(data.semantic.light.success.base)}',
      fg: '${formatFn(data.semantic.light.success.foreground)}',
      muted: '${formatFn(data.semantic.light.success.muted)}',
      mutedFg: '${formatFn(data.semantic.light.success.mutedForeground)}',
      border: '${formatFn(data.semantic.light.success.border)}',
    },
    danger: {
      base: '${formatFn(data.semantic.light.danger.base)}',
      fg: '${formatFn(data.semantic.light.danger.foreground)}',
      muted: '${formatFn(data.semantic.light.danger.muted)}',
      mutedFg: '${formatFn(data.semantic.light.danger.mutedForeground)}',
      border: '${formatFn(data.semantic.light.danger.border)}',
    },
    warning: {
      base: '${formatFn(data.semantic.light.warning.base)}',
      fg: '${formatFn(data.semantic.light.warning.foreground)}',
      muted: '${formatFn(data.semantic.light.warning.muted)}',
      mutedFg: '${formatFn(data.semantic.light.warning.mutedForeground)}',
      border: '${formatFn(data.semantic.light.warning.border)}',
    },
    info: {
      base: '${formatFn(data.semantic.light.info.base)}',
      fg: '${formatFn(data.semantic.light.info.foreground)}',
      muted: '${formatFn(data.semantic.light.info.muted)}',
      mutedFg: '${formatFn(data.semantic.light.info.mutedForeground)}',
      border: '${formatFn(data.semantic.light.info.border)}',
    }
  }
});

export default theme;`;
}
export {
  formatColor,
  generateExportCode
};
