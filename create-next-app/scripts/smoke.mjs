// @ts-check

/**
 * Smoke test - scaffolds real apps and asserts the output.
 *
 * Modes:
 *   node scripts/smoke.mjs          tarball mode: build a consumer-clean pack
 *                                   and run that artifact via npx
 *   node scripts/smoke.mjs --tarball <path>
 *                                   run an already packed release candidate
 *   node scripts/smoke.mjs --dev    dev mode: run bin/cli.js directly
 *   node scripts/smoke.mjs --full --tarball <path>
 *                                   adds install + production build (~minutes)
 *
 * Asserts: exact generated files and docs, no Tailwind artifacts, packaging,
 * master/copy equality, and an extreme custom palette in both modes.
 */

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { packRelease } from "./pack-release.mjs";
import { generatedDocsChecks } from "./smoke-contract.mjs";
import { checkThemeContrast } from "../src/theme-contrast.mjs";

const pkgDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = join(pkgDir, "..");
const dev = process.argv.includes("--dev");
const full = process.argv.includes("--full");
const tarballFlag = process.argv.indexOf("--tarball");
const suppliedTarball = tarballFlag === -1 ? undefined : process.argv[tarballFlag + 1];

const EXPECTED_GLOBALS = `/* All styling comes from the design system - keep this file as a single import. */
@import "../lib/design-system/index.css";
`;

const NO_SKILLS_SECTION = `## Skills

No agent skills are installed. The optional collection this project was
scaffolded from is [Larsen Skills by Stian Larsen](https://github.com/Stianlars1/larsen-skills):

- \`npx skills add Stianlars1/larsen-skills\`

Run the scaffolder with \`--help\` to see every skill it can install,
including third-party skills that are opt-in by name.`;

const MIXED_SKILLS_SECTION = `## Installed skills

The wrapper verified these files on disk:

- \`.agents/skills/motion-craft/SKILL.md\`
- \`.agents/skills/transitions-dev/SKILL.md\`

Sources stay with their authors:

- [Larsen Skills by Stian Larsen](https://github.com/Stianlars1/larsen-skills)
- [Transitions.dev by Jakub Antalik](https://github.com/Jakubantalik/transitions.dev/tree/main/skills/transitions-dev) - [license terms](https://transitions.dev/terms.html)

This verifies only the listed files, not agent-specific discovery or symlinks.
Add or update them from those same repositories:

- \`npx skills add Stianlars1/larsen-skills\`
- \`npx skills add Jakubantalik/transitions.dev --skill transitions-dev\``;

/** @type {string[]} */
const failures = [];
/** @param {boolean} ok @param {string} label */
function check(ok, label) {
  console.log(`${ok ? "ok" : "FAIL"} - ${label}`);
  if (!ok) failures.push(label);
}

/** @param {string} cmd @param {string[]} args @param {string} cwd */
function runSync(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    encoding: "utf8",
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

/** @param {string} css */
function themeBlocks(css) {
  const mediaStart = css.indexOf("@media (prefers-color-scheme: dark)");
  const explicitLightStart = css.indexOf('[data-theme="light"]');
  const explicitDarkStart = css.indexOf('[data-theme="dark"]');
  const defaultsStart = css.indexOf("/* Document defaults");
  return [
    css.slice(css.indexOf(":root {"), mediaStart),
    css.slice(mediaStart, explicitLightStart),
    css.slice(explicitLightStart, explicitDarkStart),
    css.slice(explicitDarkStart, defaultsStart),
  ];
}

/** @param {string} block */
function themeDeclarations(block) {
  return [...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)]
    .map((match) => ({ name: match[1], value: match[2] }));
}

const work = mkdtempSync(join(tmpdir(), "lu-smoke-"));
const mode = dev ? "dev" : suppliedTarball ? "supplied tarball" : "packed tarball";
console.log(`smoke: workdir ${work} (${mode}${full ? ", full" : ""} mode)`);

