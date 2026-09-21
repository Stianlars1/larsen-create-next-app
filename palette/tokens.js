/** Parse native Tintful mode declarations, resolving canonical var aliases for previews. */
export function parseThemeTokens(css) {
  const declarations = (segment) =>
    Object.fromEntries(
      [...segment.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [
        match[1],
        match[2].trim(),
      ]),
    );
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const light = blocks.find((match) => match[1].trim() === ":root");
  const dark = blocks.find((match) => match[1].includes('[data-theme="dark"]'));
  if (!light || !dark)
    throw new Error("Tintful CSS is missing its light or explicit dark block.");
  const resolve = (tokens) => {
    const value = (name, seen = new Set()) => {
      if (seen.has(name)) throw new Error(`Circular token alias: ${name}`);
      seen.add(name);
      if (!(name in tokens)) throw new Error(`Missing token alias: ${name}`);
      return tokens[name].replace(/var\(--([\w-]+)\)/g, (_, ref) =>
        value(ref, new Set(seen)),
      );
    };
    return Object.fromEntries(
      Object.keys(tokens).map((name) => [name, value(name)]),
    );
  };
  return {
    light: resolve(declarations(light[2])),
    dark: resolve(declarations(dark[2])),
  };
}
