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
  renderHelp,
  scaffoldCompleteMessage,
} from "../src/options.js";
import { promptConfig } from "../src/prompts.js";
import { scaffold } from "../src/scaffold.js";
import { overlay } from "../src/overlay.js";
import { run } from "../src/run.js";
import { SKILLS_REPO, installSkills } from "../src/skills.js";
import {
  DEFAULT_THEME,
  generateThemeCss,
  normalizeHex,
  tokenRoles,
  usageIdioms,
} from "../palette/index.js";

const templateDir = fileURLToPath(new URL("../template", import.meta.url));

const PM_RUN = { npm: "npm run", pnpm: "pnpm", yarn: "yarn", bun: "bun run" };

const { values: flags, positionals } = parseCliArgs();

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

  // Larsen Skills - installed before the overlay so the docs it writes list
  // the skills that actually landed, not the ones that were requested.
  phase = "overlay";
  /** @type {string[]} */
  let installedSkills = [];
  if (config.skills.length > 0) {
    const skillsSpinner = p.spinner();
    skillsSpinner.start(`Installing ${config.skills.length} Larsen Skills`);
    try {
      installedSkills = await installSkills(config.skills, { cwd: appDir });
      skillsSpinner.stop(`${installedSkills.length} skills installed into .agents/skills/`);
    } catch {
      skillsSpinner.stop("Skills install failed", 1);
      p.log.warn(
        `Run "npx skills add ${SKILLS_REPO}" inside ${config.name} to install them manually.`,
      );
    }
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
      PM: config.pm,
      PM_RUN: PM_RUN[/** @type {keyof typeof PM_RUN} */ (config.pm)],
      PALETTE_SEED: normalizeHex(paletteMeta.hex),
      PALETTE_PRESET: paletteMeta.preset,
      PALETTE_FORMAT: paletteMeta.format,
      PALETTE_SCHEME: paletteMeta.scheme,
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
      SKILLS_NOTE:
        installedSkills.length > 0
          ? `\n## Installed skills\n\nThe wrapper verified these files on disk:\n\n${installedSkills.map((s) => `- \`.agents/skills/${s}/SKILL.md\``).join("\n")}\n\nThis verifies only the listed files, not agent-specific discovery or symlinks.\nAdd more with \`npx skills add ${SKILLS_REPO}\`.`
          : `\n## Skills\n\nNo agent skills are installed. The Larsen Skills collection covers UI\ncraft, motion and accessibility - add it with\n\`npx skills add ${SKILLS_REPO}\`.`,
    },
    themeCss,
  });
  p.log.success(
    config.palette
      ? `Design system applied - custom palette from ${normalizeHex(paletteMeta.hex)} (${paletteMeta.preset} x ${paletteMeta.format})`
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
