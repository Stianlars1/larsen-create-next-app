import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, test } from "node:test";
import { createPaletteMasterFixture } from "../test-support/palette-master.mjs";

const fixture = await createPaletteMasterFixture();
after(fixture.cleanup);

// Task 1 deliberately changes the 20 status declarations. In shadcn it also
// changes destructive aliases and chart 4/5. These hashes lock every resulting
// declaration across both neutral tints, presets, and serialization formats.
const CURRENT_DECLARATION_HASHES = new Map([
  ["subtle|shadcn|hex", "b52f53c26455a4e82e13b190b061d539fcfd915f6fc2272bb0df2c296962477b"],
  ["subtle|shadcn|rgb", "1a8fe88b8c1bc9b9646206dcb4814ef84535111e34a9438db7bb30450c06779d"],
  ["subtle|shadcn|hsl", "5f730e53ac9361c7bde201b253f41f7bdf7e2c9195f16176c98659fc6d65a467"],
  ["subtle|shadcn|hsl-values", "45ae6573d4a0adc8e2e966c39afe3a0796ad0331e3946cd7dbcaa17d898e16ff"],
  ["subtle|shadcn|oklab", "8a534b6bdc60eebc91c86cd15899e5054b4e4b215151e14c6ad4d4b981b7bede"],
  ["subtle|shadcn|oklch", "f5f401eea77e3eb4bf4d066ce990a654e68b5f40843a0f0d079c446c0022ac58"],
  ["subtle|radix|hex", "932980eb9d9f1e4d9b22160a2c72180d4034a5c72e925319ff4e094e194695e4"],
  ["subtle|radix|rgb", "0c0afc1b309c373ef208375c46a6ecf99f10744335b770ee6ce01f73a7ef2ae8"],
  ["subtle|radix|hsl", "9ca2359301ef78b0c9c8545f7d53ab6a1425950dff82098b005d823996d557c0"],
  ["subtle|radix|hsl-values", "851591d926f25440f984a6fda6053953f175f051f1bb7cbefff57ebaa1a8852e"],
  ["subtle|radix|oklab", "aea3884efdacd52f1e68153bd4ba9e81f50b5e0cf79f7f2859456cbb6f5e7317"],
  ["subtle|radix|oklch", "396a1317ec4d486276ab758dd2a70f863ae0768abac9bff0e38887d1c22e314b"],
  ["subtle|css-variables|hex", "9b09d62aaf46ad2852f818e0d05fbadbe6b996c1fef17ca25f5c6bcbd40a0296"],
  ["subtle|css-variables|rgb", "c8c13d952e6e013ade2bb6f71d6d30f70f9dda44787fbea86d674709e46ebc87"],
  ["subtle|css-variables|hsl", "292a3b6f10236f11c6a95390aa984a6757c82f6efde8c6f889c81688e3968175"],
  ["subtle|css-variables|hsl-values", "981b1b803cfe574a4a8acf817cbac18db504e1b1fe3c6b7eb210b734583635c5"],
  ["subtle|css-variables|oklab", "59e01eb6c2294bb493aa1079c2e60f808ab41320df1b08eabd9aadcc204a53b3"],
  ["subtle|css-variables|oklch", "592f1cdc78ee85ebc2f9813c219dd5ebca6f83d4b52661b274f743702aad19d4"],
  ["strong|shadcn|hex", "d16fd628201880a73352c3e6b903a15ebdd26c5720d3fab41a5f125c6e922d6d"],
  ["strong|shadcn|rgb", "183c289bec221003f5f730c44e61e097c13f016238a87ece873c3ce584ac4153"],
  ["strong|shadcn|hsl", "dd9ee59245d85581c1973f7c33719e289b7507e3809b01cfaaa26758828f1d44"],
  ["strong|shadcn|hsl-values", "c089ef87ef8e6bc108f5bfc21786aa0f328d69812394887636b7c3d297ae05f5"],
  ["strong|shadcn|oklab", "f42239bd952cc854cd03040defd88baa9b27cd297d28f364c66ff4cb6a268297"],
  ["strong|shadcn|oklch", "a132ffc6da1c7826eb4dad55f1ff5f71cc3c203478744732ee442d733f810cbf"],
  ["strong|radix|hex", "7f031da2c4aa8b97d07b184a92e5d5a632c68670379bb2c6a335e75a5bc711f5"],
  ["strong|radix|rgb", "ccbadd29c69897bbf59b73e45663a137f1c7c810c4c8d000959760d3ff2dc23e"],
  ["strong|radix|hsl", "28903ec7e62fd247f16f3a528a56338fe60da07ea8967084f27ab238781f15cf"],
  ["strong|radix|hsl-values", "7ea41bf0e3e1f877e2b9177bd309fc2dd5f645df7c98f6d857eaca42fc386850"],
  ["strong|radix|oklab", "d2ec2c085cd6f7f918ab60b4f0f3a3588d947904b0920ad739e55b19bdb4ead3"],
  ["strong|radix|oklch", "b2c77903a9e3340914a4f8f1a7ead3f39a42d51f7629bd181dde7c35a93102f3"],
  ["strong|css-variables|hex", "fc6953a6f9ee2ce252e18aa5d1ad0e4c73e385f3bdc004f7562e8fe592c34c46"],
  ["strong|css-variables|rgb", "f5d7de54a7049b41195fc98ba116acd978acfa7facd08ac7ec609eb4c7d9493d"],
  ["strong|css-variables|hsl", "375fc795ab3acbfd5e856520833774e3422d37f56487af4c7c115a9ae23b397a"],
  ["strong|css-variables|hsl-values", "2a4cef1e3ce640fecf893d436721bc08deee7a4722fade29732f97036fd533b9"],
  ["strong|css-variables|oklab", "b53dbe6b87be268f3c183d4ffdf847ca0b95bfc36a2a7d5564abe8fa4474b4af"],
  ["strong|css-variables|oklch", "6f93c32f451e20bc044ed7bc3d40b00c2755914ba2b724c975bb523d3793a1ae"],
]);

