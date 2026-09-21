import { checkThemeContrast } from "./contrast.js";
// The shared consumer boundary. Tintful owns all palette and serialization logic.
import {
  generateTheme,
  serializeTheme,
  serializedArtifactText,
  getCapabilities,
  versions,
} from "tintful";
export { parseThemeTokens } from "./tokens.js";
import { parseThemeTokens } from "./tokens.js";

export const PRESETS = Object.freeze({
  shadcn: "shadcn",
  radix: "radix",
  canonical: "canonical",
});
export const FORMATS = Object.freeze({
  hex: "hex",
  rgb: "rgb-legacy",
  hsl: "hsl-legacy",
  "hsl-values": "hsl-values",
  oklab: "oklab",
  oklch: "oklch",
});
export const NEUTRAL_TINTS = Object.freeze(["none", "weak", "strong"]);
export const DEFAULT_THEME = Object.freeze({
  hex: "#4DA0FF",
  preset: "shadcn",
  format: "hsl-values",
  neutralTint: "strong",
});
export const DEFAULT_CUSTOM_THEME = Object.freeze({
  ...DEFAULT_THEME,
  neutralTint: "weak",
});
const combinations = getCapabilities().combinations;

export function supportedFormats(preset) {
  return Object.keys(FORMATS).filter((format) =>
    combinations.some(
      (row) =>
        row.supported &&
        row.adapterId === preset &&
        row.adapterProfile === "strict" &&
        row.container === "css" &&
        row.profiles.some(
          (profile) =>
            profile.colorSyntax === FORMATS[format] &&
            profile.targetGamut === "srgb",
        ),
    ),
  );
}
export function isValidHex(hex) {
  return (
    typeof hex === "string" && /^#?(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex.trim())
  );
}
export function normalizeHex(hex) {
  if (!isValidHex(hex))
    throw new Error(
      `Invalid HEX color: "${String(hex)}" (expected 3 or 6 hexadecimal digits)`,
    );
  const value = hex.trim().replace(/^#/, "").toUpperCase();
  return `#${value.length === 3 ? [...value].map((c) => c + c).join("") : value}`;
}
export function normalizeOptions(options) {
  for (const key of [
    "scheme",
    "darkHex",
    "overrides",
    "darkOverrides",
    "append",
  ]) {
    if (Object.hasOwn(options, key))
      throw new Error(
        `The "${key}" option is not supported by the native Tintful contract. Keep consumer styles separate from audited theme.css.`,
      );
  }
  const result = {
    ...DEFAULT_CUSTOM_THEME,
    ...options,
    hex: normalizeHex(options.hex),
  };
  if (!Object.hasOwn(PRESETS, result.preset))
    throw new Error(
      `Unknown preset "${result.preset}". Choose ${Object.keys(PRESETS).join(" | ")}; css-variables was replaced by canonical with native Tintful tokens.`,
    );
  if (!Object.hasOwn(FORMATS, result.format))
    throw new Error(
      `Unknown format "${result.format}". Choose ${Object.keys(FORMATS).join(" | ")}.`,
    );
  if (!NEUTRAL_TINTS.includes(result.neutralTint))
    throw new Error(
      `Unknown neutral tint "${result.neutralTint}". Choose none | weak | strong. The former subtle setting is not a compatibility alias.`,
    );
  if (!supportedFormats(result.preset).includes(result.format))
    throw new Error(
      `${result.preset} does not support ${result.format}. Explicitly choose --format ${supportedFormats(result.preset).join(" | ")}.`,
    );
  return result;
}
export function requireQuality(result, stage, options) {
  if (
    result.ok &&
    result.qualityStatus === "pass" &&
    (!result.artifacts ||
      result.artifacts.every((a) => a.qualityStatus === "pass"))
  )
    return;
  const diagnostics = result.errors ?? result.diagnostics ?? [];
  const detail = diagnostics
    .map((d) => `${d.code ?? "quality"}: ${d.message ?? JSON.stringify(d)}`)
    .join("\n");
  const error = new Error(
    `Tintful ${stage} rejected ${options.hex} (${options.preset}/${options.format}/${options.neutralTint}): ${result.ok ? `qualityStatus=${result.qualityStatus}` : "operation failed"}. No files emitted. Choose another seed or explicitly select another supported format.\n${detail}`,
  );
  error.diagnostics = diagnostics;
  throw error;
}
function serialize(theme, options) {
  const result = serializeTheme(theme, {
    adapter: { id: options.preset, profile: "strict", version: "1" },
    container: "css",
    output: { colorSyntax: FORMATS[options.format], targetGamut: "srgb" },
    includeAudit: "sidecar",
    options: {
      css: {
        systemPreference: "media",
        manualOverride: "data-attribute",
        ...(options.preset === "shadcn" ? { tailwindBridge: "omit" } : {}),
      },
    },
  });
  requireQuality(result, "export", options);
  const css = serializedArtifactText(result.artifacts.find(a => a.fileName === "theme.css"));
  const failures = checkThemeContrast(css, options);
  if (failures.length) {
    const error = new Error(`Consumer contrast rejected ${options.hex} (${options.preset}/${options.format}/${options.neutralTint}). No files emitted. The original Tintful output missed a required consumer contrast target; choose another seed or format.\n${failures.join("\n")}`);
    error.diagnostics = failures;
    throw error;
  }
  return result;
}
function generate(options) {
  const result = generateTheme({
    schemaVersion: versions.schema,
    profiles: versions,
    primary: { value: options.hex },
    neutral: { kind: "derived", hue: options.neutralTint },
  });
  requireQuality(result, "generation", options);
  return result.theme;
}
function delivery(result, options) {
  const artifacts = result.artifacts.map((artifact) => ({
    id: artifact.id,
    fileName: artifact.fileName,
    mediaType: artifact.mediaType,
    sha256: artifact.sha256,
    auditSidecarId: artifact.auditSidecarId,
    qualityStatus: artifact.qualityStatus,
    text: serializedArtifactText(artifact),
  }));
  return {
    options,
    css: artifacts.find((a) => a.fileName === "theme.css").text,
    artifacts,
    manifest: result.reproducibility,
    qualityStatus: result.qualityStatus,
  };
}
export function generateThemeArtifacts(input) {
  const options = normalizeOptions(input);
  return delivery(serialize(generate(options), options), options);
}
export function generateThemeCss(options) {
  return generateThemeArtifacts(options).css;
}
// Preview ramps come from a separate native canonical export, not invented shadcn tokens.
export function generateThemePreview(input) {
  const options = normalizeOptions(input);
  const theme = generate(options);
  const output = delivery(serialize(theme, options), options);
  const canonical =
    options.preset === "canonical"
      ? output
      : delivery(serialize(theme, { ...options, preset: "canonical" }), {
          ...options,
          preset: "canonical",
        });
  return {
    ...output,
    ...parseThemeTokens(output.css),
    ramps: parseThemeTokens(canonical.css),
  };
}
export function usageIdioms(format) {
  return format === "hsl-values"
    ? { idiom: "hsl(var(--token))", alphaIdiom: "hsl(var(--token) / 0.75)" }
    : {
        idiom: "var(--token)",
        alphaIdiom: "color-mix(in srgb, var(--token) 75%, transparent)",
      };
}
const ROLE_TOKENS = {
  shadcn: {
    background: "background",
    foreground: "foreground",
    muted: "muted",
    accentSolid: "primary",
    accentSoft: "accent",
    line: "border",
  },
  radix: {
    background: "color-background",
    foreground: "gray-12",
    muted: "gray-2",
    accentSolid: "accent-9",
    accentSoft: "accent-3",
    line: "gray-6",
  },
  canonical: {
    background: "cpe-canvas",
    foreground: "cpe-canvas-foreground",
    muted: "cpe-surface",
    accentSolid: "cpe-action-primary-solid",
    accentSoft: "cpe-interaction-hover",
    line: "cpe-border-decorative",
  },
};
export function tokenRoles(preset, format) {
  return Object.fromEntries(
    Object.entries(ROLE_TOKENS[preset]).map(([role, token]) => [
      role,
      {
        name: `--${token}`,
        expr:
          format === "hsl-values" ? `hsl(var(--${token}))` : `var(--${token})`,
      },
    ]),
  );
}
export function documentStyles(options) {
  const roles = tokenRoles(options.preset, options.format);
  return `/* Consumer styling, separate from Tintful's audited artifacts. */\nbody { background: ${roles.background.expr}; color: ${roles.foreground.expr}; }\nhr { border-top-color: ${roles.line.expr}; }\n`;
}

export { PREDEFINED_COLOURS } from "./seeds.js";
