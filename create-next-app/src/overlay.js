// @ts-check

/**
 * Applies the Larsen Utvikling template on top of a fresh create-next-app
 * output:
 *
 *   1. preserves create-next-app's AGENTS.md as NEXTJS.md (Next.js agent guide)
 *   2. copies every template file, substituting {{VAR}} placeholders in text
 *      files and renaming a leading "_" to "." (npm never packs .gitignore-like
 *      dotfiles inside packages)
 *   3. writes unmodified generated artifacts and separate consumer styling
 *   4. removes superseded create-next-app files (tolerant of upstream drift)
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join } from "node:path";

const TEXT_EXT = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".css",
  ".json",
  ".txt",
  ".mjs",
  ".js",
]);

const REMOVE = [
  "src/app/page.module.css",
  "public/next.svg",
  "public/vercel.svg",
  "public/file.svg",
  "public/globe.svg",
  "public/window.svg",
];

/**
 * @param {object} opts
 * @param {string} opts.templateDir - absolute path to the template folder
 * @param {string} opts.appDir - absolute path to the scaffolded app
 * @param {Record<string, string>} opts.vars - {{VAR}} substitutions
 * @param {Array<{fileName: string, text: string}>} [opts.themeArtifacts]
 * @param {object} [opts.themeManifest]
 * @param {string} [opts.documentCss]
 */
export function overlay({
  templateDir,
  appDir,
  vars,
  themeArtifacts,
  themeManifest,
  documentCss,
}) {
  const cnaAgents = join(appDir, "AGENTS.md");
  if (existsSync(cnaAgents)) {
    rmSync(join(appDir, "NEXTJS.md"), { force: true });
    renameSync(cnaAgents, join(appDir, "NEXTJS.md"));
  }

  for (const rel of walk(templateDir)) {
    const destRel = rel.replace(/(^|\/)_(?=[^/]*$)/, "$1.");
    const src = join(templateDir, rel);
    const dest = join(appDir, destRel);
    mkdirSync(dirname(dest), { recursive: true });
    if (TEXT_EXT.has(extname(rel))) {
      let content = readFileSync(src, "utf8");
      for (const [key, value] of Object.entries(vars)) {
        content = content.replaceAll(`{{${key}}}`, value);
      }
      writeFileSync(dest, content);
    } else {
      copyFileSync(src, dest);
    }
  }

  const designDir = join(appDir, "src", "lib", "design-system");
  if (themeArtifacts) {
    for (const artifact of themeArtifacts) {
      if (!/^[a-zA-Z0-9.-]+$/.test(artifact.fileName))
        throw new Error("Unsafe artifact filename");
      writeFileSync(join(designDir, artifact.fileName), artifact.text);
    }
    writeFileSync(
      join(designDir, "theme.manifest.json"),
      JSON.stringify(themeManifest, null, 2) + "\n",
    );
  }
  if (documentCss) writeFileSync(join(designDir, "document.css"), documentCss);

  for (const rel of REMOVE) {
    rmSync(join(appDir, rel), { force: true });
  }
}

/**
 * @param {string} dir
 * @param {string} [prefix]
 * @returns {string[]} relative file paths, .DS_Store excluded
 */
function walk(dir, prefix = "") {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...walk(join(dir, entry.name), rel));
    } else {
      files.push(rel);
    }
  }
  return files;
}
