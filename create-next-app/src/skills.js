// @ts-check

/**
 * Optional agent-skill installation into the scaffolded project.
 *
 * Every skill is owned by one source repository. The wrapper invokes the open
 * `skills` installer once per requested source and never vendors third-party
 * skill files. It verifies only the requested
 * .agents/skills/<name>/SKILL.md files and makes no claim about agent-specific
 * discovery or symlinks. Nothing is installed unless the user asks for it.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { run } from "./run.js";

export const SKILLS_REPO = "Stianlars1/larsen-skills";
export const TRANSITIONS_REPO = "Jakubantalik/transitions.dev";

export const SKILL_SOURCES = Object.freeze([
  Object.freeze({
    id: "larsen",
    repo: SKILLS_REPO,
    label: "Larsen Skills",
    author: "Stian Larsen",
    url: "https://github.com/Stianlars1/larsen-skills",
    termsUrl: undefined,
    installCommand: `npx skills add ${SKILLS_REPO}`,
  }),
  Object.freeze({
    id: "transitions-dev",
    repo: TRANSITIONS_REPO,
    label: "Transitions.dev",
    author: "Jakub Antalik",
    url: "https://github.com/Jakubantalik/transitions.dev/tree/main/skills/transitions-dev",
    termsUrl: "https://transitions.dev/terms.html",
    installCommand: `npx skills add ${TRANSITIONS_REPO} --skill transitions-dev`,
  }),
]);

const SOURCE_BY_ID = new Map(SKILL_SOURCES.map((source) => [source.id, source]));

/**
 * The nine Larsen skills keep their existing order and semantics. The
 * approved third-party skill is selectable only by explicit name or through
 * the interactive picker.
 */
export const SKILLS = Object.freeze([
  Object.freeze({
    name: "motion-craft",
    label: "motion-craft",
    hint: "motion, easing, reduced-motion craft",
    recommended: true,
    source: "larsen",
  }),
  Object.freeze({
    name: "interface-craft",
    label: "interface-craft",
    hint: "layout, hierarchy, spacing, typography",
    recommended: true,
    source: "larsen",
  }),
  Object.freeze({
    name: "interface-review",
    label: "interface-review",
    hint: "review an interface against the craft rules",
    recommended: true,
    source: "larsen",
  }),
  Object.freeze({
    name: "ui-primitive-picker",
    label: "ui-primitive-picker",
    hint: "pick the right primitive for a pattern",
    recommended: true,
    source: "larsen",
  }),
  Object.freeze({
    name: "motion-vocabulary",
    label: "motion-vocabulary",
    hint: "name a motion effect you can describe but not name",
    source: "larsen",
  }),
  Object.freeze({
    name: "liquid-interface",
    label: "liquid-interface",
    hint: "liquid glass and refraction effects",
    source: "larsen",
  }),
  Object.freeze({
    name: "prototype-lab",
    label: "prototype-lab",
    hint: "throwaway prototypes for interaction ideas",
    source: "larsen",
  }),
  Object.freeze({
    name: "reverse-engineer-motion",
    label: "reverse-engineer-motion",
    hint: "rebuild motion from a reference video",
    source: "larsen",
  }),
  Object.freeze({
    name: "animated-logo-cycle",
    label: "animated-logo-cycle",
    hint: "animated brand mark systems",
    source: "larsen",
  }),
  Object.freeze({
    name: "transitions-dev",
    label: "transitions-dev",
    hint: "UI transition library by Jakub Antalik",
    source: "transitions-dev",
  }),
]);

const SKILL_BY_NAME = new Map(SKILLS.map((skill) => [skill.name, skill]));

export const RECOMMENDED_SKILLS = Object.freeze(
  SKILLS.filter((skill) => skill.source === "larsen" && skill.recommended).map((skill) => skill.name),
);

/** `all` deliberately remains the nine Larsen skills for compatibility. */
export const ALL_SKILLS = Object.freeze(
  SKILLS.filter((skill) => skill.source === "larsen").map((skill) => skill.name),
);

/** Every name accepted in an explicit comma-separated list or the picker. */
export const SELECTABLE_SKILLS = Object.freeze(SKILLS.map((skill) => skill.name));

/** @param {string} skill */
export function sourceForSkill(skill) {
  const record = SKILL_BY_NAME.get(skill);
  return record ? SOURCE_BY_ID.get(record.source) : undefined;
}

