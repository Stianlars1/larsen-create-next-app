import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import {
  generateTheme,
  serializeTheme,
  serializedArtifactText,
  versions,
} from "tintful";
import {
  DEFAULT_THEME,
  FORMATS,
  NEUTRAL_TINTS,
  PRESETS,
  generateThemeArtifacts,
  generateThemeCss,
  generateThemePreview,
  normalizeOptions,
  parseThemeTokens,
  requireQuality,
  supportedFormats,
  tokenRoles,
} from "../../palette/index.js";
import { checkThemeContrast } from "../src/theme-contrast.mjs";

test("every advertised combination preserves native bytes or rejects failed quality", () => {
  for (const neutralTint of NEUTRAL_TINTS) {
    const generated = generateTheme({
      schemaVersion: versions.schema,
      profiles: versions,
      primary: { value: "#4DA0FF" },
      neutral: { kind: "derived", hue: neutralTint },
    });
    assert.equal(generated.qualityStatus, "pass");
    for (const preset of Object.keys(PRESETS))
      for (const format of supportedFormats(preset)) {
        const options = { hex: "#4DA0FF", preset, format, neutralTint };
        const native = serializeTheme(generated.theme, {
          adapter: { id: preset, profile: "strict", version: "1" },
          container: "css",
          output: { colorSyntax: FORMATS[format], targetGamut: "srgb" },
          includeAudit: "sidecar",
          options: {
            css: {
              systemPreference: "media",
              manualOverride: "data-attribute",
              ...(preset === "shadcn" ? { tailwindBridge: "omit" } : {}),
            },
          },
        });
        if (!native.ok || native.qualityStatus !== "pass") {
          assert.throws(
            () => generateThemeArtifacts(options),
            /No files emitted/,
          );
          continue;
        }
        const actual = generateThemeArtifacts(options);
        assert.deepEqual(actual.manifest, native.reproducibility);
        for (const [i, artifact] of actual.artifacts.entries()) {
          assert.equal(
            artifact.text,
            serializedArtifactText(native.artifacts[i]),
          );
          assert.equal(
            createHash("sha256").update(artifact.text).digest("hex"),
            artifact.sha256,
          );
          if (artifact.auditSidecarId)
            assert.ok(
              actual.artifacts.some((a) => a.id === artifact.auditSidecarId),
            );
        }
        assert.doesNotMatch(actual.css, /@theme|@import.*tailwind|body\s*\{/);
        assert.match(actual.css, /prefers-color-scheme: dark/);
        const modes = parseThemeTokens(actual.css);
        for (const role of Object.values(tokenRoles(preset, format)))
          for (const mode of Object.values(modes))
            assert.ok(mode[role.name.slice(2)]);
        assert.deepEqual(
          checkThemeContrast(actual.css, options),
          [],
          JSON.stringify(options),
        );
      }
  }
});

test("default masters preserve exact CSS, sidecar hashes, and serialization manifest", () => {
  const output = generateThemeArtifacts(DEFAULT_THEME);
  for (const artifact of output.artifacts)
    assert.equal(
      readFileSync(
        new URL(`../../CSS/${artifact.fileName}`, import.meta.url),
        "utf8",
      ),
      artifact.text,
    );
  assert.deepEqual(
    JSON.parse(
      readFileSync(new URL("../../CSS/theme.manifest.json", import.meta.url)),
    ),
    output.manifest,
  );
  assert.doesNotMatch(output.css, /brand-blue|foreground-subtle|--accent-9/);
  assert.ok(existsSync(new URL("../../CSS/document.css", import.meta.url)));
});

test("legacy options and unsupported Radix channels fail with migration guidance", () => {
  assert.throws(
    () => normalizeOptions({ hex: "fff", preset: "css-variables" }),
    /canonical/,
  );
  assert.throws(
    () => normalizeOptions({ hex: "fff", neutralTint: "subtle" }),
    /not a compatibility alias/,
  );
  assert.throws(
    () => normalizeOptions({ hex: "fff", preset: "radix" }),
    /Explicitly choose --format/,
  );
  for (const key of [
    "scheme",
    "darkHex",
    "overrides",
    "darkOverrides",
    "append",
  ])
    assert.throws(
      () => normalizeOptions({ hex: "fff", [key]: {} }),
      /not supported/,
    );
  for (const hex of [null, 12, "", "ggg", "abcd"])
    assert.throws(() => normalizeOptions({ hex }), /Invalid HEX/);
});

test("operation and quality failures cannot leak artifacts", () => {
  for (const result of [
    { ok: false, errors: [{ code: "FAILED", message: "invalid input" }] },
    {
      ok: true,
      qualityStatus: "fail",
      diagnostics: [{ code: "ADAPTER_DERIVATION_FAILED", message: "fidelity" }],
      artifacts: [],
    },
    { ok: true, qualityStatus: "pass", artifacts: [{ qualityStatus: "fail" }] },
  ])
    assert.throws(
      () => requireQuality(result, "test", DEFAULT_THEME),
      /No files emitted/,
    );
  assert.throws(
    () =>
      generateThemeCss({
        hex: "#4DA0FF",
        preset: "radix",
        format: "hex",
        neutralTint: "weak",
      }),
    /ADAPTER_DERIVATION_FAILED/,
  );
});

test("preview ramps are native canonical tokens and export bytes equal CLI output", () => {
  const preview = generateThemePreview({ hex: "#005F78" });
  assert.equal(preview.css, generateThemeCss({ hex: "#005F78" }));
  for (const mode of ["light", "dark"])
    for (const family of ["brand-primary", "neutral"])
      for (let step = 1; step <= 12; step++)
        assert.ok(preview.ramps[mode][`cpe-ramp-${family}-${step}`]);
  assert.equal(preview.light["accent-9"], undefined);
});

test("black, white, neutral, saturated and boundary seeds meet final consumer contrast", () => {
  for (const hex of [
    "#000000",
    "#FFFFFF",
    "#010101",
    "#FEFEFE",
    "#808080",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#777777",
    "#611431",
    "#9F46B1",
  ])
    for (const neutralTint of NEUTRAL_TINTS) {
      const css = generateThemeCss({ hex, neutralTint });
      assert.deepEqual(checkThemeContrast(css), [], `${hex}/${neutralTint}`);
    }
});

test("engine-pass boundary exports below the project margin are rejected unchanged", () => {
  for (const hex of ["#7B534B", "#5736FE", "#FE9762"]) for (const neutralTint of NEUTRAL_TINTS) {
    assert.throws(() => generateThemeArtifacts({ hex, neutralTint }), /Consumer contrast rejected.*No files emitted/s);
  }
});
