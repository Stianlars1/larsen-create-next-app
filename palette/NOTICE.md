# NOTICE

The files under `engine/` are vendored from **rampkit** (https://rampkit.app),
authored by Stian Larsen.

- Source repository: https://github.com/Stianlars1/rampkit-client
- Vendored at commit: `48d6b33b10ebb38a007cbad67e6ea437b22ccf24` (2026-01-04)

## Local deviations from upstream

1. Transpiled TypeScript -> plain JavaScript (ESM) with esbuild; `@/*` path
   aliases rewritten to relative imports.
2. `getColorFromCSS` removed from `color-utils.js` (browser-only, unused by
   the engine).
3. `export-formats.js`: implemented the `OKLAB` and `OKLCH` cases in
   `formatColor` via colorjs.io (upstream lists both formats but silently
   falls back to HEX).
4. Type-only modules (`types/index.ts`, `types/radix.ts`) not vendored -
   types are erased in the JS build.
5. `export-formats.js`: alpha-aware serialization preserves 8-digit HEX and
   CSS color alpha in HEX, RGB, HSL, HSL Values, OKLAB, and OKLCH output.
6. `generateShadcnCSS`: completed the approved shadcn semantic token-name
   contract with card, popover, radius, chart, and sidebar tokens while
   retaining the legacy `--destructive-foreground` extra.
7. `generateRadixCSS`: replaced the upstream CSS Variables alias with the
   57-name Radix Themes custom-palette override contract plus the existing 26
   Larsen tokens. P3 wide-gamut blocks remain deferred.
8. `export-formats.js`: shadcn primary and ring roles keep the requested seed
   when it passes their contrast floor, otherwise use the closest passing
   accent-scale color. Radix accent contrast keeps the upstream value only
   when it reaches WCAG AA, otherwise it uses the existing scale-first
   foreground chooser.
9. `formatColor`: HSL and HSL Values retain up to four decimal places instead
   of rounding every component to an integer. This prevents serialization
   from moving a passing foreground pair below its WCAG threshold.
10. `generateShadcnCSS`: `--input` is the closest gray that reaches 3:1
    against every surface a control sits on - the page background in light
    mode, and background, card, and popover in dark mode. Upstream emits
    gray-7 for it, which measures about 1.7:1 and cannot identify a text
    field, select, or outline button under WCAG 2.1 SC 1.4.11. `--border`
    still emits gray-7: cards and separators are not user interface
    components, and the same floor would give every card a heavy outline.

11. `color-utils.js`: `hexToHSL` wraps its rounded hue with `% 360`, and
    `isValidHex` returns false for a non-string instead of throwing.
    Upstream, a seed near the top of the red wedge rounds to hue 360, which
    `generateHarmoniousPalette` rejects as out of range - it then warns and
    silently builds the palette from the engine's default blue instead of the
    requested color. Deep reds such as `#940203` were affected.

When re-syncing with upstream, re-apply deviations 2, 3, and 5 through 11 (or
port them upstream first).

## License

`engine/generateRadixColors.js` is derived from the custom-palette algorithm
in Radix Themes (https://github.com/radix-ui/themes), used under the MIT
license:

```
MIT License

Copyright (c) 2023 WorkOS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The remaining engine files and this package are (c) Stian Larsen, MIT
licensed (see ../LICENSE in the published package).
