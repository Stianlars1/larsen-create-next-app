function hexToHSL(hex) {
  const clean = hex.trim().replace(/^#/, "");
  const fullHex = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  const r = parseInt(fullHex.slice(0, 2), 16) / 255;
  const g = parseInt(fullHex.slice(2, 4), 16) / 255;
  const b = parseInt(fullHex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
function hexToRGB(hex) {
  const clean = hex.trim().replace(/^#/, "");
  const fullHex = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  return {
    r: parseInt(fullHex.slice(0, 2), 16),
    g: parseInt(fullHex.slice(2, 4), 16),
    b: parseInt(fullHex.slice(4, 6), 16)
  };
}
function isValidHex(hex) {
  const clean = hex.trim().replace(/^#/, "");
  return /^[0-9A-F]{3}$|^[0-9A-F]{6}$/i.test(clean);
}
export {
  hexToHSL,
  hexToRGB,
  isValidHex
};
