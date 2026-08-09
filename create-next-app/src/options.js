// @ts-check

import { parseArgs } from "node:util";
import { FORMATS, PRESETS, SCHEMES } from "../palette/index.js";

const PRESET_DISPLAY = {
  shadcn: {
    label: "shadcn/ui",
    hint: "semantic tokens + scales (recommended)",
  },
  radix: {
    label: "Radix Themes tokens",
    hint: "complete Radix Themes contract + Larsen tokens",
  },
  "css-variables": { label: "CSS Variables", hint: "accent + gray scales" },
};

const FORMAT_DISPLAY = {
  "hsl-values": {
    label: "HSL Values",
    hint: "0 0% 100% - supports hsl(var(--x) / alpha) (recommended)",
  },
  hex: { label: "HEX" },
  rgb: { label: "RGB" },
  hsl: { label: "HSL" },
  oklab: { label: "OKLAB" },
  oklch: { label: "OKLCH" },
};

/** @param {string[]} values @param {Record<string, { label?: string, hint?: string }>} display */
function choicesFrom(values, display = {}) {
  return values.map((value) => ({
    value,
    label: display[value]?.label ?? value,
    ...(display[value]?.hint ? { hint: display[value].hint } : {}),
  }));
}

/**
 * The canonical CLI option contract. Argument parsing, help output and prompt
 * defaults are derived from this data. Documentation checks can import the
 * same contract instead of maintaining another flag list.
 */
export const OPTION_CONTRACT = Object.freeze([
  {
    name: "defaults",
    type: "boolean",
    short: "d",
    description: "Skip all prompts, use defaults (no skills)",
  },
  {
    name: "default-palette",
    type: "boolean",
    promptDefault: false,
    conflicts: "hex",
    description: "Answer No to a custom palette and use the default palette",
  },
  {
    name: "hex",
    type: "string",
    valueName: "color",
    description: "Palette seed HEX - implies a custom palette",
  },
  {
    name: "preset",
    type: "string",
    valueName: "name",
    defaultValue: "shadcn",
    requires: "hex",
    choices: choicesFrom(Object.keys(PRESETS), PRESET_DISPLAY),
    description: "Palette preset",
  },
  {
    name: "format",
    type: "string",
    valueName: "name",
    defaultValue: "hsl-values",
    requires: "hex",
    choices: choicesFrom(Object.keys(FORMATS), FORMAT_DISPLAY),
    description: "Color format",
  },
  {
    name: "scheme",
    type: "string",
    valueName: "name",
    defaultValue: "analogous",
    requires: "hex",
    choices: choicesFrom(SCHEMES),
    description: "Color scheme",
  },
  {
    name: "pm",
    type: "string",
    valueName: "name",
    defaultValue: "npm",
    choices: [
      { value: "npm", label: "npm" },
      { value: "pnpm", label: "pnpm" },
      { value: "yarn", label: "yarn" },
      { value: "bun", label: "bun" },
    ],
    description: "Package manager",
  },
  {
    name: "linter",
    type: "string",
    valueName: "name",
    defaultValue: "eslint",
    choices: [
      { value: "eslint", label: "ESLint" },
      { value: "biome", label: "Biome" },
      { value: "none", label: "None" },
    ],
    description: "Linter",
  },
  {
    name: "skills",
    type: "string",
    valueName: "list",
    defaultValue: [],
    defaultContext: "--defaults",
    promptDefault: "recommended",
    conflicts: "no-skills",
    description: "Larsen Skills: recommended, all, or comma-separated names",
  },
  {
    name: "no-skills",
    type: "boolean",
    description: "Skip the Larsen Skills install",
  },
  {
    name: "git",
    type: "boolean",
    defaultValue: true,
    conflicts: "no-git",
    description: "Initialize a git repository",
  },
  {
    name: "no-git",
    type: "boolean",
    description: "Skip git init",
  },
  {
    name: "install",
    type: "boolean",
    defaultValue: true,
    conflicts: "no-install",
    description: "Install dependencies",
  },
  {
    name: "no-install",
    type: "boolean",
    description: "Skip dependency install",
  },
  {
    name: "cna-version",
    type: "string",
    valueName: "spec",
    defaultValue: "latest",
    description: "Select the create-next-app version spec",
  },
  {
    name: "version",
    type: "boolean",
    short: "v",
    description: "Print version",
  },
  {
    name: "help",
    type: "boolean",
    short: "h",
    description: "Show this help",
  },
]);

const CONTRACT_BY_NAME = new Map(OPTION_CONTRACT.map((option) => [option.name, option]));

export const PARSE_OPTIONS = Object.freeze(
  Object.fromEntries(
    OPTION_CONTRACT.map((option) => {
      const parseOption = { type: option.type };
      if (option.short) parseOption.short = option.short;
      if ("parseDefault" in option) parseOption.default = option.parseDefault;
      return [option.name, parseOption];
    }),
  ),
);

/** @param {string[]} [args] */
export function parseCliArgs(args = process.argv.slice(2)) {
  return parseArgs({ args, allowPositionals: true, options: PARSE_OPTIONS });
}

/** @param {string} name */
export function optionDefault(name) {
  return CONTRACT_BY_NAME.get(name)?.defaultValue;
}

