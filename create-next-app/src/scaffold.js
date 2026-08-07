// @ts-check

/**
 * The ONLY file that knows about create-next-app.
 *
 * Spawns `npx create-next-app@<version>` non-interactively. Every locked
 * decision is an explicit flag; the trailing --yes makes any future prompt
 * fall back to defaults, and the closed stdin (see run.js) guarantees an
 * unexpected prompt errors out instead of hanging.
 */

import { run } from "./run.js";

const LINTER_FLAGS = {
  eslint: "--eslint",
  biome: "--biome",
  none: "--no-linter",
};

/**
 * @param {{ name: string, linter?: keyof typeof LINTER_FLAGS, cnaVersion?: string }} config
 * @returns {string[]}
 */
export function cnaArgs({ name, linter = "eslint", cnaVersion = "latest" }) {
  return [
    "--yes", // npx's own --yes: skip "Ok to proceed?" install prompt
    `create-next-app@${cnaVersion}`,
    name,
    "--ts",
    "--app",
    "--src-dir",
    "--no-tailwind",
    LINTER_FLAGS[linter] ?? "--eslint",
    "--import-alias",
    "@/*",
    "--skip-install",
    "--disable-git",
    "--yes", // create-next-app's --yes: defaults for anything unlisted
  ];
}

/**
 * @param {{ name: string, linter?: "eslint" | "biome" | "none", cnaVersion?: string }} config
 * @param {{ cwd: string }} opts
 */
export function scaffold(config, { cwd }) {
  return run("npx", cnaArgs(config), {
    cwd,
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  });
}
