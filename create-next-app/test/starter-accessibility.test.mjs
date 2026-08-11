import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const packageDir = fileURLToPath(new URL("..", import.meta.url));
const template = join(packageDir, "template", "src", "app");

test("starter text does not weaken generated contrast with element opacity", () => {
  const css = readFileSync(join(template, "page.css"), "utf8");
  assert.doesNotMatch(css, /opacity:\s*0?\.[0-9]+/);
});

test("the starter link has a 44px target and a token-backed keyboard focus indicator", () => {
  const css = readFileSync(join(template, "page.css"), "utf8");
  assert.match(css, /\.footer-link\s*\{[^}]*min-height:\s*2\.75rem/s);
  assert.match(
    css,
    /\.footer-link:focus-visible\s*\{[^}]*outline:\s*2px solid \{\{C_FOREGROUND\}\}/s,
  );
  assert.match(css, /outline-offset:\s*2px/);
});

test("labelled colour swatches hide the duplicate visual chip from assistive technology", () => {
  const page = readFileSync(join(template, "page.tsx"), "utf8");
  assert.match(page, /className="swatch-chip"\s+aria-hidden="true"/);
});
