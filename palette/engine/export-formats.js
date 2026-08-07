import Color from "colorjs.io";
import { hexToHSL, hexToRGB } from "./color-utils.js";
import { getBestForeground } from "./contrast-utils.js";
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
function formatColor(hex, format) {
  switch (format) {
    case "HSL_VALUES": {
      const hsl = hexToHSL(hex);
      return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
    }
    case "HSL": {
      const hsl = hexToHSL(hex);
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }
    case "RGB": {
      const rgb = hexToRGB(hex);
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
    // Local fix (not in upstream rampkit): OKLAB/OKLCH were listed but fell
    // through to HEX. Serialized via colorjs.io, which is already a dependency.
    case "OKLAB": {
      return new Color(hex).to("oklab").toString({ precision: 4 });
    }
    case "OKLCH": {
      return new Color(hex).to("oklch").toString({ precision: 4 });
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
function generateShadcnCSS(data, format) {
  const formatFn = (hex) => formatColor(hex, format);
  const lightForeground = getBestForeground(
    data.lightBackground,
    data.grayScale.light,
    data.grayScale.light
  );
  const lightPrimaryForeground = getBestForeground(
    data.accent,
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
    data.accent,
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
  --foreground-subtle: ${formatFn(data.grayScale.light[9])};
  --primary: ${formatFn(data.accent)};
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
  --input: ${formatFn(data.grayScale.light[6])};
  --ring: ${formatFn(data.accent)};
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
    --foreground-subtle: ${formatFn(data.grayScale.dark[9])};
    --primary: ${formatFn(data.accent)};
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
    --input: ${formatFn(data.grayScale.dark[6])};
    --ring: ${formatFn(data.accent)};
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
function generateRadixCSS(data, format) {
  return generateCSSVariables(data, format);
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
  generateExportCode
};
