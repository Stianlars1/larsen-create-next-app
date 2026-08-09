// @ts-check

import { parseArgs } from "node:util";

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
    defaultValue: false,
    description: "Skip all prompts, use defaults",
  },
  {
    name: "default-palette",
    type: "boolean",
    defaultValue: false,
    description: "Use the default Larsen Utvikling palette",
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
    choices: [
      {
        value: "shadcn",
        label: "shadcn/ui",
        hint: "semantic tokens + scales (recommended)",
      },
      { value: "radix", label: "Radix Colors", hint: "accent + gray scales" },
      { value: "css-variables", label: "CSS Variables", hint: "accent + gray scales" },
    ],
    description: "Palette preset: shadcn | radix | css-variables",
  },
  {
    name: "format",
    type: "string",
    valueName: "name",
    defaultValue: "hsl-values",
    requires: "hex",
    choices: [
      {
        value: "hsl-values",
        label: "HSL Values",
        hint: "0 0% 100% - supports hsl(var(--x) / alpha) (recommended)",
      },
      { value: "hex", label: "HEX" },
      { value: "rgb", label: "RGB" },
      { value: "hsl", label: "HSL" },
      { value: "oklab", label: "OKLAB" },
      { value: "oklch", label: "OKLCH" },
    ],
    description: "Color format: hex | rgb | hsl | hsl-values | oklab | oklch",
  },
  {
    name: "scheme",
    type: "string",
    valueName: "name",
    defaultValue: "analogous",
    requires: "hex",
    choices: [
      { value: "analogous", label: "Analogous" },
      { value: "monochromatic", label: "Monochromatic" },
      { value: "complementary", label: "Complementary" },
      { value: "triadic", label: "Triadic" },
    ],
    description: "Color scheme: analogous | monochromatic | complementary | triadic",
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
    description: "Package manager: npm | pnpm | yarn | bun",
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
    description: "Linter: eslint | biome | none",
  },
  {
    name: "skills",
    type: "string",
    valueName: "list",
    defaultValue: [],
    promptDefault: "recommended",
    description: "Larsen Skills: recommended | all | comma-separated names",
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
    description: "Pin create-next-app version (default: latest)",
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

/**
 * Returns the first invalid relationship, or undefined when the explicitly
 * supplied options can be resolved without ignoring an answer.
 *
 * @param {Record<string, any>} flags
 */
export function validateOptionRelationships(flags) {
  for (const option of OPTION_CONTRACT) {
    if (option.conflicts && flags[option.name] && flags[option.conflicts]) {
      return `--${option.name} cannot be combined with --${option.conflicts}.`;
    }
  }
  if (flags["default-palette"] && flags.hex !== undefined) {
    return "--default-palette cannot be combined with --hex.";
  }
  for (const option of OPTION_CONTRACT) {
    if (option.requires && flags[option.name] !== undefined && flags[option.requires] === undefined) {
      return `--${option.name} requires --${option.requires}.`;
    }
  }
  return undefined;
}

function optionSyntax(option) {
  const value = option.valueName ? ` <${option.valueName}>` : "";
  const long = `--${option.name}${value}`;
  return option.short ? `-${option.short}, ${long}` : long;
}

export function renderHelp() {
  const rows = OPTION_CONTRACT.map((option) => [optionSyntax(option), option.description]);
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

/** @param {string} spec */
export function nextJsClaim(spec) {
  return spec === "latest"
    ? "newest stable Next.js"
    : `Next.js generated with create-next-app@${spec}`;
}

/** @param {string} spec */
export function scaffoldCompleteMessage(spec) {
  return spec === "latest"
    ? "Next.js scaffolded (newest stable)"
    : `Next.js scaffolded (create-next-app@${spec})`;
}
