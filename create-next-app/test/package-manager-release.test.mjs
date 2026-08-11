import assert from "node:assert/strict";
import test from "node:test";

import {
  PACKAGE_MANAGER_CONTRACT,
  packageManagerByName,
} from "../src/package-managers.js";

test("release coverage names every supported package manager and its generated commands", () => {
  assert.deepEqual(PACKAGE_MANAGER_CONTRACT, [
    { name: "npm", run: "npm run", lockfiles: ["package-lock.json"] },
    { name: "pnpm", run: "pnpm", lockfiles: ["pnpm-lock.yaml"] },
    { name: "yarn", run: "yarn", lockfiles: ["yarn.lock"] },
    { name: "bun", run: "bun run", lockfiles: ["bun.lock", "bun.lockb"] },
  ]);
  for (const manager of PACKAGE_MANAGER_CONTRACT) {
    assert.equal(packageManagerByName(manager.name), manager);
  }
});

test("an unknown package manager cannot silently enter the release matrix", () => {
  assert.throws(() => packageManagerByName("unknown"), /Unsupported package manager: unknown/);
});
