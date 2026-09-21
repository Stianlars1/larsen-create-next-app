import { writeFileSync } from "node:fs";
import {
  DEFAULT_THEME,
  generateThemeArtifacts,
  documentStyles,
  PRESETS,
  supportedFormats,
} from "./index.js";
const result = generateThemeArtifacts({
  ...DEFAULT_THEME,
  hex: process.argv[2] ?? DEFAULT_THEME.hex,
  neutralTint: process.argv[3] ?? DEFAULT_THEME.neutralTint,
});
for (const artifact of result.artifacts)
  writeFileSync(
    new URL(`../CSS/${artifact.fileName}`, import.meta.url),
    artifact.text,
  );
writeFileSync(
  new URL("../CSS/theme.manifest.json", import.meta.url),
  JSON.stringify(result.manifest, null, 2) + "\n",
);
writeFileSync(
  new URL("../CSS/document.css", import.meta.url),
  documentStyles(result.options),
);
console.log(
  `Wrote unmodified Tintful artifacts and separate document.css for ${JSON.stringify(result.options)}`,
);

writeFileSync(
  new URL("./capabilities.json", import.meta.url),
  JSON.stringify(
    Object.fromEntries(
      Object.keys(PRESETS).map((preset) => [preset, supportedFormats(preset)]),
    ),
    null,
    2,
  ) + "\n",
);
