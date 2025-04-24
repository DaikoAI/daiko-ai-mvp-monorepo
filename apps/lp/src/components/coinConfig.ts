export interface CoinConfig {
  glbPaths: string[];
  batchCount: number;
  scale: [number, number, number];
  spawnRange: number;
  spawnHeight: number;
  lifetime: number; // in ms
  ratios: number[]; // relative weights for each model
}

export const coinConfig: CoinConfig = {
  glbPaths: [
    "/3d/coin/btc.glb",
    "/3d/coin/usdc.glb",
    "/3d/coin/jito.glb",
    "/3d/coin/jup.glb",
    "/3d/coin/sol.glb",
    "/3d/coin/inf.glb",
  ],
  ratios: [1, 1, 1, 1, 1],
  batchCount: 30,
  scale: [0.05, 0.05, 0.05],
  spawnRange: 16,
  spawnHeight: 10,
  lifetime: 10000,
};

// Alias method for O(1) weighted random sampling
function createAlias(probabilities: number[]) {
  const n = probabilities.length;
  const prob: number[] = new Array(n);
  const alias: number[] = new Array(n);
  const sum = probabilities.reduce((a, b) => a + b, 0);
  const scaled = probabilities.map(p => (p * n) / sum);
  const small: number[] = [];
  const large: number[] = [];
  scaled.forEach((s, i) => {
    if (s < 1) small.push(i);
    else large.push(i);
  });
  while (small.length && large.length) {
    const l = small.pop() as number;
    const g = large.pop() as number;
    prob[l] = scaled[l];
    alias[l] = g;
    scaled[g] = scaled[g] - (1 - scaled[l]);
    if (scaled[g] < 1) small.push(g);
    else large.push(g);
  }
  [...small, ...large].forEach(i => {
    prob[i] = 1;
    alias[i] = i;
  });
  return { prob, alias };
}

const { prob: coinAliasProbabilities, alias: coinAliasIndices } = createAlias(coinConfig.ratios);

/**
 * Returns a random index for coinConfig.glbPaths according to configured ratios in O(1).
 */
export function getRandomCoinModelIndex(): number {
  const k = Math.floor(Math.random() * coinConfig.ratios.length);
  return Math.random() < coinAliasProbabilities[k] ? k : coinAliasIndices[k];
}