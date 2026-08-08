// @ts-check

/**
 * Interactive prompt flow (@clack/prompts). Every prompt can be pre-answered
 * with a CLI flag; --defaults skips all prompts.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { FORMATS, PRESETS, SCHEMES, isValidHex } from "../palette/index.js";
import { ALL_SKILLS, RECOMMENDED_SKILLS, SKILLS } from "./skills.js";

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
  const scheme = flags.scheme ?? "analogous";
  if (!SCHEMES.includes(scheme)) {
    p.cancel(`Unknown --scheme "${scheme}" (expected ${SCHEMES.join(" | ")})`);
    process.exit(1);
  }

  if (flags.hex) {
    if (!isValidHex(flags.hex)) {
      p.cancel(`Invalid --hex "${flags.hex}" (expected e.g. 4DA0FF or #4DA0FF)`);
      process.exit(1);
    }
    palette = {
      hex: flags.hex,
      preset: flags.preset ?? "shadcn",
      format: flags.format ?? "hsl-values",
      scheme,
    };
  } else if (!useDefaults) {
    requireInteractive("the palette choice", "--hex <color>");
    const wantsCustom = await p.confirm({
      message: "Generate a custom 12-step palette from a single HEX?",
      initialValue: false,
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
        options: [
          { value: "shadcn", label: "shadcn/ui", hint: "semantic tokens + scales (recommended)" },
          { value: "radix", label: "Radix Colors", hint: "accent + gray scales" },
          { value: "css-variables", label: "CSS Variables", hint: "accent + gray scales" },
        ],
      });
      handleCancel(/** @type {never} */ (preset));

      const format = await p.select({
        message: "Choose color format",
        options: [
          { value: "hsl-values", label: "HSL Values", hint: "0 0% 100% - supports hsl(var(--x) / alpha) (recommended)" },
          { value: "hex", label: "HEX" },
          { value: "rgb", label: "RGB" },
          { value: "hsl", label: "HSL" },
          { value: "oklab", label: "OKLAB" },
          { value: "oklch", label: "OKLCH" },
        ],
      });
      handleCancel(/** @type {never} */ (format));

      palette = { hex: String(hex), preset: String(preset), format: String(format), scheme };
    }
  }

  if (palette) {
    if (!(palette.preset in PRESETS)) {
      p.cancel(`Unknown --preset "${palette.preset}" (expected ${Object.keys(PRESETS).join(" | ")})`);
      process.exit(1);
    }
    if (!(palette.format in FORMATS)) {
      p.cancel(`Unknown --format "${palette.format}" (expected ${Object.keys(FORMATS).join(" | ")})`);
      process.exit(1);
    }
  }

  // Linter
  let linter = flags.linter;
  if (linter && !["eslint", "biome", "none"].includes(linter)) {
    p.cancel(`Unknown --linter "${linter}" (expected eslint | biome | none)`);
    process.exit(1);
  }
  if (!linter) {
    if (useDefaults) {
      linter = "eslint";
    } else {
      requireInteractive("the linter", "--linter <name>");
      const answer = await p.select({
        message: "Which linter?",
        options: [
          { value: "eslint", label: "ESLint" },
          { value: "biome", label: "Biome" },
          { value: "none", label: "None" },
        ],
      });
      handleCancel(/** @type {never} */ (answer));
      linter = String(answer);
    }
  }

  // Package manager
  let pm = flags.pm;
  if (pm && !["npm", "pnpm", "yarn", "bun"].includes(pm)) {
    p.cancel(`Unknown --pm "${pm}" (expected npm | pnpm | yarn | bun)`);
    process.exit(1);
  }
  if (!pm) {
    if (useDefaults) {
      pm = "npm";
    } else {
      requireInteractive("the package manager", "--pm <name>");
      const answer = await p.select({
        message: "Which package manager?",
        options: [
          { value: "npm", label: "npm" },
          { value: "pnpm", label: "pnpm" },
          { value: "yarn", label: "yarn" },
          { value: "bun", label: "bun" },
        ],
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
      git = true;
    } else {
      requireInteractive("git init", "--no-git");
      const answer = await p.confirm({ message: "Initialize a git repository?", initialValue: true });
      handleCancel(/** @type {never} */ (answer));
      git = Boolean(answer);
    }
  }

  let install = flags["no-install"] ? false : flags.install;
  if (install === undefined) {
    if (useDefaults) {
      install = true;
    } else {
      requireInteractive("the dependency install", "--no-install");
      const answer = await p.confirm({ message: "Install dependencies?", initialValue: true });
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
    cnaVersion: flags["cna-version"] ?? "latest",
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
  if (useDefaults) return [];

  requireInteractive("the skills choice", "--skills <list> or --no-skills");
  const wants = await p.confirm({
    message: "Install Larsen Skills for AI agents (UI, motion, accessibility)?",
    initialValue: true,
  });
  handleCancel(/** @type {never} */ (wants));
  if (!wants) return [];

  const choice = await p.select({
    message: "Which skills?",
    options: [
      { value: "recommended", label: "Recommended", hint: RECOMMENDED_SKILLS.join(", ") },
      { value: "all", label: "All", hint: `${ALL_SKILLS.length} skills` },
      { value: "pick", label: "Let me pick" },
    ],
  });
  handleCancel(/** @type {never} */ (choice));

  if (choice === "recommended") return RECOMMENDED_SKILLS;
  if (choice === "all") return ALL_SKILLS;

  const picked = await p.multiselect({
    message: "Select skills (space to toggle, enter to confirm)",
    options: SKILLS.map((s) => ({ value: s.name, label: s.label, hint: s.hint })),
    initialValues: RECOMMENDED_SKILLS,
    required: false,
  });
  handleCancel(/** @type {never} */ (picked));
  return /** @type {string[]} */ (picked);
}
