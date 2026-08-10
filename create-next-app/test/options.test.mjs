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
import { OPTION_CONTRACT, serializeTsxText } from "../src/options.js";

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
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const args = process.argv.slice(2);
if (args.includes("skills") && args.includes("add")) {
  const source = args[args.indexOf("add") + 1];
  if (process.env.LU_SKILLS_INVOCATION_LOG) {
    appendFileSync(process.env.LU_SKILLS_INVOCATION_LOG, source + "\\n");
  }
  if (process.env.LU_FAIL_SKILLS_REPO === source) process.exit(9);
  if (process.env.LU_SKIP_SKILLS_REPO === source) process.exit(0);
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

function runCli(args, { failSkillsRepo, skipSkillsRepo } = {}) {
  const root = mkdtempSync(join(tmpdir(), "lu-options-test-"));
  const bin = createControlledCommands(root);
  const skillsInvocationLog = join(root, "skills-invocations.log");
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${bin}${delimiter}${process.env.PATH ?? ""}`,
      LU_SKILLS_INVOCATION_LOG: skillsInvocationLog,
      ...(failSkillsRepo ? { LU_FAIL_SKILLS_REPO: failSkillsRepo } : {}),
      ...(skipSkillsRepo ? { LU_SKIP_SKILLS_REPO: skipSkillsRepo } : {}),
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    root,
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
    skillsInvocationLog,
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

test("the radix preset is presented as a Radix Themes custom-palette contract", () => {
  const preset = OPTION_CONTRACT.find((option) => option.name === "preset");
  const radix = preset?.choices.find((choice) => choice.value === "radix");
  assert.deepEqual(radix, {
    value: "radix",
    label: "Radix Themes custom-palette tokens",
    hint: "57 override names + 26 Larsen tokens",
  });
});

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
    "--neutral-tint",
    "strong",
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
  ["--skills", "--no-skills"],
  ["--git", "--no-git"],
  ["--install", "--no-install"],
]) {
  test(`rejects contradictory ${left} and ${right}`, () => {
    const args = left === "--skills"
      ? ["conflict-app", left, "unknown", right]
      : ["conflict-app", left, right];
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

test("rejects extra positional app names before scaffolding", () => {
  const run = runCli(["first-app", "second-app", "--defaults"]);
  try {
    assert.equal(run.status, 1, run.output);
    assert.match(run.output, /Expected at most one app name/);
  } finally {
    run.cleanup();
  }
});

const stringOptions = [
  "hex",
  "preset",
  "format",
  "neutral-tint",
  "pm",
  "linter",
  "skills",
  "cna-version",
];

test("empty-value coverage names every string option in OPTION_CONTRACT", () => {
  assert.deepEqual(
    OPTION_CONTRACT.filter((option) => option.type === "string").map((option) => option.name),
    stringOptions,
  );
});

for (const option of stringOptions) {
  test(`rejects an explicitly empty --${option} value`, () => {
    const run = runCli(["empty-value-app", "--defaults", `--${option}=`]);
    try {
      assert.equal(run.status, 1, run.output);
      assert.match(run.output, new RegExp(`--${option} requires a non-empty value`));
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
  ["--neutral-tint", "strong"],
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
    "--neutral-tint",
    "strong",
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

test("rejects the removed --scheme flag", () => {
  const run = runCli([
    "legacy-scheme",
    "--defaults",
    "--hex",
    "4DA0FF",
    "--scheme",
    "analogous",
  ]);
  try {
    assert.equal(run.status, 1, run.output);
    assert.match(run.output, /Unknown option '--scheme'/);
    // The removed flag names its replacement rather than only failing.
    assert.match(run.output, /--scheme was removed in 0\.5\.0/);
    assert.match(run.output, /--neutral-tint <subtle\|strong>/);
    // A user error is reported as one, not as an uncaught throw.
    assert.doesNotMatch(run.output, /ERR_PARSE_ARGS_UNKNOWN_OPTION/);
  } finally {
    run.cleanup();
  }
});

test("reports an unknown flag without a stack trace and without a removal hint", () => {
  const run = runCli(["unknown-flag", "--defaults", "--bogus"]);
  try {
    assert.equal(run.status, 1, run.output);
    assert.match(run.output, /Unknown option '--bogus'/);
    assert.match(run.output, /Run with --help for the full option list\./);
    assert.doesNotMatch(run.output, /was removed in/);
    assert.doesNotMatch(run.output, /ERR_PARSE_ARGS_UNKNOWN_OPTION/);
  } finally {
    run.cleanup();
  }
});

test("rejects a missing --neutral-tint value", () => {
  const run = runCli(["missing-neutral-tint", "--defaults", "--hex", "4DA0FF", "--neutral-tint"]);
  try {
    assert.equal(run.status, 1, run.output);
    assert.match(run.output, /Option '--neutral-tint <value>' argument missing/);
  } finally {
    run.cleanup();
  }
});

test("rejects an unknown --neutral-tint value", () => {
  const run = runCli([
    "invalid-neutral-tint",
    "--defaults",
    "--hex",
    "4DA0FF",
    "--neutral-tint",
    "vivid",
  ]);
  try {
    assert.equal(run.status, 1, run.output);
    assert.match(run.output, /Unknown --neutral-tint "vivid" \(expected subtle \| strong\)/);
  } finally {
    run.cleanup();
  }
});

test("a create-next-app range spec is serialized as TSX text instead of JSX markup", () => {
  const spec = ">=16 <17";
  const run = runCli([
    "range-spec-app",
    "--defaults",
    "--no-git",
    "--no-install",
    "--cna-version",
    spec,
  ]);
  try {
    assert.equal(run.status, 0, run.output);
    const page = readFileSync(join(run.root, "range-spec-app", "src", "app", "page.tsx"), "utf8");
    const serialized = page.match(/A clean Next\.js start: \{ ("[^"]+") \}, App Router/)?.[1];
    assert.ok(serialized, page);
    assert.equal(JSON.parse(serialized), `the wrapper requested create-next-app@${spec}`);
    assert.match(serialized, /\\u003e=16 \\u003c17/);
    assert.doesNotMatch(page, /start: the wrapper requested create-next-app@>=16 <17/);
  } finally {
    run.cleanup();
  }
});

test("TSX text serialization cannot close the expression or inject markup", () => {
  const attemptedInjection = `next\" }<Injected value={1} />{"`;
  const serialized = serializeTsxText(attemptedInjection);
  assert.equal(JSON.parse(serialized), attemptedInjection);
  assert.doesNotMatch(serialized, /[<>&]/);
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

Sources stay with their authors:

- [Larsen Skills by Stian Larsen](https://github.com/Stianlars1/larsen-skills)

This verifies only the listed files, not agent-specific discovery or symlinks.
Add or update them from those same repositories:

- \`npx skills add Stianlars1/larsen-skills\``,
    );
    // A Larsen-only project does not advertise a third-party source.
    assert.doesNotMatch(
      agents.slice(agents.indexOf("## Installed skills")),
      /transitions\.dev|transitions-dev/i,
    );
  } finally {
    run.cleanup();
  }
});

