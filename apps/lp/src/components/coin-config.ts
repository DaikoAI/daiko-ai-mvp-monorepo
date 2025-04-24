export interface CoinInfo {
  glbPath: string;
  ratio: number;
  scale: [number, number, number];
}

export interface CoinConfig {
  coins: CoinInfo[];
  batchCount: number;
  spawnRange: number;
  spawnHeight: number;
  lifetime: number; // in ms
}

export const coinConfig: CoinConfig = {
  coins: [
    { glbPath: "/3d/coin/btc.glb", ratio: 8, scale: [0.2, 0.2, 0.2] },
    { glbPath: "/3d/coin/usdc.glb", ratio: 3, scale: [0.2, 0.2, 0.2] },
    { glbPath: "/3d/coin/jito.glb", ratio: 2, scale: [0.2, 0.2, 0.2] },
    { glbPath: "/3d/coin/jup.glb", ratio: 2, scale: [0.2, 0.2, 0.2] },
    { glbPath: "/3d/coin/sol.glb", ratio: 5, scale: [0.2, 0.2, 0.2] },
    { glbPath: "/3d/coin/inf.glb", ratio: 2, scale: [0.2, 0.2, 0.2] },
    { glbPath: "/3d/coin/orca.glb", ratio: 2, scale: [0.2, 0.2, 0.2] },
    { glbPath: "/3d/coin/daiko.glb", ratio: 0, scale: [0.2, 0.2, 0.2] },
  ],
  batchCount: 20,
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
  const scaled = probabilities.map((p) => (p * n) / sum);
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
  [...small, ...large].forEach((i) => {
    prob[i] = 1;
    alias[i] = i;
  });
  return { prob, alias };
}

const ratios = coinConfig.coins.map((coin) => coin.ratio);
const { prob: coinAliasProbabilities, alias: coinAliasIndices } = createAlias(ratios);

/**
 * Returns a random index for coinConfig.coins according to configured ratios in O(1).
 */
export function getRandomCoinModelIndex(): number {
  const k = Math.floor(Math.random() * coinConfig.coins.length);
  return Math.random() < coinAliasProbabilities[k] ? k : coinAliasIndices[k];
}
