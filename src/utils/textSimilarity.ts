export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateSimilarity(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);

  if (na === nb) return 1.0;
  if (!na && !nb) return 1.0;
  if (!na || !nb) return 0.0;
  if (na.length < 2 || nb.length < 2) return na === nb ? 1.0 : 0.0;

  const bigrams = (s: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const pair = s.substring(i, i + 2);
      map.set(pair, (map.get(pair) ?? 0) + 1);
    }
    return map;
  };

  const bigramsA = bigrams(na);
  const bigramsB = bigrams(nb);

  let intersection = 0;
  for (const [pair, countA] of bigramsA) {
    const countB = bigramsB.get(pair);
    if (countB) intersection += Math.min(countA, countB);
  }

  const totalA = na.length - 1;
  const totalB = nb.length - 1;

  return (2 * intersection) / (totalA + totalB);
}
