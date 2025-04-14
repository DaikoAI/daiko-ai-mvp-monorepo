import { type TokenSelect as Token } from "@daiko-ai/shared";

interface SwapValidationError {
  message: string;
}

interface SwapValidationResult {
  isValid: boolean;
  error?: SwapValidationError;
}

export const validateSwap = (
  fromToken: Token,
  toToken: Token,
  fromAmount: string,
  fromBalance: number,
): SwapValidationResult => {
  // Check for empty or invalid amount
  const numericAmount = Number(fromAmount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      isValid: false,
      error: { message: "Invalid amount" },
    };
  }

  // Check for insufficient balance
  if (numericAmount > fromBalance) {
    return {
      isValid: false,
      error: { message: `You don't have enough ${fromToken.symbol}` },
    };
  }

  // Check if trying to swap same token
  if (fromToken === toToken) {
    return {
      isValid: false,
      error: { message: "Cannot swap to the same token" },
    };
  }

  // Check if trying to swap to staking token from non-SOL token
  if (toToken.type === "liquid_staking" && fromToken.symbol !== "SOL") {
    return {
      isValid: false,
      error: { message: "Staking tokens can only be swapped from SOL" },
    };
  }

  return { isValid: true };
};

export const isInsufficientBalance = (fromAmount: string, fromBalance: number): boolean => {
  return Number(fromAmount) > fromBalance;
};

export const isValidAmount = (fromAmount: string): boolean => {
  return Number(fromAmount) > 0;
};

export const canSwap = (
  fromToken: Token,
  toToken: Token,
  fromAmount: string,
  fromBalance: number,
  isSwapping: boolean,
): boolean => {
  const validationResult = validateSwap(fromToken, toToken, fromAmount, fromBalance);
  return validationResult.isValid && !isSwapping;
};