/** @param {string} name */
export function optionChoices(name) {
  return CONTRACT_BY_NAME.get(name)?.choices ?? [];
}

/** @param {string} name */
export function optionPromptDefault(name) {
  return CONTRACT_BY_NAME.get(name)?.promptDefault;
}

function optionWasProvided(flags, name) {
  const option = CONTRACT_BY_NAME.get(name);
  return option?.type === "boolean" ? flags[name] === true : flags[name] !== undefined;
}

/** @param {Record<string, any>} flags */
function validateOptionConflicts(flags) {
  for (const option of OPTION_CONTRACT) {
    if (
      option.conflicts &&
      optionWasProvided(flags, option.name) &&
      optionWasProvided(flags, option.conflicts)
    ) {
      return `--${option.name} cannot be combined with --${option.conflicts}.`;
    }
  }
  return undefined;
}

/** @param {Record<string, any>} flags */
function validateOptionRequirements(flags) {
  for (const option of OPTION_CONTRACT) {
    if (
      option.requires &&
      optionWasProvided(flags, option.name) &&
      !optionWasProvided(flags, option.requires)
    ) {
      return `--${option.name} requires --${option.requires}.`;
    }
  }
  return undefined;
}

/**
 * Returns the first invalid relationship, or undefined when the explicitly
 * supplied options can be resolved without ignoring an answer.
 *
 * @param {Record<string, any>} flags
 */
export function validateOptionRelationships(flags) {
  return validateOptionConflicts(flags) ?? validateOptionRequirements(flags);
}

/**
 * Validates the complete parsed command line before any prompt or scaffold
 * work. Presence is checked independently from truthiness so explicit empty
 * string values cannot fall back to defaults.
 *
 * @param {Record<string, any>} flags
 * @param {string[]} positionals
 */
export function validateCliInput(flags, positionals) {
  const conflictError = validateOptionConflicts(flags);
  if (conflictError) return conflictError;

  if (positionals.length > 1) {
    return `Expected at most one app name, received ${positionals.length}.`;
  }

  for (const option of OPTION_CONTRACT) {
    if (
      option.type === "string" &&
      flags[option.name] !== undefined &&
      String(flags[option.name]).trim() === ""
    ) {
      return `--${option.name} requires a non-empty value.`;
    }
  }

  return validateOptionRequirements(flags);
}

function optionSyntax(option) {
  const value = option.valueName ? ` <${option.valueName}>` : "";
  const long = `--${option.name}${value}`;
  return option.short ? `-${option.short}, ${long}` : long;
}

function optionConflict(option) {
  return (
    option.conflicts ??
    OPTION_CONTRACT.find((candidate) => candidate.conflicts === option.name)?.name
  );
}

function formatValue(value, markdown) {
  let normalized;
  if (Array.isArray(value)) {
    normalized = value.length === 0 ? "none" : value.join(", ");
  } else if (typeof value === "boolean") {
    normalized = value ? "yes" : "no";
  } else {
    normalized = String(value);
  }
  return markdown ? `\`${normalized}\`` : normalized;
}

function optionDescription(option, { markdown = false } = {}) {
  const values = option.choices?.map((choice) => formatValue(choice.value, markdown));
  const choiceSeparator = markdown ? " \\| " : " | ";
  const sentences = [
    values?.length ? `${option.description}: ${values.join(choiceSeparator)}` : option.description,
  ];

  if (option.defaultValue !== undefined && option.defaultValue !== false) {
    const context = option.defaultContext
      ? ` with ${formatValue(option.defaultContext, markdown)}`
      : "";
    sentences.push(`Default${context}: ${formatValue(option.defaultValue, markdown)}`);
  }
  if (option.promptDefault !== undefined && option.promptDefault !== option.defaultValue) {
    sentences.push(`Interactive default: ${formatValue(option.promptDefault, markdown)}`);
  }
  if (option.type === "string") {
    sentences.push("Value must not be empty");
  }
  if (option.requires) {
    sentences.push(`Requires ${formatValue(`--${option.requires}`, markdown)}`);
  }
  const conflict = optionConflict(option);
  if (conflict) {
    sentences.push(`Conflicts with ${formatValue(`--${conflict}`, markdown)}`);
  }
  return sentences.join(". ");
}

export function renderHelp() {
  const rows = OPTION_CONTRACT.map((option) => [optionSyntax(option), optionDescription(option)]);
  const width = Math.max(...rows.map(([syntax]) => syntax.length));
  const options = rows
    .map(([syntax, description]) => `  ${syntax.padEnd(width)}  ${description}`)
    .join("\n");
  return `
Usage: create-next-app [app-name] [options]

Scaffolds Next.js with the Larsen Utvikling design system.

Options:
${options}
`;
}

export function renderMarkdownOptionTable() {
  const rows = OPTION_CONTRACT.map(
    (option) => `| \`${optionSyntax(option)}\` | ${optionDescription(option, { markdown: true })} |`,
  );
  return ["| Flag | Description |", "| --- | --- |", ...rows].join("\n");
}

/** @param {string} spec */
export function nextJsClaim(spec) {
  return `the wrapper requested create-next-app@${spec}`;
}

/** @param {string} spec */
export function scaffoldCompleteMessage(spec) {
  return `Next.js scaffolded - requested create-next-app@${spec}`;
}

/** @param {string} value */
export function serializeTsxText(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}
