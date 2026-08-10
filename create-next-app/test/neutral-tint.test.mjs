import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, test } from "node:test";
import { createPaletteMasterFixture } from "../test-support/palette-master.mjs";

const fixture = await createPaletteMasterFixture();
after(fixture.cleanup);

const BASELINE_HASHES = new Map([
  ["subtle|shadcn|hex", "e28c18551573adf503096c997855d46551302fab2e15f6747542326eb26c7109"],
  ["subtle|shadcn|rgb", "e2b390b0087dd91565ab1f0fd31d8b409317b45cccced97b0169d1572cae6149"],
  ["subtle|shadcn|hsl", "7f516b5a8f182cdfea588c47803c19fc9d040825ef6c6c99210df4ac5e46c7c8"],
  ["subtle|shadcn|hsl-values", "7e9a06db2a8285d278d0fa5effb433a4b7f6ca5210fb760fde94d4410db6bbab"],
  ["subtle|shadcn|oklab", "265ecd51305b635d5eefa1c17ffe5a1c90921f4c97c89403731b3a34655c0376"],
  ["subtle|shadcn|oklch", "1f1b5a734d338635a3769f4f66b31f86e284ff57ec889697506bc5c95e3c856d"],
  ["subtle|radix|hex", "d6fdafadc39517dd670708cc72a5535e87c95e42017b9dd6e68444ba782ba878"],
  ["subtle|radix|rgb", "1b4be2530e3601f0bcebb7f462e06cbe72c67651ade3e260cd8404e6c356ca33"],
  ["subtle|radix|hsl", "08ac776728e3821c4c493bb6e02d3072d7e040d16f66ed4e4770ecbf193b629e"],
  ["subtle|radix|hsl-values", "c2d00e94471037b5b271ce6bae5b3b98e4745b34b7d2a38d6e58353743cfad33"],
  ["subtle|radix|oklab", "8c62cb1824c2813be3816048c6f46bb9f7df7717bfd5f25aba67444c950a010f"],
  ["subtle|radix|oklch", "1b9768780448317697a390d30df2788bc561a3d5c007ef7f939468f414b9f98d"],
  ["subtle|css-variables|hex", "f56604cb87a1494f2939be406bbf31ef3ba4ae133f9ef6c7503aea6720547075"],
  ["subtle|css-variables|rgb", "f574ed5fa66e042dc4be247865a0d58030b4737431dc94bc95b0dda95b910e8a"],
  ["subtle|css-variables|hsl", "aefbf429916647c6d7fe213d5499a33bbee3f1ff9695147dfbba51bb794361ce"],
  ["subtle|css-variables|hsl-values", "0225e07bda0f4584db7ad6106f59ed27b8d875dadc75e99b12243a8697b70e40"],
  ["subtle|css-variables|oklab", "3609541742299f0c9a91d9fb90442d0df0bfc5a214f05efdf181385eaa2ffd0b"],
  ["subtle|css-variables|oklch", "9e1deeeb1d1d1896d8c5e5d1f4e640ae6e033f9993309ed6fbbf57ccb38a5192"],
  ["strong|shadcn|hex", "261b46dae436ecaaa8dfef42d8fdaf0d5d4e443546805c8a996557938ac3ed8f"],
  ["strong|shadcn|rgb", "b9b58028f53aa74be4495542ec93175b034ffbfb611092072e7b02af3e0be939"],
  ["strong|shadcn|hsl", "4573bc0c8e21f4272bb5d8530c25cab1fe3f2fc7f4c74294ddc4f8a3b9e381cb"],
  ["strong|shadcn|hsl-values", "ebb5de5314dbb3100c62571a332d11a683cbbc89ea973e0177a6751a64f22887"],
  ["strong|shadcn|oklab", "6267c0d3cf3f34158e3540a877a3cdf43043b458dfddc91085d828850a58ec48"],
  ["strong|shadcn|oklch", "686ea74ebaacb1985a21409fcd0c13b8a06a18005d96f24c0ea35c0d89c14f02"],
  ["strong|radix|hex", "2a23a91ef4eae421beec70db5d2633a1398557bc74417826cc9416bb884d283d"],
  ["strong|radix|rgb", "120d4986aa1c6a072908fcb6f9a1c849b76d92cf056a99e7ab0e3e85eb88b7cb"],
  ["strong|radix|hsl", "e29c171c521c4a2017d8ec00e52d675fe9d05e3360754c87e6a6219557017c01"],
  ["strong|radix|hsl-values", "056d2ea33610722d7e04199c41ac546195c8161bfadbaf231bf46e7f66f9ab25"],
  ["strong|radix|oklab", "46d4b58f9172513ec128c8a042b6ac85eec098f3c727dda165f1b95c0e0c40a3"],
  ["strong|radix|oklch", "8c098ac42ae778b7bea39c456f9c163996a94a509364347cfc390d7c5eb96981"],
  ["strong|css-variables|hex", "c309586f2a4face97425def80e1015c1ea294ed1d118f905cb0251b62862fdfd"],
  ["strong|css-variables|rgb", "8d9579b0d4287b6e389d812aa843f3a483d76f4961cc381246b52b5df0de16e5"],
  ["strong|css-variables|hsl", "240f3e836a29b38c55a8aa71e29adb30db8f8a3f3ebfe4962ee5e26e0d9be3bc"],
  ["strong|css-variables|hsl-values", "995466dbc4e2b096672249e636a551533c463d0950719bcbdc18a08a78e2ae01"],
  ["strong|css-variables|oklab", "dc0921cd48d75c202a9878f8a0fcebb05ad5c72f4f5c057afb25c6815f9ba78c"],
  ["strong|css-variables|oklch", "03bcf0bd5ea4a4df2a0f1054770cec7f62b3a46ae77e1f2431a359ef2b5cec6d"],
]);

