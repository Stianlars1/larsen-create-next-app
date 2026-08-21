import assert from "node:assert/strict";
import * as RadixColors from "@radix-ui/colors";
import { after, test } from "node:test";
import { createPaletteMasterFixture } from "../test-support/palette-master.mjs";

const fixture = await createPaletteMasterFixture();
after(fixture.cleanup);

function tokens(css, mode) {
  const from = mode === "light" ? ":root {" : "@media";
  const to = mode === "light" ? "@media" : '[data-theme="light"]';
  const segment = css.slice(css.indexOf(from), css.indexOf(to, css.indexOf(from) + 1));
  return Object.fromEntries(
    [...segment.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2]]),
  );
}

const cases = [
  ["#E11D48", { success: "jade", danger: "red", warning: "orange", info: "cyan" }],
  ["#EFB100", { success: "grass", danger: "tomato", warning: "amber", info: "sky" }],
  ["#006045", { success: "jade", danger: "tomato", warning: "orange", info: "cyan" }],
  ["#4DA0FF", { success: "jade", danger: "crimson", warning: "orange", info: "blue" }],
  ["#A1A1A1", { success: "green", danger: "red", warning: "amber", info: "blue" }],
];

test("allowed semantic scales keep a stable sRGB step 9 across appearances", () => {
  for (const scale of [
    "jade", "green", "grass", "tomato", "red", "ruby", "crimson",
    "amber", "orange", "sky", "blue", "cyan",
  ]) {
    assert.equal(RadixColors[scale][`${scale}9`], RadixColors[`${scale}Dark`][`${scale}9`]);
  }
});

for (const [hex, selected] of cases) {
  test(`${hex} keeps every semantic role inside its curated family`, () => {
    const css = fixture.api.generateThemeCss({ hex, preset: "shadcn", format: "hex" });
    for (const mode of ["light", "dark"]) {
      const values = tokens(css, mode);
      for (const [role, scale] of Object.entries(selected)) {
        const source = mode === "light" ? RadixColors[scale] : RadixColors[`${scale}Dark`];
        assert.equal(values[role], source[`${scale}9`]);
        assert.equal(values[`${role}-muted`], source[`${scale}3`]);
        assert.equal(values[`${role}-border`], source[`${scale}7`]);
      }
    }
  });
}

test("semantic aliases retain every existing shadcn status token", () => {
  const css = fixture.api.generateThemeCss({ hex: "#4DA0FF", preset: "shadcn", format: "hex" });
  const expected = [
    "success",
    "danger",
    "warning",
    "info",
  ];

  for (const mode of ["light", "dark"]) {
    const values = tokens(css, mode);
    for (const role of expected) {
      assert.ok(values[role], `${mode} --${role} is missing`);
      assert.ok(values[`${role}-foreground`], `${mode} --${role}-foreground is missing`);
      assert.ok(values[`${role}-muted`], `${mode} --${role}-muted is missing`);
      assert.ok(values[`${role}-muted-foreground`], `${mode} --${role}-muted-foreground is missing`);
      assert.ok(values[`${role}-border`], `${mode} --${role}-border is missing`);
    }
    assert.ok(values.destructive, `${mode} --destructive is missing`);
    assert.ok(values["destructive-foreground"], `${mode} --destructive-foreground is missing`);
    assert.equal(values.destructive, values.danger);
    assert.equal(values["destructive-foreground"], values["danger-foreground"]);
  }
});
