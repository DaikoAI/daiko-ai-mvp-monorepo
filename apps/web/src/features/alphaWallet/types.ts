/**
 * ウォレットが理解する命令（Instruction）の型定義
 */
export type AlphaTxInstruction =
  | {
      type: "transfer";
      fromToken: string;
      toToken: string;
      fromAmount: string;
      toAmount: string;
    }
  | {
      type: "stake";
      token: string;
      amount: string;
      apy: number;
    }
  | {
      type: "perp_open";
      token: string;
      collateral: string;
      leverage: number;
      direction: "long" | "short";
    }
  | {
      type: "perp_close";
      positionId: string;
    };

/**
 * トランザクション本体の型定義
 */
export interface AlphaTx {
  id?: string;
  instructions: AlphaTxInstruction[];
  description?: string;
  requestedBy?: string;
  timestamp?: number;
}

/**
 * トランザクション実行後の結果の型定義
 */
export interface AlphaTxResult {
  success: boolean;
  message?: string;
  error?: string;
  txId?: string;
}

/**
 * dApp から見たウォレットのインターフェース
 */
export interface AlphaWalletInterface {
  requestTransaction: (tx: AlphaTx) => Promise<AlphaTxResult>;
  walletAddress?: string;
  isDrawerOpen: boolean;
}
