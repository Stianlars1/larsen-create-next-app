// @ts-check

/**
 * Smoke test - scaffolds real apps and asserts the output.
 *
 * Modes:
 *   node scripts/smoke.mjs          tarball mode: npm pack, run the CLI from
 *                                   the tarball via npx (validates packaging)
 *   node scripts/smoke.mjs --dev    dev mode: run bin/cli.js directly (fast,
 *                                   used by prepublishOnly)
 *   node scripts/smoke.mjs --full   adds install + production build (~minutes)
 *
 * Asserts: design system files, docs, substitution, no tailwind, master/copy
 * equality, and a custom palette run.
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = join(pkgDir, "..");
const dev = process.argv.includes("--dev");
const full = process.argv.includes("--full");

/** @type {string[]} */
const failures = [];
/** @param {boolean} ok @param {string} label */
function check(ok, label) {
  console.log(`${ok ? "ok" : "FAIL"} - ${label}`);
  if (!ok) failures.push(label);
}

/**
 * Verifies the generated theme is actually usable in both modes:
 * foreground text readable (WCAG AA 4.5), primary and ring distinguishable
 * from the page surface (WCAG non-text 3.0), and button labels readable.
 * Only meaningful for the hsl-values default theme.
 *
 * @param {string} css
 * @returns {string[]} human-readable failures
 */
function checkThemeContrast(css) {
  const block = (/** @type {string} */ from, /** @type {string} */ to) => {
    const start = css.indexOf(from);
    const segment = to === "" ? css.slice(start) : css.slice(start, css.indexOf(to));
    /** @type {Record<string, string>} */
    const tokens = {};
    for (const m of segment.matchAll(/--([a-z0-9-]+):\s*([0-9.]+ [0-9.]+% [0-9.]+%)/g)) {
      if (!(m[1] in tokens)) tokens[m[1]] = m[2];
    }
    return tokens;
  };

  // Relative luminance from an "H S% L%" triplet (WCAG 2.1 formula).
  const luminance = (/** @type {string} */ triplet) => {
    const [h, s, l] = triplet.split(" ").map(parseFloat);
    const sN = s / 100;
    const lN = l / 100;
    const c = (1 - Math.abs(2 * lN - 1)) * sN;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lN - c / 2;
    const [r, g, b] = (
      h < 60 ? [c, x, 0]
      : h < 120 ? [x, c, 0]
      : h < 180 ? [0, c, x]
      : h < 240 ? [0, x, c]
      : h < 300 ? [x, 0, c]
      : [c, 0, x]
    ).map((v) => {
      const channel = v + m;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (/** @type {string} */ a, /** @type {string} */ b) => {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  /** @type {string[]} */
  const failures = [];
  for (const [mode, tokens] of [
    ["light", block(":root {", "@media")],
    ["dark", block("@media", '[data-theme="light"]')],
  ]) {
    const t = /** @type {Record<string, string>} */ (tokens);
    if (!t.background) {
      failures.push(`${mode}: no tokens parsed`);
      continue;
    }
    for (const [name, against, min] of [
      ["foreground", "background", 4.5],
      ["primary", "background", 3],
      ["ring", "background", 3],
      ["primary-foreground", "primary", 4.5],
    ]) {
      const value = t[/** @type {string} */ (name)];
      const base = t[/** @type {string} */ (against)];
      if (!value || !base) continue;
      const r = ratio(value, base);
      if (r < /** @type {number} */ (min)) {
        failures.push(`${mode} --${name} vs --${against} = ${r.toFixed(2)} (needs ${min})`);
      }
    }
  }
  return failures;
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

const work = mkdtempSync(join(tmpdir(), "lu-smoke-"));
console.log(`smoke: workdir ${work} (${dev ? "dev" : "tarball"}${full ? ", full" : ""} mode)`);

try {
  // Always sync first so package copies match the masters
  const sync = runSync("node", [join(pkgDir, "scripts", "sync.mjs")], pkgDir);
  check(sync.ok, "sync.mjs runs");

  /** @type {string[]} */
  let cliCmd;
  if (dev) {
    cliCmd = ["node", join(pkgDir, "bin", "cli.js")];
  } else {
    const pack = runSync("npm", ["pack", "--pack-destination", work], pkgDir);
    check(pack.ok, "npm pack");
    const tarball = readdirSync(work).find((f) => f.endsWith(".tgz"));
    if (!tarball) throw new Error("npm pack produced no tarball");
    // Relative "./x.tgz" is required - npx treats a bare absolute path as an
    // executable and fails with "Permission denied" instead of installing it.
    cliCmd = ["npx", "--yes", `./${tarball}`];
  }

  // Run 1: defaults (baked-in theme)
  const run1 = runSync(
    cliCmd[0],
    [...cliCmd.slice(1), "app-default", "--defaults", "--pm", "npm", "--no-git", "--no-install"],
    work,
  );
  check(run1.ok, "scaffold with --defaults exits 0");
  if (!run1.ok) console.log(run1.output.slice(-1500));

  const app = join(work, "app-default");
  const ds = join(app, "src", "lib", "design-system");

  for (const file of ["index.css", "core.css", "theme.css", "base.css"]) {
    check(existsSync(join(ds, file)), `design-system/${file} exists`);
  }
  for (const file of ["AGENTS.md", "CLAUDE.md", "DESIGN.md", "README.md", "NEXTJS.md"]) {
    check(existsSync(join(app, file)), `${file} exists`);
  }
  check(existsSync(join(app, "public", "larsen-utvikling", "logo.svg")), "logo assets exist");
  check(!existsSync(join(app, "src", "app", "page.module.css")), "page.module.css removed");
  check(!existsSync(join(app, "public", "next.svg")), "branding svgs removed");

  const claudeMd = readFileSync(join(app, "CLAUDE.md"), "utf8");
  check(claudeMd.trim() === "@AGENTS.md", "CLAUDE.md is the @AGENTS.md pointer");

  const globals = readFileSync(join(app, "src", "app", "globals.css"), "utf8");
  check(
    globals.includes('@import "../lib/design-system/index.css";'),
    "globals.css imports the design system",
  );

  const theme = readFileSync(join(ds, "theme.css"), "utf8");
  check(theme.includes("--accent-9:"), "default theme has accent scale");
  check(theme.includes('[data-theme="dark"]'), "default theme has [data-theme] override");
  check(theme.includes("body {"), "default theme has document defaults");
  check(theme.includes("--brand-blue:"), "default theme has brand accents");
  check(theme.includes("monochromatic"), "default theme is monochromatic");

  // Regression guard: an extreme seed used to leave --primary and --ring at
  // the seed color in both modes, so dark mode rendered near-black on
  // near-black (about 1:1 contrast - invisible buttons and focus rings).
  const contrastFailures = checkThemeContrast(theme);
  check(
    contrastFailures.length === 0,
    `default theme contrast (${contrastFailures.join("; ") || "all pairs pass"})`,
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
      "--hex", "4DA0FF",
      "--preset", "shadcn",
      "--format", "hsl-values",
      "--linter", "none",
      "--pm", "npm",
      "--no-git",
      "--no-install",
    ],
    work,
  );
  check(run2.ok, "scaffold with custom palette exits 0");
  const customTheme = readFileSync(
    join(work, "app-custom", "src", "lib", "design-system", "theme.css"),
    "utf8",
  );
  check(customTheme.includes("Seed: #4DA0FF"), "custom theme generated from seed");
  check(customTheme.includes("--accent-9:") && customTheme.includes('[data-theme="dark"]'), "custom theme structure");

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