try {
  if (tarballFlag !== -1 && !suppliedTarball) {
    throw new Error("--tarball requires a path");
  }
  if (dev && suppliedTarball) {
    throw new Error("--dev cannot be combined with --tarball");
  }
  if (full && !suppliedTarball) {
    throw new Error("--full requires the tarball path reported by pack:release");
  }

  /** @type {string[]} */
  let cliCmd;
  if (dev) {
    const sync = runSync("node", [join(pkgDir, "scripts", "sync.mjs")], pkgDir);
    check(sync.ok, "sync.mjs runs");
    cliCmd = ["node", join(pkgDir, "bin", "cli.js")];
  } else {
    const artifactPath = suppliedTarball ?? packRelease({ destination: work });
    if (!existsSync(artifactPath)) throw new Error(`tarball missing at ${artifactPath}`);
    const tarball = basename(artifactPath);
    const localArtifact = join(work, tarball);
    if (artifactPath !== localArtifact) copyFileSync(artifactPath, localArtifact);
    check(existsSync(localArtifact), "packed tarball is the CLI artifact");
    console.log(`smoke: CLI artifact ${artifactPath}`);
    // Relative "./x.tgz" is required - npx treats a bare absolute path as an
    // executable and fails with "Permission denied" instead of installing it.
    cliCmd = ["npx", "--yes", `./${tarball}`];
    const artifactVersion = runSync(cliCmd[0], [...cliCmd.slice(1), "--version"], work);
    const expectedVersion = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).version;
    check(
      artifactVersion.ok && artifactVersion.output.trim() === expectedVersion,
      `tarball CLI reports version ${expectedVersion}`,
    );
  }

  // Run 1: defaults (baked-in theme)
  const run1 = runSync(
    cliCmd[0],
    [...cliCmd.slice(1), "app-default", "--defaults", "--pm", "npm", "--no-git", "--no-install", "--no-skills"],
    work,
  );
  check(run1.ok, "scaffold with --defaults exits 0");
  if (!run1.ok) console.log(run1.output.slice(-1500));

  const app = join(work, "app-default");
  const ds = join(app, "src", "lib", "design-system");

  for (const file of ["index.css", "core.css", "theme.css", "motion.css", "base.css"]) {
    check(existsSync(join(ds, file)), `design-system/${file} exists`);
  }
  const indexCss = readFileSync(join(ds, "index.css"), "utf8");
  check(indexCss.includes("./motion.css"), "index.css imports motion.css");
  const motion = readFileSync(join(ds, "motion.css"), "utf8");
  check(motion.includes("--ease-drawer"), "motion.css has the easing set");
  check(
    motion.includes("prefers-reduced-motion") && motion.includes("--enter-distance: 0px"),
    "motion.css collapses movement under reduced motion",
  );
  for (const docCheck of generatedDocsChecks(app)) check(docCheck.ok, docCheck.label);
  check(existsSync(join(app, "public", "larsen-utvikling", "logo.svg")), "logo assets exist");
  check(!existsSync(join(app, "src", "app", "page.module.css")), "page.module.css removed");
  check(!existsSync(join(app, "public", "next.svg")), "branding svgs removed");

  const claudeMd = readFileSync(join(app, "CLAUDE.md"), "utf8");
  check(claudeMd.trim() === "@AGENTS.md", "CLAUDE.md is the @AGENTS.md pointer");

  const globals = readFileSync(join(app, "src", "app", "globals.css"), "utf8");
  check(globals === EXPECTED_GLOBALS, "globals.css is exactly the single design-system import");

  const theme = readFileSync(join(ds, "theme.css"), "utf8");
  check(theme.includes("--accent-9:"), "default theme has accent scale");
  check(theme.includes('[data-theme="dark"]'), "default theme has [data-theme] override");
  check(theme.includes("body {"), "default theme has document defaults");
  check(theme.includes("--brand-blue:"), "default theme has brand accents");
  check(theme.includes("neutral tint: strong"), "default theme uses the strong neutral tint");

  // Regression guard: an extreme seed used to leave --primary and --ring at
  // the seed color in both modes, so dark mode rendered near-black on
  // The checker supports only shadcn hsl-values themes. The default and this
  // custom smoke case both use that exact preset-format combination.
  const contrastFailures = checkThemeContrast(theme);
  check(
    contrastFailures.length === 0,
    `default shadcn hsl-values contrast checks (${contrastFailures.join("; ") || "all pairs pass"})`,
  );

  // No unsubstituted {{VARS}} in text files (JSX style={{...}} is fine)
  const placeholderHits = [];
  for (const file of ["AGENTS.md", "DESIGN.md", "README.md", "src/app/layout.tsx", "src/app/page.tsx", "src/app/page.css"]) {
    const content = readFileSync(join(app, file), "utf8");
    if (/\{\{[A-Z_]+\}\}/.test(content)) placeholderHits.push(file);
  }
  check(placeholderHits.length === 0, `no leftover {{PLACEHOLDERS}} (${placeholderHits.join(", ") || "clean"})`);

  const appPkg = JSON.parse(readFileSync(join(app, "package.json"), "utf8"));
  const allDeps = { ...appPkg.dependencies, ...appPkg.devDependencies };
  check(!Object.keys(allDeps).some((d) => d.includes("tailwind")), "no tailwind dependency");
  const tailwindArtifacts = [
    "tailwind.config.js",
    "tailwind.config.cjs",
    "tailwind.config.mjs",
    "tailwind.config.ts",
    "postcss.config.js",
    "postcss.config.cjs",
    "postcss.config.mjs",
    "postcss.config.ts",
  ].filter((file) => existsSync(join(app, file)));
  check(
    tailwindArtifacts.length === 0,
    `no Tailwind config artifacts (${tailwindArtifacts.join(", ") || "clean"})`,
  );
  check(!/@tailwind|tailwindcss/.test(globals), "globals.css has no Tailwind directive or import");

  const defaultAgents = readFileSync(join(app, "AGENTS.md"), "utf8");
  check(
    defaultAgents.slice(defaultAgents.indexOf("## Skills")).trimEnd() === NO_SKILLS_SECTION,
    "AGENTS.md has the exact no-skills documentation",
  );

  // Masters == synced copies (dev mode only; tarball content came from the same sync)
  if (dev) {
    for (const [master, copy] of [
      [join(repoRoot, "CSS"), join(pkgDir, "template", "src", "lib", "design-system")],
      [join(repoRoot, "palette"), join(pkgDir, "palette")],
    ]) {
      const diff = runSync("diff", ["-r", "--exclude", ".DS_Store", master, copy], repoRoot);
      check(diff.ok, `master in sync: ${master.split("/").pop()}`);
    }
  }

  // Run 2: custom palette
  const run2 = runSync(
    cliCmd[0],
    [
      ...cliCmd.slice(1),
      "app-custom",
      "--hex", "0A0A0A",
      "--preset", "shadcn",
      "--format", "hsl-values",
      "--neutral-tint", "strong",
      "--linter", "none",
      "--pm", "npm",
      "--no-git",
      "--no-install",
      "--skills", "motion-craft,transitions-dev",
    ],
    work,
  );
  check(run2.ok, "scaffold with custom palette exits 0");
  const skillDir = join(work, "app-custom", ".agents", "skills", "motion-craft");
  check(existsSync(join(skillDir, "SKILL.md")), "requested skill installed into .agents/skills/");
  const thirdPartySkillDir = join(work, "app-custom", ".agents", "skills", "transitions-dev");
  check(
    existsSync(join(thirdPartySkillDir, "SKILL.md")),
    "requested third-party skill installed from its source repository",
  );
  const customAgents = readFileSync(join(work, "app-custom", "AGENTS.md"), "utf8");
  check(
    customAgents.slice(customAgents.indexOf("## Installed skills")).trimEnd()
      === MIXED_SKILLS_SECTION,
    "AGENTS.md lists exactly the installed skills",
  );
  const customTheme = readFileSync(
    join(work, "app-custom", "src", "lib", "design-system", "theme.css"),
    "utf8",
  );
  check(
    customTheme.includes("Seed: #0A0A0A (light from #0A0A0A, dark from #F5F5F5)"),
    "extreme seed assigns separate light and dark mode seeds",
  );
  check(customTheme.includes("neutral tint: strong"), "custom theme records the strong neutral tint");
  check(customTheme.includes("--accent-9:") && customTheme.includes('[data-theme="dark"]'), "custom theme structure");
  const customContrastFailures = checkThemeContrast(customTheme);
  check(
    customContrastFailures.length === 0,
    `extreme-seed shadcn hsl-values contrast checks (${customContrastFailures.join("; ") || "all pairs pass"})`,
  );
  const requiredShadcnNames = [
    "radius", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
    "sidebar", "sidebar-foreground", "sidebar-primary",
    "sidebar-primary-foreground", "sidebar-accent",
    "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
  ];
  const customBlocks = themeBlocks(customTheme).map(themeDeclarations);
  check(
    customBlocks.every((block, index) => block.length === (index % 2 === 0 ? 82 : 81)),
    "custom shadcn artifact keeps the 82/81 declaration contract",
  );
  check(
    requiredShadcnNames.every((name) => customBlocks[0].some((item) => item.name === name))
      && requiredShadcnNames.filter((name) => name !== "radius")
        .every((name) => customBlocks[1].some((item) => item.name === name)),
    "custom shadcn artifact includes radius, chart, and sidebar contracts",
  );

  // Run 3: Radix Themes custom-palette override contract with alpha output.
  const run3 = runSync(
    cliCmd[0],
    [
      ...cliCmd.slice(1),
      "app-radix",
      "--hex", "F59E0B",
      "--preset", "radix",
      "--format", "oklch",
      "--neutral-tint", "subtle",
      "--linter", "biome",
      "--pm", "npm",
      "--no-git",
      "--no-install",
      "--no-skills",
    ],
    work,
  );
  check(run3.ok, "scaffold with Radix custom-palette override exits 0");
  const radixTheme = readFileSync(
    join(work, "app-radix", "src", "lib", "design-system", "theme.css"),
    "utf8",
  );
  const radixBlocks = themeBlocks(radixTheme).map(themeDeclarations);
  check(
    radixBlocks.every((block) => block.length === 83),
    "Radix artifact keeps 83 declarations in every mode block",
  );
  check(
    radixBlocks.every((block) => ["accent-a1", "gray-a1", "accent-surface", "gray-surface"]
      .every((name) => block.find((item) => item.name === name)?.value.includes(" / "))),
    "Radix artifact preserves alpha in representative OKLCH tokens",
  );

  // Run 4: generic CSS Variables contract remains independent and compact.
  const run4 = runSync(
    cliCmd[0],
    [
      ...cliCmd.slice(1),
      "app-css-variables",
      "--hex", "F5F5F5",
      "--preset", "css-variables",
      "--format", "oklab",
      "--neutral-tint", "subtle",
      "--linter", "none",
      "--pm", "npm",
      "--no-git",
      "--no-install",
      "--no-skills",
    ],
    work,
  );
  check(run4.ok, "scaffold with generic CSS Variables exits 0");
  const cssVariablesTheme = readFileSync(
    join(work, "app-css-variables", "src", "lib", "design-system", "theme.css"),
    "utf8",
  );
  const cssVariablesBlocks = themeBlocks(cssVariablesTheme).map(themeDeclarations);
  check(
    cssVariablesBlocks.every((block) => block.length === 50),
    "CSS Variables artifact keeps 50 declarations in every mode block",
  );
  check(
    !cssVariablesTheme.includes("--sidebar:") && !cssVariablesTheme.includes("--accent-a1:"),
    "CSS Variables artifact does not acquire shadcn or Radix-only names",
  );

  // Full mode: install + production build
  if (full) {
    console.log("smoke: full mode - installing and building app-default (this takes a while)");
    const install = runSync("npm", ["install", "--no-audit", "--no-fund"], app);
    check(install.ok, "npm install in generated app");
    const build = runSync("npx", ["next", "build"], app);
    check(build.ok, "next build in generated app");
    if (!build.ok) console.log(build.output.slice(-1500));
  }
} catch (err) {
  failures.push(`unexpected error: ${/** @type {any} */ (err)?.message ?? err}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\nsmoke: ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("\nsmoke: all checks passed");
