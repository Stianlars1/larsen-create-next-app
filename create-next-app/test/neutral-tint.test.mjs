import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, test } from "node:test";
import { createPaletteMasterFixture } from "../test-support/palette-master.mjs";

const fixture = await createPaletteMasterFixture();
after(fixture.cleanup);

// The 0.5.1 foreground-subtle correction is the only permitted declaration
// change. These hashes lock every other declaration to the 0.5.0 output.
const UNCHANGED_DECLARATION_HASHES = new Map([
  ["subtle|shadcn|hex", "556b1e3cdd2bfb36ec798722e12c436fbdadfead654eb8c5e7c298945ac4fc1d"],
  ["subtle|shadcn|rgb", "1cb77116e560bbca146ec5f787620fd96c57fb11683673502c3982b88638639c"],
  ["subtle|shadcn|hsl", "be751f3704db7a661947686265c4bda481b6f231a4040c149129366a6496055e"],
  ["subtle|shadcn|hsl-values", "106afc1e56d7689e29abcc706cfad602a132a29dba7a65963365283fcc39149d"],
  ["subtle|shadcn|oklab", "f70deefed152908f86f3c0a64c026848a99c8aea2aaba56c900414661863e63a"],
  ["subtle|shadcn|oklch", "f4988cf9a77ab0bcbda3850caf4e55991c8a297670599ba19bf1255d97c2993f"],
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
  ["strong|shadcn|hex", "ab373573f175f4ed25ae052ab09280f12be581f35bfc4aa47e75119411f90d10"],
  ["strong|shadcn|rgb", "46179e8e1de15942a5e2d90eff93fd0e69ab3fd1ce90ca2386fb0b4e87b5895a"],
  ["strong|shadcn|hsl", "cff18e161c9728bb6a246e1219c5f4ee17ad73b5fa2aa5f66bcdb5692cd2e4b7"],
  ["strong|shadcn|hsl-values", "bca3c4448c41db50fb4104ba21ba67d4951885a841b3f63aea063a10b619f381"],
  ["strong|shadcn|oklab", "bb8ec322b7dcf6ef4ab36d21a2566d98cf29f66ce4cb2128e08c5ed31d8af8d4"],
  ["strong|shadcn|oklch", "0cd6430101bf589312a362257f2bfa518700de5607ce6c91922303490462af91"],
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

// Full 0.5.1 shadcn baselines separately lock the corrected token in all six
// formats instead of hiding it behind the compatibility invariant above.
const SHADCN_051_FULL_HASHES = new Map([
  ["subtle|hex", "b961a55475726aa1a2feb4ad51aad2a5f241804a356ec7f07d62bc6bb62a4f5d"],
  ["subtle|rgb", "7290cfff403e8032c869fbdc676dd3f9645bf03e76d748a575ce5e1d8707fac7"],
  ["subtle|hsl", "ef26b45747d6ce472b6ab6df3748aa06467f3e0f9d40b36188b2acbde40e28fb"],
  ["subtle|hsl-values", "900846fd4fb91ab244bbce4365aaa7754efda12aeac529dd963bce53c16a004f"],
  ["subtle|oklab", "c9069778ea7c0274323da0cf948208466002556e393b45a47fa24f5a69b78bdf"],
  ["subtle|oklch", "b54b38d3c9363df4b25d27a0e8d9cfcf7b2afa21934b8480530e2f0ebf76c738"],
  ["strong|hex", "44ca7cf94870698fa33e8bab058d0f318ae5ac98027d2d2dbe80a3e6a3b388ca"],
  ["strong|rgb", "2ec3d6b8553cd3c7daf9c8bd77911e731c8c4f31f7785d6d6772c3bc597936c6"],
  ["strong|hsl", "4b8198b2c4a7e8568e58b8688b217ba63af111378dc04329f71e46701fca1a86"],
  ["strong|hsl-values", "24c10bab42fc792e521a2c610e6eb95469fce43d09ca585ff6a9eb0cd65c3f34"],
  ["strong|oklab", "7e8f8573b27639c1286c27a7c790d925f0151de4db37317800d3ac447cff8859"],
  ["strong|oklch", "23f653255ae5682cc6c70f1619de32466c4307109b7fbf4246046f834d144344"],
]);

function declarationHash(css, { omitForegroundSubtle = false } = {}) {
  const declarationText = [...css.matchAll(/--[a-z0-9-]+:\s*[^;]+;/g)]
    .map((match) => match[0])
    .filter(
      (declaration) =>
        !omitForegroundSubtle || !declaration.startsWith("--foreground-subtle:"),
    )
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

for (const [key, expectedHash] of UNCHANGED_DECLARATION_HASHES) {
  const [neutralTint, preset, format] = key.split("|");
  const scope = preset === "shadcn"
    ? "all declarations except corrected foreground-subtle"
    : "the complete declaration baseline";
  test(`${neutralTint} preserves ${scope} for ${preset} x ${format}`, () => {
    const css = fixture.api.generateThemeCss({
      hex: "#4DA0FF",
      preset,
      format,
      neutralTint,
    });
    assert.equal(
      declarationHash(css, { omitForegroundSubtle: preset === "shadcn" }),
      expectedHash,
    );
  });
}

for (const [key, expectedHash] of SHADCN_051_FULL_HASHES) {
  const [neutralTint, format] = key.split("|");
  test(`${neutralTint} locks the complete 0.5.1 shadcn x ${format} output`, () => {
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
for (const hex of ["#000000", "#010101", "#FEFEFE", "#FFFFFF"]) {
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