/** @param {(typeof SKILL_SOURCES)[number]} source */
function sourceAttribution(source) {
  const terms = source.termsUrl ? ` - [license terms](${source.termsUrl})` : "";
  return `[${source.label} by ${source.author}](${source.url})${terms}`;
}

/**
 * The skills section written into a generated project's AGENTS.md.
 *
 * A generated project names only the sources it actually used, plus this
 * package's own collection. A project that declined skills, or that installed
 * only Larsen Skills, never carries a pointer to somebody else's work it did
 * not ask for.
 *
 * @param {string[]} installedSkills - names verified on disk
 */
export function renderSkillsNote(installedSkills) {
  const [firstParty] = SKILL_SOURCES;

  if (installedSkills.length === 0) {
    return (
      "\n## Skills\n\nNo agent skills are installed. The optional collection this project was\n" +
      `scaffolded from is ${sourceAttribution(firstParty)}:\n\n` +
      `- \`${firstParty.installCommand}\`\n\n` +
      "Run the scaffolder with `--help` to see every skill it can install,\n" +
      "including third-party skills that are opt-in by name."
    );
  }

  const files = installedSkills
    .map((skill) => `- \`.agents/skills/${skill}/SKILL.md\``)
    .join("\n");
  const usedSourceIds = new Set(
    installedSkills.map((skill) => sourceForSkill(skill)?.id).filter(Boolean),
  );
  const used = SKILL_SOURCES.filter((source) => usedSourceIds.has(source.id));

  return (
    `\n## Installed skills\n\nThe wrapper verified these files on disk:\n\n${files}\n\n` +
    `Sources stay with their authors:\n\n${used.map((s) => `- ${sourceAttribution(s)}`).join("\n")}\n\n` +
    "This verifies only the listed files, not agent-specific discovery or symlinks.\n" +
    `Add or update them from those same repositories:\n\n${used.map((s) => `- \`${s.installCommand}\``).join("\n")}`
  );
}

/**
 * Installs the given skills into the project.
 *
 * Each skill needs its own --skill flag. A comma-separated value is not
 * matched by the upstream installer, which can still exit successfully after
 * installing nothing. Each source is therefore verified independently on
 * disk. A source failure warns through the supplied callback and does not
 * prevent later sources from running.
 *
 * @param {string[]} skills - skill names to install
 * @param {{ cwd: string, onWarning?: (message: string) => void }} opts
 * @returns {Promise<string[]>} the skills that actually landed on disk
 */
export async function installSkills(skills, { cwd, onWarning = () => {} }) {
  const requestedNames = [...new Set(skills)];
  const unknown = requestedNames.filter((skill) => !SKILL_BY_NAME.has(skill));
  if (unknown.length > 0) {
    throw new Error(`unknown agent skill(s): ${unknown.join(", ")}`);
  }

  /** @type {Map<string, string[]>} */
  const groups = new Map();
  for (const name of requestedNames) {
    const sourceId = SKILL_BY_NAME.get(name)?.source;
    if (!sourceId) continue;
    const group = groups.get(sourceId) ?? [];
    group.push(name);
    groups.set(sourceId, group);
  }

  const installed = new Set();

  for (const [sourceId, sourceSkills] of groups) {
    const source = SOURCE_BY_ID.get(sourceId);
    if (!source) throw new Error(`missing source contract for ${sourceId}`);

    const args = ["--yes", "skills", "add", source.repo];
    for (const skill of sourceSkills) args.push("--skill", skill);
    // --yes skips the installer's own scope prompt; without it the child would
    // block forever on the closed stdin the run helper gives it.
    args.push("--yes");

    let commandFailed = false;
    try {
      await run("npx", args, { cwd });
    } catch {
      commandFailed = true;
    }

    const landed = sourceSkills.filter((skill) =>
      existsSync(join(cwd, ".agents", "skills", skill, "SKILL.md")),
    );
    for (const skill of landed) installed.add(skill);

    const missing = sourceSkills.filter((skill) => !installed.has(skill));
    if (commandFailed) {
      onWarning(
        `${source.label} install from ${source.repo} failed. ` +
          `${landed.length} verified, ${missing.length} missing; the scaffold will continue.`,
      );
    } else if (missing.length > 0) {
      onWarning(
        `${source.label} installer exited without creating: ${missing.join(", ")}. ` +
          "The scaffold will continue.",
      );
    }
  }

  return requestedNames.filter((skill) => installed.has(skill));
}