function declarationHash(css) {
  const declarationText = [...css.matchAll(/--[a-z0-9-]+:\s*[^;]+;/g)]
    .map((match) => match[0])
    .join("\n");
  return createHash("sha256").update(declarationText).digest("hex");
}

test("the public palette contract exposes neutral tints instead of schemes", () => {
  assert.deepEqual(fixture.api.NEUTRAL_TINTS, ["subtle", "strong"]);
  assert.equal("SCHEMES" in fixture.api, false);
});

test("omitting neutralTint uses subtle without changing declarations", () => {
  const css = fixture.api.generateThemeCss({
    hex: "#4DA0FF",
    preset: "shadcn",
    format: "hsl-values",
  });
  assert.equal(declarationHash(css), BASELINE_HASHES.get("subtle|shadcn|hsl-values"));
  assert.match(css, /neutral tint: subtle/);
});

for (const [key, expectedHash] of BASELINE_HASHES) {
  const [neutralTint, preset, format] = key.split("|");
  test(`${neutralTint} preserves the ${preset} x ${format} declaration baseline`, () => {
    const css = fixture.api.generateThemeCss({
      hex: "#4DA0FF",
      preset,
      format,
      neutralTint,
    });
    assert.equal(declarationHash(css), expectedHash);
  });
}

for (const neutralTint of ["", "vivid"]) {
  test(`rejects neutral tint ${JSON.stringify(neutralTint)}`, () => {
    assert.throws(
      () => fixture.api.generateThemeCss({ hex: "#4DA0FF", neutralTint }),
      /Unknown neutral tint.*subtle \| strong/,
    );
  });
}

/** Declarations of one mode block, as token -> value. */
function modeTokens(css, from, to) {
  const start = css.indexOf(from);
  const end = css.indexOf(to, start + from.length);
  const segment = css.slice(start, end === -1 ? undefined : end);
  /** @type {Record<string, string>} */
  const tokens = {};
  for (const match of segment.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    tokens[match[1]] ??= match[2].trim();
  }
  return tokens;
}

