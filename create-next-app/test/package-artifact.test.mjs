import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const packageDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = join(packageDir, "..");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `${command} ${args.join(" ")}\n${result.stdout}${result.stderr}`);
  return result.stdout.trim();
}

function releaseFixture() {
  const root = mkdtempSync(join(tmpdir(), "lu-release-fixture-"));
  const fixtureRoot = join(root, "repo");
  cpSync(repoRoot, fixtureRoot, {
    recursive: true,
    filter: (source) => {
      const rel = relative(repoRoot, source);
      if (rel === "") return true;
      const first = rel.split(sep)[0];
      return first !== ".git" && first !== "node_modules" && first !== ".superpowers" &&
        !source.endsWith(".tgz");
    },
  });
  const fixtureManifestPath = join(fixtureRoot, "create-next-app", "package.json");
  const fixtureManifest = JSON.parse(readFileSync(fixtureManifestPath, "utf8"));
  const currentMajor = Number.parseInt(fixtureManifest.version.split(".")[0], 10);
  fixtureManifest.version = `${currentMajor + 1}.0.${Date.now()}`;
  writeFileSync(fixtureManifestPath, `${JSON.stringify(fixtureManifest, null, 2)}\n`);
  run("git", ["init", "-q"], fixtureRoot);
  run("git", ["config", "user.name", "Release Test"], fixtureRoot);
  run("git", ["config", "user.email", "release-test@example.invalid"], fixtureRoot);
  run("git", ["add", "-A"], fixtureRoot);
  run("git", ["commit", "-qm", "release fixture"], fixtureRoot);
  const head = run("git", ["rev-parse", "HEAD"], fixtureRoot);
  return {
    root,
    repoRoot: fixtureRoot,
    packageDir: join(fixtureRoot, "create-next-app"),
    head,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

test("release packing preserves maintainer metadata and removes dead scripts from the artifact", () => {
  const fixture = releaseFixture();
  const outputDir = join(fixture.root, "output");
  mkdirSync(outputDir);
  const sourceBefore = readFileSync(join(fixture.packageDir, "package.json"), "utf8");
  const sourceManifest = JSON.parse(sourceBefore);
  try {
    appendFileSync(
      join(fixture.repoRoot, "docs", "verification", "local-0.3.0.md"),
      "\nPost-pack evidence is outside release source.\n",
    );
    const result = spawnSync(
      process.execPath,
      ["scripts/pack-release.mjs", "--pack-destination", outputDir],
      {
        cwd: fixture.packageDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);

    const tarball = result.stdout.trim().split("\n").at(-1);
    assert.ok(tarball?.startsWith(`${outputDir}/`), result.stdout);
    const manifestResult = spawnSync(
      "tar",
      ["-xOf", tarball, "package/package.json"],
      { encoding: "utf8" },
    );
    assert.equal(manifestResult.status, 0, manifestResult.stderr);
    const manifest = JSON.parse(manifestResult.stdout);
    assert.equal(manifest.scripts, undefined);
    assert.equal(manifest.gitHead, fixture.head);
    assert.equal(manifest.bin["create-next-app"], "bin/cli.js");
    const entriesResult = spawnSync("tar", ["-tf", tarball], { encoding: "utf8" });
    assert.equal(entriesResult.status, 0, entriesResult.stderr);
    assert.doesNotMatch(entriesResult.stdout, /^package\/(?:scripts|test|test-support)\//m);
    assert.equal(readFileSync(join(fixture.packageDir, "package.json"), "utf8"), sourceBefore);
    const artifactStem = sourceManifest.name.replace(/^@/, "").replace("/", "-");
    const expectedName = `${artifactStem}-${sourceManifest.version}.tgz`;
    assert.equal(basename(tarball), expectedName);

    const publishDryRun = spawnSync(
      "npm",
      ["publish", "--dry-run", "--ignore-scripts=false", tarball],
      {
        cwd: outputDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    assert.equal(
      publishDryRun.status,
      0,
      `the staged consumer tarball must remain publication-safe\n${publishDryRun.stdout}${publishDryRun.stderr}`,
    );
    const manifestAfterDryRun = JSON.parse(
      spawnSync("tar", ["-xOf", tarball, "package/package.json"], { encoding: "utf8" }).stdout,
    );
    assert.equal(manifestAfterDryRun.gitHead, fixture.head);
  } finally {
    fixture.cleanup();
  }
});

for (const [label, dirty] of [
  ["tracked", (fixture) => appendFileSync(join(fixture.packageDir, "src", "options.js"), "\n")],
  [
    "untracked",
    (fixture) => writeFileSync(join(fixture.packageDir, "src", "untracked-release-source.js"), "\n"),
  ],
  [
    "published release evidence",
    (fixture) => appendFileSync(
      join(fixture.repoRoot, "docs", "verification", "releases.md"),
      "\nUncommitted registry claim.\n",
    ),
  ],
]) {
  test(`release packing rejects ${label} without touching the real checkout`, () => {
    const realStatusBefore = run(
      "git",
      ["status", "--porcelain=v1", "--untracked-files=all"],
      repoRoot,
    );
    const fixture = releaseFixture();
    const outputDir = join(fixture.root, "output");
    mkdirSync(outputDir);
    try {
      dirty(fixture);
      const result = spawnSync(
        process.execPath,
        ["scripts/pack-release.mjs", "--pack-destination", outputDir],
        {
          cwd: fixture.packageDir,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
      assert.match(result.stderr, /release-relevant source is dirty/i);
      assert.equal(
        run("git", ["status", "--porcelain=v1", "--untracked-files=all"], repoRoot),
        realStatusBefore,
      );
    } finally {
      fixture.cleanup();
    }
  });
}

test("source-directory publication is refused in favor of the verified tarball", () => {
  const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
  assert.equal(manifest.scripts.prepublishOnly, "node scripts/refuse-source-publish.mjs");

  const result = spawnSync("npm", ["publish", "--dry-run", "--ignore-scripts=false"], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Run npm run pack:release, then publish the reported tarball path/);
});
