import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  EXPECTED_TINT_CORRECTION_DIFFERENCES,
  EXPECTED_SEED_HASH,
  buildSweepSeeds,
  compareTintCorrectedRoles,
} from "../scripts/verify-palette-sweep.mjs";

test("the release sweep has a stable 762-seed corpus", () => {
  const { named, random, edge, all } = buildSweepSeeds();
  assert.equal(named.length, 18);
  assert.equal(random.length, 600);
  assert.equal(edge.length, 144);
  assert.equal(all.length, 762);
  assert.equal(new Set(all).size, 762);

  const hash = createHash("sha256").update(all.join("\n")).digest("hex");
  assert.equal(hash, EXPECTED_SEED_HASH);
  assert.equal(hash, "25104d5316f9bdc8804e726842b8f1950b6bc07531aa026013aff4c1669947a9");
});

test("the release sweep locks exact cross-tint primary and ring differences", () => {
  assert.deepEqual(EXPECTED_TINT_CORRECTION_DIFFERENCES, [
    {
      hex: "#611431",
      mode: "dark",
      token: "primary",
      subtle: "338.7805 56.1644% 28.6275%",
      strong: "339.5745 50.5376% 36.4706%",
    },
    {
      hex: "#611431",
      mode: "dark",
      token: "sidebar-primary",
      subtle: "338.7805 56.1644% 28.6275%",
      strong: "339.5745 50.5376% 36.4706%",
    },
    {
      hex: "#9F46B1",
      mode: "dark",
      token: "ring",
      subtle: "289.9065 43.3198% 48.4314%",
      strong: "290.1099 79.1304% 77.451%",
    },
    {
      hex: "#9F46B1",
      mode: "dark",
      token: "sidebar-ring",
      subtle: "289.9065 43.3198% 48.4314%",
      strong: "290.1099 79.1304% 77.451%",
    },
  ]);

  const css = (light, dark) => `:root { ${light} } @media { :root { ${dark} } }`;
  assert.deepEqual(
    compareTintCorrectedRoles(
      "#123456",
      css(
        "--primary: red; --primary-foreground: black; --sidebar-primary: red; --sidebar-primary-foreground: black; --ring: blue; --sidebar-ring: blue;",
        "--primary: red; --primary-foreground: black; --sidebar-primary: red; --sidebar-primary-foreground: black; --ring: blue; --sidebar-ring: blue;",
      ),
      css(
        "--primary: red; --primary-foreground: white; --sidebar-primary: red; --sidebar-primary-foreground: black; --ring: green; --sidebar-ring: green;",
        "--primary: orange; --primary-foreground: black; --sidebar-primary: orange; --sidebar-primary-foreground: white; --ring: blue; --sidebar-ring: blue;",
      ),
    ),
    [
      { hex: "#123456", mode: "light", token: "primary-foreground", subtle: "black", strong: "white" },
      { hex: "#123456", mode: "light", token: "ring", subtle: "blue", strong: "green" },
      { hex: "#123456", mode: "light", token: "sidebar-ring", subtle: "blue", strong: "green" },
      { hex: "#123456", mode: "dark", token: "primary", subtle: "red", strong: "orange" },
      { hex: "#123456", mode: "dark", token: "sidebar-primary", subtle: "red", strong: "orange" },
      { hex: "#123456", mode: "dark", token: "sidebar-primary-foreground", subtle: "black", strong: "white" },
    ],
  );
});