function tintedModes(hex, neutralTint) {
  const css = fixture.api.generateThemeCss({
    hex,
    preset: "shadcn",
    format: "hsl-values",
    neutralTint,
  });
  return {
    light: modeTokens(css, ":root {", "@media"),
    dark: modeTokens(css, "@media", '[data-theme="light"]'),
  };
}

const ACCENT_STEPS = Array.from({ length: 12 }, (_, index) => `accent-${index + 1}`);
const TINT_INDEPENDENT = [...ACCENT_STEPS, "background", "primary", "ring"];

// The claim the CLI help, the generated DESIGN.md and the site all make.
for (const hex of ["#4DA0FF", "#E11D48", "#22C55E", "#7C3AED", "#EFB100", "#A1A1A1"]) {
  test(`neutral tint leaves the accent scale, background, primary and ring alone for ${hex}`, () => {
    const subtle = tintedModes(hex, "subtle");
    const strong = tintedModes(hex, "strong");
    for (const mode of ["light", "dark"]) {
      for (const token of TINT_INDEPENDENT) {
        assert.equal(
          subtle[mode][token],
          strong[mode][token],
          `${mode} --${token} moved with the neutral tint`,
        );
      }
    }
  });

  test(`neutral tint does move the gray ramp for ${hex}`, () => {
    const subtle = tintedModes(hex, "subtle");
    const strong = tintedModes(hex, "strong");
    const moved = ["light", "dark"].flatMap((mode) =>
      Object.keys(subtle[mode]).filter(
        (token) => /^gray-\d+$/.test(token) && subtle[mode][token] !== strong[mode][token],
      ),
    );
    assert.ok(moved.length > 0, "expected at least one gray step to differ");
  });
}

// The documented exception: a seed with no hue of its own takes its accent
// scale from the same tinted neutral, so the accent scale moves too.
for (const hex of ["#000000", "#FFFFFF"]) {
  test(`the accent scale follows the neutral tint for the hueless seed ${hex}`, () => {
    const subtle = tintedModes(hex, "subtle");
    const strong = tintedModes(hex, "strong");
    const moved = ["light", "dark"].flatMap((mode) =>
      ACCENT_STEPS.filter((token) => subtle[mode][token] !== strong[mode][token]),
    );
    assert.ok(
      moved.length > 0,
      "expected the documented hueless-seed exception to still apply",
    );
  });
}

// A seed at the top of the red wedge rounds to hue 360, which the engine's own
// range guard rejected. It warned and built the palette from its default blue.
for (const hex of ["#940203", "#790001", "#FF0001"]) {
  test(`a hue-360 seed keeps its own colour instead of falling back for ${hex}`, () => {
    const css = fixture.api.generateThemeCss({
      hex,
      preset: "shadcn",
      format: "hsl-values",
      neutralTint: "subtle",
    });
    const accent9 = css.match(/--accent-9:\s*([0-9.]+) /);
    assert.ok(accent9, "the theme declares --accent-9");
    const hue = Number.parseFloat(accent9[1]);
    // Red, not the engine's fallback blue at roughly 212 degrees.
    assert.ok(
      hue > 330 || hue < 30,
      `expected a red accent for ${hex}, got hue ${hue}`,
    );
  });
}

for (const value of [null, undefined, 123, {}]) {
  test(`rejects a non-string seed ${JSON.stringify(value) ?? String(value)} with the HEX message`, () => {
    assert.equal(fixture.api.isValidHex(value), false);
    assert.throws(
      () => fixture.api.generateThemeCss({ hex: value, preset: "shadcn", format: "hsl-values" }),
      /Invalid HEX color/,
    );
  });
}

test("rejects the removed scheme property instead of ignoring it", () => {
  assert.throws(
    () => fixture.api.generateThemeCss({ hex: "#4DA0FF", scheme: "analogous" }),
    /scheme.*removed.*neutralTint/i,
  );
});
