// @ts-check

/**
 * Interactive prompt flow (@clack/prompts). Every prompt can be pre-answered
 * with a CLI flag; --defaults skips all prompts.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { isValidHex } from "../palette/index.js";
import {
  optionChoices,
  optionDefault,
  optionPromptDefault,
  validateOptionRelationships,
} from "./options.js";
import { ALL_SKILLS, RECOMMENDED_SKILLS, SKILLS } from "./skills.js";

/**
 * Canonical interactive skills branch. Runtime prompts and generated
 * maintainer documentation consume the same messages, choices, defaults, and
 * multiselect contract.
 */
export const SKILLS_PROMPT_CONTRACT = Object.freeze({
  confirmation: Object.freeze({
    message: "Install Larsen Skills for AI agents (UI, motion, accessibility)?",
    initialValue: optionPromptDefault("skills") !== undefined,
  }),
  selection: Object.freeze({
    message: "Which skills?",
    options: Object.freeze([
      Object.freeze({
        value: "recommended",
        label: "Recommended",
        hint: RECOMMENDED_SKILLS.join(", "),
      }),
      Object.freeze({ value: "all", label: "All", hint: `${ALL_SKILLS.length} skills` }),
      Object.freeze({ value: "pick", label: "Let me pick" }),
    ]),
    initialValue: optionPromptDefault("skills"),
  }),
  picker: Object.freeze({
    message: "Select skills (space to toggle, enter to confirm)",
    options: Object.freeze(
      SKILLS.map((skill) =>
        Object.freeze({ value: skill.name, label: skill.label, hint: skill.hint }),
      ),
    ),
    initialValues: Object.freeze([...RECOMMENDED_SKILLS]),
    required: false,
  }),
});

const NAME_RE = /^[a-z0-9][a-z0-9._-]*$/;

/** @param {never} value */
function handleCancel(value) {
  if (p.isCancel(value)) {
    p.cancel("Cancelled.");
    process.exit(130);
  }
}

/**
 * Guards a prompt that is about to run. Without a TTY - CI, a piped stdin -
 * the prompt would block and then die on Node's unsettled-await warning, so
 * fail immediately with the flag that answers the question instead.
 *
 * @param {string} question - what is being asked
 * @param {string} flag - the flag that supplies the answer
 */
function requireInteractive(question, flag) {
  if (process.stdin.isTTY) return;
  p.cancel(
    `Cannot prompt for ${question} without a terminal.\n` +
      `Pass ${flag}, or use --defaults to accept every default.`,
  );
  process.exit(1);
}

/**
 * @param {string} name
 * @param {string} cwd
 * @returns {string | undefined} error message, or undefined when valid
 */
export function validateAppName(name, cwd) {
  if (!name) return "Please enter a name";
  if (name.length > 214) return "Name must be 214 characters or fewer";
  if (!NAME_RE.test(name)) {
    return "Lowercase letters, digits, '.', '_' and '-' only (must start with a letter or digit)";
  }
  const target = join(cwd, name);
  if (existsSync(target)) {
    const entries = readdirSync(target).filter((entry) => entry !== ".DS_Store");
    if (entries.length > 0) return `Directory "${name}" already exists and is not empty`;
  }
  return undefined;
}

/**
 * @param {Record<string, any>} flags - parsed CLI flags
 * @param {string | undefined} positionalName
 * @param {string} cwd
 */
