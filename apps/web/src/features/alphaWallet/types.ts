/**
 * トークンの基本情報の型定義
 */
export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  isNative?: boolean;
}

/**
 * トークンのメタデータを管理するレジストリ
 */
export interface TokenRegistry {
  tokens: Record<string, TokenInfo>;
  addToken: (token: TokenInfo) => void;
  getToken: (symbol: string) => TokenInfo | undefined;
}

/**
 * 命令（Instruction）の基本型定義
 */
export interface AlphaTxInstruction {
  type: string;
  fromToken: {
    symbol: string;
    address: string;
  };
  toToken: {
    symbol: string;
    address: string;
  };
  fromAmount: string;
  toAmount?: string;
  metadata?: Record<string, unknown>;
}

/**
 * トランザクション本体の型定義
 */
export interface AlphaTx {
  id: string;
  description: string;
  requestedBy: string;
  timestamp: number;
  instruction: AlphaTxInstruction;
  metadata?: {
    source?: string;
    priority?: "low" | "medium" | "high";
    simulation?: {
      success: boolean;
      expectedOutcome?: Record<string, string>;
    };
  };
}

/**
 * トランザクション実行後の結果の型定義
 */
export interface AlphaTxResult {
  success: boolean;
  message?: string;
  error?: string;
  txId?: string;
  effects?: {
    tokenBalances: Record<string, string>;
    positions?: Record<string, unknown>;
  };
}

/**
 * dApp から見たウォレットのインターフェース
 */
export interface AlphaWalletInterface {
  requestTransaction: (tx: AlphaTx) => Promise<AlphaTxResult>;
  walletAddress?: string;
  isDrawerOpen: boolean;
}

/**
 * Contract Call Types
 */
export interface ContractCall {
  type: string;
  description: string;
  params: {
    fromToken: {
      symbol: string;
      address: string;
    };
    toToken: {
      symbol: string;
      address: string;
    };
    fromAmount: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Contract Call to Instruction conversion utility
 */
export function contractCallToInstruction(call: ContractCall): AlphaTxInstruction {
  return {
    type: call.type,
    fromToken: call.params.fromToken,
    toToken: call.params.toToken,
    fromAmount: call.params.fromAmount.toString(),
    metadata: call.metadata,
  };
}

/**
 * ユーザーバランスの更新ユーティリティ
 */
export function updateUserBalance(
  currentBalances: Record<string, string>,
  instruction: AlphaTxInstruction,
): Record<string, string> {
  const newBalances = { ...currentBalances };
  const fromAmount = BigInt(instruction.fromAmount);

  // 送信トークンの残高を減少
  const currentFromBalance = BigInt(newBalances[instruction.fromToken.address] || "0");
  newBalances[instruction.fromToken.address] = (currentFromBalance - fromAmount).toString();

  // 受信トークンの残高を増加
  const currentToBalance = BigInt(newBalances[instruction.toToken.address] || "0");
  newBalances[instruction.toToken.address] = (currentToBalance + fromAmount).toString();

  return newBalances;
}

/**
 * Proposalからトランザクションを生成するユーティリティ
 */
export function createTransactionFromProposal(proposal: { id: string; contractCall: ContractCall }): AlphaTx {
  if (!proposal.contractCall) {
    throw new Error("No contract call found in proposal");
  }

  return {
    id: proposal.id,
    description: proposal.contractCall.description,
    requestedBy: "proposal",
    timestamp: Date.now(),
    instruction: contractCallToInstruction(proposal.contractCall),
  };
}
