import { type TokenSelect as Token } from "@daiko-ai/shared";

/**
 * トークンペアが有効かどうかを判定する関数
 */
export const isValidTokenPair = (fromToken: Token, toToken: Token): boolean => {
  // staking tokenへのswapはSOLからのみ許可
  if (toToken.type === "liquid_staking" && fromToken.symbol !== "SOL") {
    return false;
  }

  // 同じトークン同士のswapは不可
  if (fromToken === toToken) {
    return false;
  }

  return true;
};

/**
 * 選択可能なトークンをフィルタリングする関数
 */
export const getAvailableTokens = (tokens: Token[], selectedToken: Token | null, isFromToken: boolean): Token[] => {
  if (!selectedToken) return tokens;

  return tokens.filter((token) => {
    // FromToken選択時（ToTokenのフィルタリング）
    if (!isFromToken) {
      return isValidTokenPair(selectedToken, token);
    }

    // ToToken選択時（FromTokenのフィルタリング）
    return isValidTokenPair(token, selectedToken);
  });
};