export async function promptConfig(flags, positionalName, cwd) {
  const relationshipError = validateOptionRelationships(flags);
  if (relationshipError) {
    p.cancel(relationshipError);
    process.exit(1);
  }

  const useDefaults = Boolean(flags.defaults);

  // App name
  let name = positionalName;
  if (name) {
    const error = validateAppName(name, cwd);
    if (error) {
      p.cancel(`Invalid app name: ${error}`);
      process.exit(1);
    }
  } else if (useDefaults) {
    name = "my-app";
    const error = validateAppName(name, cwd);
    if (error) {
      p.cancel(`Default name "my-app" cannot be used here: ${error}`);
      process.exit(1);
    }
  } else {
    requireInteractive("the app name", "the name as an argument");
    const answer = await p.text({
      message: "What is your app named?",
      placeholder: "my-app",
      validate: (value) => validateAppName(value, cwd),
    });
    handleCancel(/** @type {never} */ (answer));
    name = String(answer);
  }

  // Palette
  /** @type {null | { hex: string, preset: string, format: string, scheme: string }} */
  let palette = null;
  const scheme = flags.scheme ?? optionDefault("scheme");
  const schemes = optionChoices("scheme").map((choice) => choice.value);
  if (!schemes.includes(scheme)) {
    p.cancel(`Unknown --scheme "${scheme}" (expected ${schemes.join(" | ")})`);
    process.exit(1);
  }

  if (flags.hex !== undefined) {
    if (!isValidHex(flags.hex)) {
      p.cancel(`Invalid --hex "${flags.hex}" (expected e.g. 4DA0FF or #4DA0FF)`);
      process.exit(1);
    }
    palette = {
      hex: flags.hex,
      preset: flags.preset ?? optionDefault("preset"),
      format: flags.format ?? optionDefault("format"),
      scheme,
    };
  } else if (!flags["default-palette"] && !useDefaults) {
    requireInteractive("the palette choice", "--hex <color> or --default-palette");
    const wantsCustom = await p.confirm({
      message: "Generate a custom 12-step palette from a single HEX?",
      initialValue: optionPromptDefault("default-palette"),
    });
    handleCancel(/** @type {never} */ (wantsCustom));

    if (wantsCustom) {
      requireInteractive("a palette seed", "--hex <color>");
      const hex = await p.text({
        message: "Enter your HEX color",
        placeholder: "#4DA0FF",
        validate: (value) =>
          isValidHex(value ?? "") ? undefined : "Enter a valid HEX color, e.g. 4DA0FF or #4DA0FF",
      });
      handleCancel(/** @type {never} */ (hex));

      const preset = await p.select({
        message: "Choose framework/style",
        options: optionChoices("preset"),
        initialValue: optionDefault("preset"),
      });
      handleCancel(/** @type {never} */ (preset));

      const format = await p.select({
        message: "Choose color format",
        options: optionChoices("format"),
        initialValue: optionDefault("format"),
      });
      handleCancel(/** @type {never} */ (format));

      palette = { hex: String(hex), preset: String(preset), format: String(format), scheme };
    }
  }

  if (palette) {
    const presets = optionChoices("preset").map((choice) => choice.value);
    if (!presets.includes(palette.preset)) {
      p.cancel(`Unknown --preset "${palette.preset}" (expected ${presets.join(" | ")})`);
      process.exit(1);
    }
    const formats = optionChoices("format").map((choice) => choice.value);
    if (!formats.includes(palette.format)) {
      p.cancel(`Unknown --format "${palette.format}" (expected ${formats.join(" | ")})`);
      process.exit(1);
    }
  }

  // Linter
  let linter = flags.linter;
  const linters = optionChoices("linter").map((choice) => choice.value);
  if (linter && !linters.includes(linter)) {
    p.cancel(`Unknown --linter "${linter}" (expected ${linters.join(" | ")})`);
    process.exit(1);
  }
  if (!linter) {
    if (useDefaults) {
      linter = optionDefault("linter");
    } else {
      requireInteractive("the linter", "--linter <name>");
      const answer = await p.select({
        message: "Which linter?",
        options: optionChoices("linter"),
        initialValue: optionDefault("linter"),
      });
      handleCancel(/** @type {never} */ (answer));
      linter = String(answer);
    }
  }

  // Package manager
  let pm = flags.pm;
  const packageManagers = optionChoices("pm").map((choice) => choice.value);
  if (pm && !packageManagers.includes(pm)) {
    p.cancel(`Unknown --pm "${pm}" (expected ${packageManagers.join(" | ")})`);
    process.exit(1);
  }
  if (!pm) {
    if (useDefaults) {
      pm = optionDefault("pm");
    } else {
      requireInteractive("the package manager", "--pm <name>");
      const answer = await p.select({
        message: "Which package manager?",
        options: optionChoices("pm"),
        initialValue: optionDefault("pm"),
      });
      handleCancel(/** @type {never} */ (answer));
      pm = String(answer);
    }
  }

  // Larsen Skills - agent skills for UI, motion and accessibility work
  let skills = await resolveSkills(flags, useDefaults);

  // Git + install
  let git = flags["no-git"] ? false : flags.git;
  if (git === undefined) {
    if (useDefaults) {
      git = optionDefault("git");
    } else {
      requireInteractive("git init", "--git or --no-git");
      const answer = await p.confirm({
        message: "Initialize a git repository?",
        initialValue: optionDefault("git"),
      });
      handleCancel(/** @type {never} */ (answer));
      git = Boolean(answer);
    }
  }

  let install = flags["no-install"] ? false : flags.install;
  if (install === undefined) {
    if (useDefaults) {
      install = optionDefault("install");
    } else {
      requireInteractive("the dependency install", "--install or --no-install");
      const answer = await p.confirm({
        message: "Install dependencies?",
        initialValue: optionDefault("install"),
      });
      handleCancel(/** @type {never} */ (answer));
      install = Boolean(answer);
    }
  }

  return {
    name,
    palette,
    skills,
    linter: /** @type {"eslint" | "biome" | "none"} */ (linter),
    pm,
    git,
    install,
    cnaVersion: flags["cna-version"] ?? optionDefault("cna-version"),
  };
}

/**
 * Resolves which Larsen Skills to install.
 *
 * --skills accepts "recommended", "all", or a comma-separated list of names;
 * --no-skills and --defaults skip the install entirely.
 *
 * @param {Record<string, any>} flags
 * @param {boolean} useDefaults
 * @returns {Promise<string[]>} skill names, empty when nothing is installed
 */
async function resolveSkills(flags, useDefaults) {
  if (flags["no-skills"]) return [];

  if (flags.skills) {
    const raw = String(flags.skills).trim();
    if (raw === "recommended") return RECOMMENDED_SKILLS;
    if (raw === "all") return ALL_SKILLS;
    const requested = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const unknown = requested.filter((s) => !ALL_SKILLS.includes(s));
    if (unknown.length > 0) {
      p.cancel(`Unknown skill(s): ${unknown.join(", ")}\nAvailable: ${ALL_SKILLS.join(", ")}`);
      process.exit(1);
    }
    return requested;
  }

  // Opt-in only: an unattended run installs nothing.
  if (useDefaults) return optionDefault("skills");

  requireInteractive("the skills choice", "--skills <list> or --no-skills");
  const wants = await p.confirm(SKILLS_PROMPT_CONTRACT.confirmation);
  handleCancel(/** @type {never} */ (wants));
  if (!wants) return [];

  const choice = await p.select(SKILLS_PROMPT_CONTRACT.selection);
  handleCancel(/** @type {never} */ (choice));

  if (choice === "recommended") return RECOMMENDED_SKILLS;
  if (choice === "all") return ALL_SKILLS;

  const picked = await p.multiselect(SKILLS_PROMPT_CONTRACT.picker);
  handleCancel(/** @type {never} */ (picked));
  return /** @type {string[]} */ (picked);
}
