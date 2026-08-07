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

When re-syncing with upstream, re-apply deviations 2 and 3 (or port them
upstream first).

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
