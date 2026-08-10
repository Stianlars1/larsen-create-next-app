#!/usr/bin/env node
// @ts-check

/**
 * @larsen-utvikling/create-next-app
 *
 * Requests the selected create-next-app npm spec, then overlays the Larsen
 * Utvikling design system (vanilla CSS tokens), agent docs, and an optional
 * 12-step color palette generated from a single HEX.
 *
 * Flow: prompts -> scaffold -> overlay (+ palette) -> install -> git
 */

import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import {
  nextJsClaim,
  parseCliArgs,
  removedOptionHint,
  renderHelp,
  scaffoldCompleteMessage,
  serializeTsxText,
  validateCliInput,
} from "../src/options.js";
import { promptConfig } from "../src/prompts.js";
import { scaffold } from "../src/scaffold.js";
import { overlay } from "../src/overlay.js";
import { run } from "../src/run.js";
import { installSkills, renderSkillsNote } from "../src/skills.js";
import {
  DEFAULT_THEME,
  generateThemeCss,
  normalizeHex,
  tokenRoles,
  usageIdioms,
} from "../palette/index.js";

const templateDir = fileURLToPath(new URL("../template", import.meta.url));

const PM_RUN = { npm: "npm run", pnpm: "pnpm", yarn: "yarn", bun: "bun run" };

/**
 * An unknown flag is a user error, not a crash. Node's parser throws, so the
 * message is reported on its own and a removed flag names its replacement.
 */
function parseOrExit() {
  const args = process.argv.slice(2);
  try {
    return parseCliArgs(args);
  } catch (error) {
    p.intro("Larsen Utvikling - create-next-app");
    const hint = removedOptionHint(args);
    p.cancel(
      `${error instanceof Error ? error.message : String(error)}${hint ? `\n${hint}` : ""}\nRun with --help for the full option list.`,
    );
    process.exit(1);
  }
}

const { values: flags, positionals } = parseOrExit();

if (flags.version) {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  console.log(pkg.version);
  process.exit(0);
}

if (flags.help) {
  console.log(renderHelp());
  process.exit(0);
}

/** @type {"idle" | "scaffold" | "overlay" | "install" | "git"} */
let phase = "idle";
let appDir = "";
let createdDir = false;
let cnaVersion = "latest";

process.on("SIGINT", () => {
  if (createdDir && (phase === "scaffold" || phase === "overlay")) {
    rmSync(appDir, { recursive: true, force: true });
    console.log("\nCancelled - cleaned up partial app directory.");
  } else if (createdDir) {
    console.log(`\nCancelled - the app at ${appDir} is scaffolded; finish setup manually.`);
  }
  process.exit(130);
});

p.intro("Larsen Utvikling - create-next-app");