// Keep an explicit complete shadcn baseline because its alias declarations
// change with semantic selection while its token-name contract stays stable.
const SHADCN_CURRENT_FULL_HASHES = new Map([
  ["subtle|hex", "b52f53c26455a4e82e13b190b061d539fcfd915f6fc2272bb0df2c296962477b"],
  ["subtle|rgb", "1a8fe88b8c1bc9b9646206dcb4814ef84535111e34a9438db7bb30450c06779d"],
  ["subtle|hsl", "5f730e53ac9361c7bde201b253f41f7bdf7e2c9195f16176c98659fc6d65a467"],
  ["subtle|hsl-values", "45ae6573d4a0adc8e2e966c39afe3a0796ad0331e3946cd7dbcaa17d898e16ff"],
  ["subtle|oklab", "8a534b6bdc60eebc91c86cd15899e5054b4e4b215151e14c6ad4d4b981b7bede"],
  ["subtle|oklch", "f5f401eea77e3eb4bf4d066ce990a654e68b5f40843a0f0d079c446c0022ac58"],
  ["strong|hex", "d16fd628201880a73352c3e6b903a15ebdd26c5720d3fab41a5f125c6e922d6d"],
  ["strong|rgb", "183c289bec221003f5f730c44e61e097c13f016238a87ece873c3ce584ac4153"],
  ["strong|hsl", "dd9ee59245d85581c1973f7c33719e289b7507e3809b01cfaaa26758828f1d44"],
  ["strong|hsl-values", "c089ef87ef8e6bc108f5bfc21786aa0f328d69812394887636b7c3d297ae05f5"],
  ["strong|oklab", "f42239bd952cc854cd03040defd88baa9b27cd297d28f364c66ff4cb6a268297"],
  ["strong|oklch", "a132ffc6da1c7826eb4dad55f1ff5f71cc3c203478744732ee442d733f810cbf"],
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

test("omitting neutralTint is byte-identical to explicit subtle", () => {
  const omitted = fixture.api.generateThemeCss({
    hex: "#4DA0FF",
    preset: "shadcn",
    format: "hsl-values",
  });
  const explicit = fixture.api.generateThemeCss({
    hex: "#4DA0FF",
    preset: "shadcn",
    format: "hsl-values",
    neutralTint: "subtle",
  });
  assert.equal(omitted, explicit);
  assert.match(omitted, /neutral tint: subtle/);
});

for (const [key, expectedHash] of CURRENT_DECLARATION_HASHES) {
  const [neutralTint, preset, format] = key.split("|");
  test(`${neutralTint} locks the current declaration baseline for ${preset} x ${format}`, () => {
    const css = fixture.api.generateThemeCss({
      hex: "#4DA0FF",
      preset,
      format,
      neutralTint,
    });
    assert.equal(
      declarationHash(css),
      expectedHash,
    );
  });
}

for (const [key, expectedHash] of SHADCN_CURRENT_FULL_HASHES) {
  const [neutralTint, format] = key.split("|");
  test(`${neutralTint} locks the complete current shadcn x ${format} output`, () => {
    const css = fixture.api.generateThemeCss({
      hex: "#4DA0FF",
      preset: "shadcn",
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
for (const [hex, expected] of new Map([
  ["#000000", { light: 9, dark: 6 }],
  ["#010101", { light: 0, dark: 6 }],
  ["#FEFEFE", { light: 9, dark: 0 }],
  ["#FFFFFF", { light: 9, dark: 6 }],
])) {
  test(`the accent scale follows the neutral tint for the hueless seed ${hex}`, () => {
    const subtle = tintedModes(hex, "subtle");
    const strong = tintedModes(hex, "strong");
    const moved = Object.fromEntries(
      ["light", "dark"].map((mode) => [
        mode,
        ACCENT_STEPS.filter((token) => subtle[mode][token] !== strong[mode][token]).length,
      ]),
    );
    assert.deepEqual(moved, expected);
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
