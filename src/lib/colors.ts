// HSL色空間を使用して、多様な色を生成
export function generateColorFromUserId(userId: string): string {
  // ユーザーIDからハッシュ値を生成
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // 色相（Hue）: 0-360の値
  const hue = Math.abs(hash % 360);
  
  // 彩度（Saturation）: 65-85%の範囲で変化
  const saturation = 65 + (Math.abs((hash >> 8) % 20));
  
  // 明度（Lightness）: 45-65%の範囲で変化
  const lightness = 45 + (Math.abs((hash >> 16) % 20));

  // HSLからHEXに変換
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    h /= 360;
    s /= 100;
    l /= 100;
    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    ];
  };

  const [r, g, b] = hslToRgb(hue, saturation, lightness);
  const toHex = (n: number): string => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}