try {
  const inputError = validateCliInput(flags, positionals);
  if (inputError) {
    p.cancel(inputError);
    process.exit(1);
  }
  const config = await promptConfig(flags, positionals[0], process.cwd());
  cnaVersion = config.cnaVersion;
  appDir = join(process.cwd(), config.name);

  // Scaffold
  phase = "scaffold";
  createdDir = true;
  const spinner = p.spinner();
  spinner.start(`Scaffolding Next.js (create-next-app@${config.cnaVersion})`);
  await scaffold(
    { name: config.name, linter: config.linter, cnaVersion: config.cnaVersion },
    { cwd: process.cwd() },
  );
  spinner.stop(scaffoldCompleteMessage(config.cnaVersion));

  // Agent skills are installed before the overlay so the docs it writes list
  // the skills that actually landed, not the ones that were requested.
  phase = "overlay";
  /** @type {string[]} */
  let installedSkills = [];
  if (config.skills.length > 0) {
    const skillsSpinner = p.spinner();
    const skillWarnings = [];
    skillsSpinner.start(`Installing ${config.skills.length} agent skills`);
    try {
      installedSkills = await installSkills(config.skills, {
        cwd: appDir,
        onWarning: (message) => skillWarnings.push(message),
      });
    } catch {
      skillWarnings.push(
        "Optional agent skill installation failed before verification; the scaffold will continue.",
      );
    }
    if (installedSkills.length > 0) {
      skillsSpinner.stop(`${installedSkills.length} skills installed into .agents/skills/`);
    } else {
      skillsSpinner.stop("No agent skills installed", 1);
    }
    for (const warning of skillWarnings) p.log.warn(warning);
  }

  // Palette + overlay
  const paletteMeta = config.palette ?? DEFAULT_THEME;
  const idioms = usageIdioms(/** @type {any} */ (paletteMeta.format));
  const roles = tokenRoles(
    /** @type {any} */ (paletteMeta.preset),
    /** @type {any} */ (paletteMeta.format),
  );
  const themeCss = config.palette
    ? generateThemeCss(/** @type {any} */ (config.palette))
    : undefined; // keep the baked-in default theme

  overlay({
    templateDir,
    appDir,
    vars: {
      APP_NAME: config.name,
      NEXTJS_CLAIM: nextJsClaim(config.cnaVersion),
      NEXTJS_CLAIM_TSX: serializeTsxText(nextJsClaim(config.cnaVersion)),
      PM: config.pm,
      PM_RUN: PM_RUN[/** @type {keyof typeof PM_RUN} */ (config.pm)],
      PALETTE_SEED: normalizeHex(paletteMeta.hex),
      PALETTE_PRESET: paletteMeta.preset,
      PALETTE_FORMAT: paletteMeta.format,
      PALETTE_NEUTRAL_TINT: paletteMeta.neutralTint,
      PALETTE_IDIOM: idioms.idiom,
      PALETTE_ALPHA_IDIOM: idioms.alphaIdiom,
      T_BACKGROUND: roles.background.name,
      C_BACKGROUND: roles.background.expr,
      T_FOREGROUND: roles.foreground.name,
      C_FOREGROUND: roles.foreground.expr,
      T_MUTED: roles.muted.name,
      C_MUTED: roles.muted.expr,
      T_ACCENT_SOLID: roles.accentSolid.name,
      C_ACCENT_SOLID: roles.accentSolid.expr,
      T_ACCENT_SOFT: roles.accentSoft.name,
      C_ACCENT_SOFT: roles.accentSoft.expr,
      T_LINE: roles.line.name,
      C_LINE: roles.line.expr,
      // The brand accents ship with the default theme only - a custom palette
      // makes its own seed the accent, so the note must not appear there.
      BRAND_NOTE: config.palette
        ? ""
        : "\nThe default Larsen Utvikling theme additionally ships the brand\naccents `--brand-blue`, `--brand-blue-soft` and `--brand-blue-subtle`\n(used for links and highlights on larsenutvikling.no).",
      SKILLS_NOTE: renderSkillsNote(installedSkills),
    },
    themeCss,
  });
  p.log.success(
    config.palette
      ? `Design system applied - custom palette from ${normalizeHex(paletteMeta.hex)} (${paletteMeta.preset} x ${paletteMeta.format}, ${paletteMeta.neutralTint} neutral tint)`
      : "Design system applied - default Larsen Utvikling theme",
  );

  // Install
  phase = "install";
  if (config.install) {
    const installSpinner = p.spinner();
    installSpinner.start(`Installing dependencies with ${config.pm}`);
    try {
      await run(config.pm, ["install"], { cwd: appDir });
      installSpinner.stop("Dependencies installed");
    } catch (err) {
      installSpinner.stop("Dependency install failed", 1);
      const code = /** @type {any} */ (err)?.code;
      if (code === "ENOENT") {
        p.log.warn(`${config.pm} is not installed - run "${config.pm} install" in ${config.name} manually.`);
      } else {
        p.log.warn(`Install failed - run "${config.pm} install" in ${config.name} manually.`);
      }
    }
  }

  // Git
  phase = "git";
  if (config.git) {
    try {
      await run("git", ["init", "-b", "main"], { cwd: appDir });
      await run("git", ["add", "-A"], { cwd: appDir });
      await run("git", ["commit", "-m", "Initial commit from @larsen-utvikling/create-next-app"], {
        cwd: appDir,
      });
      p.log.success("Git repository initialized");
    } catch {
      p.log.warn("Git init or commit failed (missing git identity?) - finish manually.");
    }
  }

  const pmRun = PM_RUN[/** @type {keyof typeof PM_RUN} */ (config.pm)];
  p.outro(`Done. Next steps:

  cd ${config.name}${config.install ? "" : `\n  ${config.pm} install`}
  ${pmRun} dev
`);
} catch (err) {
  const error = /** @type {any} */ (err);
  const tail = typeof error?.output === "string" ? error.output.slice(-2000) : "";
  if (tail) console.error(tail);
  if (/ENOTFOUND|ETIMEDOUT|EAI_AGAIN|network/i.test(String(error?.message) + tail)) {
    p.cancel(`Network error - an internet connection is required to fetch create-next-app@${cnaVersion}.`);
  } else {
    p.cancel(`Failed: ${error?.message ?? error}`);
  }
  if (createdDir && phase === "scaffold") {
    rmSync(appDir, { recursive: true, force: true });
  }
  process.exit(1);
}
