import type { Occupation } from "./occupationData";

export function squarify(
  items: Occupation[],
  x: number, y: number, w: number, h: number,
  sortBy: string = "empleo"
): Occupation[] {
  if (!items.length) return [];
  if (items.length === 1) return [{ ...items[0], x, y, w, h }];
  const total = items.reduce((s, d) => s + d.empleo, 0);
  if (total === 0) return items.map(d => ({ ...d, x, y, w: 0, h: 0 }));
  const sorted = [...items].sort((a, b) => {
    if (sortBy === "salario") return b.salario - a.salario;
    if (sortBy === "score") return b.score - a.score;
    return b.empleo - a.empleo;
  });
  const isH = w >= h;
  let bestRatio = Infinity, bestSplit = 1;
  for (let i = 1; i < sorted.length; i++) {
    const leftSum = sorted.slice(0, i).reduce((s, d) => s + d.empleo, 0);
    const frac = leftSum / total;
    const lRatios = sorted.slice(0, i).map(d => {
      const dim = isH ? h * (d.empleo / leftSum) : w * (d.empleo / leftSum);
      const cross = isH ? w * frac : h * frac;
      return Math.max(cross / dim, dim / cross);
    });
    const rSum = total - leftSum;
    const rRatios = sorted.slice(i).map(d => {
      const dim = isH ? h * (d.empleo / rSum) : w * (d.empleo / rSum);
      const cross = isH ? w * (1 - frac) : h * (1 - frac);
      return Math.max(cross / dim, dim / cross);
    });
    const maxR = Math.max(...lRatios, ...rRatios);
    if (maxR < bestRatio) { bestRatio = maxR; bestSplit = i; }
  }
  const left = sorted.slice(0, bestSplit), right = sorted.slice(bestSplit);
  const leftSum = left.reduce((s, d) => s + d.empleo, 0);
  const frac = leftSum / total;
  if (isH) {
    const lW = w * frac;
    return [...squarify(left, x, y, lW, h, sortBy), ...squarify(right, x + lW, y, w - lW, h, sortBy)];
  }
  const tH = h * frac;
  return [...squarify(left, x, y, w, tH, sortBy), ...squarify(right, x, y + tH, w, h - tH, sortBy)];
}
