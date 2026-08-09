import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const packageDir = fileURLToPath(new URL("..", import.meta.url));
const cli = join(packageDir, "bin", "cli.js");

function writeExecutable(path, source) {
  writeFileSync(path, source);
  chmodSync(path, 0o755);
}

function createControlledCommands(root) {
  const bin = join(root, "bin");
  mkdirSync(bin);

  writeExecutable(
    join(bin, "npx"),
    `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const args = process.argv.slice(2);
if (args.includes("skills") && args.includes("add")) {
  for (let index = 0; index < args.length; index++) {
    if (args[index] !== "--skill" || !args[index + 1]) continue;
    const skillDir = join(process.cwd(), ".agents", "skills", args[index + 1]);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "SKILL.md"), "# Installed skill\\n");
  }
  process.exit(0);
}
const specIndex = args.findIndex((arg) => arg.startsWith("create-next-app@"));
if (specIndex === -1 || !args[specIndex + 1]) process.exit(2);
const appDir = join(process.cwd(), args[specIndex + 1]);
mkdirSync(join(appDir, "src", "app"), { recursive: true });
mkdirSync(join(appDir, "public"), { recursive: true });
writeFileSync(join(appDir, "package.json"), JSON.stringify({ name: args[specIndex + 1] }));
writeFileSync(join(appDir, "AGENTS.md"), "Next.js guidance\\n");
writeFileSync(join(appDir, "src", "app", "globals.css"), "/* upstream */\\n");
writeFileSync(join(appDir, "src", "app", "page.module.css"), "/* upstream */\\n");
`,
  );
  writeExecutable(join(bin, "npm"), "#!/bin/sh\nexit 0\n");
  writeExecutable(join(bin, "git"), "#!/bin/sh\nexit 0\n");
  return bin;
}

function runCli(args) {
  const root = mkdtempSync(join(tmpdir(), "lu-options-test-"));
  const bin = createControlledCommands(root);
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ""}` },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    root,
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

const explicitBase = [
  "--linter",
  "eslint",
  "--no-skills",
  "--pm",
  "npm",
  "--no-git",
  "--no-install",
];

test("help exposes every explicit yes and no flag", () => {
  const result = spawnSync(process.execPath, [cli, "--help"], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /--default-palette/);
  assert.match(result.stdout, /--git\b/);
  assert.match(result.stdout, /--no-git\b/);
  assert.match(result.stdout, /--install\b/);
  assert.match(result.stdout, /--no-install\b/);
});

test("closed stdin accepts explicit default palette, git, and install answers", () => {
  const run = runCli([
    "app-positive",
    "--default-palette",
    "--linter",
    "eslint",
    "--no-skills",
    "--pm",
    "npm",
    "--git",
    "--install",
    "--cna-version",
    "14.2.0",
  ]);
  try {
    assert.equal(run.status, 0, run.output);
    assert.match(run.output, /Next\.js scaffolded - requested create-next-app@14\.2\.0/);
    const readme = readFileSync(join(run.root, "app-positive", "README.md"), "utf8");
    const page = readFileSync(join(run.root, "app-positive", "src", "app", "page.tsx"), "utf8");
    assert.match(readme, /create-next-app@14\.2\.0/);
    assert.doesNotMatch(readme, /newest stable/);
    assert.match(page, /create-next-app@14\.2\.0/);
    assert.doesNotMatch(page, /newest stable/);
  } finally {
    run.cleanup();
  }
});

test("latest wording states only that the mutable dist-tag was requested", () => {
  const run = runCli(["app-latest", "--defaults", "--no-git", "--no-install"]);
  try {
    assert.equal(run.status, 0, run.output);
    assert.match(run.output, /requested create-next-app@latest/);
    assert.doesNotMatch(run.output, /newest|stable/i);
    const readme = readFileSync(join(run.root, "app-latest", "README.md"), "utf8");
    const page = readFileSync(join(run.root, "app-latest", "src", "app", "page.tsx"), "utf8");
    for (const generated of [readme, page]) {
      assert.match(generated, /create-next-app@latest/);
      assert.doesNotMatch(generated, /newest|stable/i);
    }
  } finally {
    run.cleanup();
  }
});

test("closed stdin accepts explicit custom palette, no-git, and no-install answers", () => {
  const run = runCli([
    "app-negative",
    "--hex",
    "4DA0FF",
    "--preset",
    "shadcn",
    "--format",
    "hsl-values",
    "--scheme",
    "analogous",
    ...explicitBase,
  ]);
  try {
    assert.equal(run.status, 0, run.output);
  } finally {
    run.cleanup();
  }
});

for (const [left, right] of [
  ["--default-palette", "--hex"],
  ["--git", "--no-git"],
  ["--install", "--no-install"],
]) {
  test(`rejects contradictory ${left} and ${right}`, () => {
    const args = ["conflict-app", left, right];
    if (right === "--hex") args.push("4DA0FF");
    const run = runCli([...args, "--defaults"]);
    try {
      assert.equal(run.status, 1, run.output);
      assert.match(run.output, new RegExp(`${left} cannot be combined with ${right}`));
    } finally {
      run.cleanup();
    }
  });
}

test("--default-palette conflicts with an explicitly empty --hex value", () => {
  const run = runCli(["empty-hex-conflict", "--defaults", "--default-palette", "--hex="]);
  try {
    assert.equal(run.status, 1, run.output);
    assert.match(run.output, /--default-palette cannot be combined with --hex/);
  } finally {
    run.cleanup();
  }
});

for (const [flag, value] of [
  ["--preset", "shadcn"],
  ["--format", "hsl-values"],
  ["--scheme", "analogous"],
]) {
  test(`${flag} requires --hex instead of being ignored`, () => {
    const run = runCli(["modifier-app", "--defaults", flag, value]);
    try {
      assert.equal(run.status, 1, run.output);
      assert.match(run.output, new RegExp(`${flag} requires --hex`));
    } finally {
      run.cleanup();
    }
  });
}

test("--defaults remains shorthand and accepts valid explicit overrides", () => {
  const run = runCli([
    "defaults-override",
    "--defaults",
    "--hex",
    "4DA0FF",
    "--preset",
    "radix",
    "--format",
    "hex",
    "--scheme",
    "triadic",
    "--linter",
    "none",
    "--pm",
    "npm",
    "--no-git",
    "--no-install",
  ]);
  try {
    assert.equal(run.status, 0, run.output);
    const agents = readFileSync(join(run.root, "defaults-override", "AGENTS.md"), "utf8");
    assert.doesNotMatch(agents, /## Installed skills/);
  } finally {
    run.cleanup();
  }
});

test("AGENTS.md documents exactly the skills that landed", () => {
  const run = runCli([
    "skills-app",
    "--defaults",
    "--skills",
    "motion-craft,interface-craft",
    "--no-git",
    "--no-install",
  ]);
  try {
    assert.equal(run.status, 0, run.output);
    const agents = readFileSync(join(run.root, "skills-app", "AGENTS.md"), "utf8");
    assert.equal(
      agents.slice(agents.indexOf("## Installed skills")).trimEnd(),
      `## Installed skills

The wrapper verified these files on disk:

- \`.agents/skills/motion-craft/SKILL.md\`
- \`.agents/skills/interface-craft/SKILL.md\`

This verifies only the listed files, not agent-specific discovery or symlinks.
Add more with \`npx skills add Stianlars1/larsen-skills\`.`,
    );
  } finally {
    run.cleanup();
  }
});
