// @ts-check

/**
 * Applies the Larsen Utvikling template on top of a fresh create-next-app
 * output:
 *
 *   1. preserves create-next-app's AGENTS.md as NEXTJS.md (Next.js agent guide)
 *   2. copies every template file, substituting {{VAR}} placeholders in text
 *      files and renaming a leading "_" to "." (npm never packs .gitignore-like
 *      dotfiles inside packages)
 *   3. optionally writes a generated theme.css (custom palette runs)
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

const TEXT_EXT = new Set([".md", ".ts", ".tsx", ".css", ".json", ".txt", ".mjs", ".js"]);

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
 * @param {string} [opts.themeCss] - generated theme.css content; when omitted
 *   the synced default theme from the template is kept
 */
export function overlay({ templateDir, appDir, vars, themeCss }) {
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

  if (themeCss) {
    writeFileSync(join(appDir, "src", "lib", "design-system", "theme.css"), themeCss);
  }

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
