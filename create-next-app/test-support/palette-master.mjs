import { cpSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = join(packageDir, "..");
const sourceDir = join(repoRoot, "palette");

export async function createPaletteMasterFixture() {
  const root = mkdtempSync(join(tmpdir(), "lu-palette-master-"));
  const paletteDir = join(root, "palette");
  symlinkSync(join(packageDir, "node_modules"), join(root, "node_modules"), "dir");
  cpSync(sourceDir, paletteDir, {
    recursive: true,
    filter: (source) => !source.endsWith(".DS_Store"),
  });

  try {
    const index = join(paletteDir, "index.js");
    const api = await import(pathToFileURL(index).href);
    return {
      api,
      sourceIndex: join(sourceDir, "index.js"),
      cleanup: () => rmSync(root, { recursive: true, force: true }),
    };
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}
