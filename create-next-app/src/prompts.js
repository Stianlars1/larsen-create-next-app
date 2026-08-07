// @ts-check

/**
 * Interactive prompt flow (@clack/prompts). Every prompt can be pre-answered
 * with a CLI flag; --defaults skips all prompts.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { FORMATS, PRESETS, SCHEMES, isValidHex } from "../palette/index.js";

const NAME_RE = /^[a-z0-9][a-z0-9._-]*$/;

/** @param {never} value */
function handleCancel(value) {
  if (p.isCancel(value)) {
    p.cancel("Cancelled.");
    process.exit(130);
  }
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
    const wantsCustom = await p.confirm({
      message: "Generate a custom 12-step palette from a single HEX?",
      initialValue: false,
    });
    handleCancel(/** @type {never} */ (wantsCustom));

    if (wantsCustom) {
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

  // Git + install
  let git = flags["no-git"] ? false : flags.git;
  if (git === undefined) {
    if (useDefaults) {
      git = true;
    } else {
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
      const answer = await p.confirm({ message: "Install dependencies?", initialValue: true });
      handleCancel(/** @type {never} */ (answer));
      install = Boolean(answer);
    }
  }

  return {
    name,
    palette,
    linter: /** @type {"eslint" | "biome" | "none"} */ (linter),
    pm,
    git,
    install,
    cnaVersion: flags["cna-version"] ?? "latest",
  };
}
