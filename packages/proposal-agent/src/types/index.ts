export type SystemMessage = {
  content: string;
  tool_calls: {
    name: string;
    args: {
      input: string;
    };
    type: string;
    id: string;
  }[];
  usage_metadata?: {
    output_tokens: number;
    input_tokens: number;
    total_tokens: number;
  };
};

export type StreamChunk = {
  generalist: {
    messages: SystemMessage[];
  };
  analyzer: {
    messages: SystemMessage[];
  };
  manager: {
    messages: SystemMessage[];
  };
};

// Setup step definition
export enum SetupStep {
  WALLET_ADDRESS = "wallet_address",
  AGE = "age",
  RISK_TOLERANCE = "risk_tolerance",
  TOTAL_ASSETS = "total_assets",
  CRYPTO_ASSETS = "crypto_assets",
  PANIC_LEVEL = "panic_level",
  COMPLETE = "complete",
}