test("mixed skill sources use one installer invocation per repository", () => {
  const run = runCli([
    "mixed-skills-app",
    "--defaults",
    "--skills",
    "motion-craft,transitions-dev,interface-craft",
    "--no-git",
    "--no-install",
  ]);
  try {
    assert.equal(run.status, 0, run.output);
    assert.deepEqual(
      readFileSync(run.skillsInvocationLog, "utf8").trim().split("\n"),
      ["Stianlars1/larsen-skills", "Jakubantalik/transitions.dev"],
    );
    const agents = readFileSync(join(run.root, "mixed-skills-app", "AGENTS.md"), "utf8");
    assert.match(agents, /\.agents\/skills\/motion-craft\/SKILL\.md/);
    assert.match(agents, /\.agents\/skills\/interface-craft\/SKILL\.md/);
    assert.match(agents, /\.agents\/skills\/transitions-dev\/SKILL\.md/);
    assert.match(agents, /Transitions\.dev by Jakub Antalik/);
  } finally {
    run.cleanup();
  }
});

test("a failed third-party source does not break successful Larsen skills", () => {
  const run = runCli(
    [
      "partial-skills-app",
      "--defaults",
      "--skills",
      "motion-craft,transitions-dev",
      "--no-git",
      "--no-install",
    ],
    { failSkillsRepo: "Jakubantalik/transitions.dev" },
  );
  try {
    assert.equal(run.status, 0, run.output);
    assert.match(run.output, /Transitions\.dev install from Jakubantalik\/transitions\.dev failed/);
    const agents = readFileSync(join(run.root, "partial-skills-app", "AGENTS.md"), "utf8");
    assert.match(agents, /\.agents\/skills\/motion-craft\/SKILL\.md/);
    assert.doesNotMatch(agents, /\.agents\/skills\/transitions-dev\/SKILL\.md/);
  } finally {
    run.cleanup();
  }
});

test("a successful exit that installs nothing is not documented", () => {
  const run = runCli(
    [
      "empty-source-app",
      "--defaults",
      "--skills",
      "motion-craft,transitions-dev",
      "--no-git",
      "--no-install",
    ],
    { skipSkillsRepo: "Jakubantalik/transitions.dev" },
  );
  try {
    assert.equal(run.status, 0, run.output);
    assert.match(run.output, /installer exited without creating: transitions-dev/);
    const agents = readFileSync(join(run.root, "empty-source-app", "AGENTS.md"), "utf8");
    assert.match(agents, /\.agents\/skills\/motion-craft\/SKILL\.md/);
    assert.doesNotMatch(agents, /\.agents\/skills\/transitions-dev\/SKILL\.md/);
  } finally {
    run.cleanup();
  }
});

test("--skills all remains the nine Larsen skills", () => {
  const run = runCli([
    "all-skills-app",
    "--defaults",
    "--skills",
    "all",
    "--no-git",
    "--no-install",
  ]);
  try {
    assert.equal(run.status, 0, run.output);
    assert.deepEqual(
      readFileSync(run.skillsInvocationLog, "utf8").trim().split("\n"),
      ["Stianlars1/larsen-skills"],
    );
    const agents = readFileSync(join(run.root, "all-skills-app", "AGENTS.md"), "utf8");
    assert.doesNotMatch(agents, /\.agents\/skills\/transitions-dev\/SKILL\.md/);
  } finally {
    run.cleanup();
  }
});
