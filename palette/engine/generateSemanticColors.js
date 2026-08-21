import { getBestForeground, PROJECT_TEXT_CONTRAST } from "./contrast-utils.js";
import { getSemanticScale, selectSemanticScaleName } from "./semantic-scales.js";

const ROLES = ["success", "danger", "warning", "info"];

function colorSet(scale, grayScale) {
  return {
    base: scale[8],
    foreground: getBestForeground(scale[8], scale, grayScale, PROJECT_TEXT_CONTRAST).color,
    muted: scale[2],
    mutedForeground: getBestForeground(scale[2], scale, grayScale, PROJECT_TEXT_CONTRAST).color,
    border: scale[6],
  };
}

export function generateSemanticColors(seedHex, lightGrayScale, darkGrayScale) {
  const light = {};
  const dark = {};
  for (const role of ROLES) {
    const name = selectSemanticScaleName(seedHex, role);
    light[role] = colorSet(getSemanticScale(name, "light"), lightGrayScale);
    dark[role] = colorSet(getSemanticScale(name, "dark"), darkGrayScale);
  }
  return { light, dark };
}
