// @ts-check

export const PACKAGE_MANAGER_CONTRACT = Object.freeze([
  Object.freeze({ name: "npm", run: "npm run", lockfiles: Object.freeze(["package-lock.json"]) }),
  Object.freeze({ name: "pnpm", run: "pnpm", lockfiles: Object.freeze(["pnpm-lock.yaml"]) }),
  Object.freeze({ name: "yarn", run: "yarn", lockfiles: Object.freeze(["yarn.lock"]) }),
  Object.freeze({
    name: "bun",
    run: "bun run",
    lockfiles: Object.freeze(["bun.lock", "bun.lockb"]),
  }),
]);

/** @param {string} name */
export function packageManagerByName(name) {
  const manager = PACKAGE_MANAGER_CONTRACT.find((entry) => entry.name === name);
  if (!manager) throw new Error(`Unsupported package manager: ${name}`);
  return manager;
}
