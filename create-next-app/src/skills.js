// @ts-check

/**
 * Optional install of the Larsen Skills collection into the scaffolded
 * project: https://github.com/Stianlars1/larsen-skills
 *
 * Uses the open `skills` installer, which writes to the universal
 * .agents/skills/ directory and symlinks the agent-specific ones, so a
 * single install covers Claude Code, Codex, Cursor, Copilot, Gemini CLI and
 * the rest. Nothing is installed unless the user asks for it.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { run } from "./run.js";

export const SKILLS_REPO = "Stianlars1/larsen-skills";

/**
 * The full collection, in the order the installer lists them. `recommended`
 * marks the ones that pair with this template's design system - motion,
 * interface and accessibility craft rather than the specialised tools.
 */
export const SKILLS = [
  { name: "motion-craft", label: "motion-craft", hint: "motion, easing, reduced-motion craft", recommended: true },
  { name: "interface-craft", label: "interface-craft", hint: "layout, hierarchy, spacing, typography", recommended: true },
  { name: "interface-review", label: "interface-review", hint: "review an interface against the craft rules", recommended: true },
  { name: "ui-primitive-picker", label: "ui-primitive-picker", hint: "pick the right primitive for a pattern", recommended: true },
  { name: "motion-vocabulary", label: "motion-vocabulary", hint: "name a motion effect you can describe but not name" },
  { name: "liquid-interface", label: "liquid-interface", hint: "liquid glass and refraction effects" },
  { name: "prototype-lab", label: "prototype-lab", hint: "throwaway prototypes for interaction ideas" },
  { name: "reverse-engineer-motion", label: "reverse-engineer-motion", hint: "rebuild motion from a reference video" },
  { name: "animated-logo-cycle", label: "animated-logo-cycle", hint: "animated brand mark systems" },
];

export const RECOMMENDED_SKILLS = SKILLS.filter((s) => s.recommended).map((s) => s.name);
export const ALL_SKILLS = SKILLS.map((s) => s.name);

/**
 * Installs the given skills into the project.
 *
 * Each skill needs its OWN --skill flag; a comma-separated list is not
 * matched and the installer quietly lists the available skills instead of
 * failing, so the result is verified on disk rather than by exit code.
 *
 * @param {string[]} skills - skill names to install
 * @param {{ cwd: string }} opts
 * @returns {Promise<string[]>} the skills that actually landed on disk
 */
export async function installSkills(skills, { cwd }) {
  const args = ["--yes", "skills", "add", SKILLS_REPO];
  for (const skill of skills) args.push("--skill", skill);
  // --yes skips the installer's own scope prompt; without it the child would
  // block forever on the closed stdin the run helper gives it.
  args.push("--yes");

  await run("npx", args, { cwd });

  const installed = skills.filter((skill) =>
    existsSync(join(cwd, ".agents", "skills", skill, "SKILL.md")),
  );
  if (installed.length === 0) throw new Error("the skills installer did not install anything");
  return installed;
}
