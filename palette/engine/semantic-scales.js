import * as RadixColors from "@radix-ui/colors";
import Color from "colorjs.io";
import { hexToHSL } from "./colorConverters.js";

export const SEMANTIC_SCALE_SPECS = Object.freeze({
  success: Object.freeze({ candidates: Object.freeze(["jade", "green", "grass"]), fallback: "green" }),
  danger: Object.freeze({ candidates: Object.freeze(["tomato", "red", "ruby", "crimson"]), fallback: "red" }),
  warning: Object.freeze({ candidates: Object.freeze(["amber", "orange"]), fallback: "amber" }),
  info: Object.freeze({ candidates: Object.freeze(["sky", "blue", "cyan"]), fallback: "blue" }),
});

export function selectSemanticScaleName(seedHex, role) {
  const spec = SEMANTIC_SCALE_SPECS[role];
  if (!spec) throw new Error(`Unknown semantic role: "${role}"`);
  if (hexToHSL(seedHex).s < 6) return spec.fallback;
  const seed = new Color(seedHex).to("oklab");
  return spec.candidates
    .map((name, index) => ({
      name,
      index,
      distance: seed.deltaEOK(new Color(RadixColors[name][`${name}9`]).to("oklab")),
    }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)[0].name;
}

export function getSemanticScale(name, appearance) {
  const source = RadixColors[appearance === "dark" ? `${name}Dark` : name];
  if (!source) throw new Error(`Unknown Radix semantic scale: "${name}"`);
  return Array.from({ length: 12 }, (_, index) => source[`${name}${index + 1}`]);
}
