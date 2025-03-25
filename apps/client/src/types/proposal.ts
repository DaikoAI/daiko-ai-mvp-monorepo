export interface Source {
  name: string;
  url: string;
}

export interface FinancialImpact {
  currentValue: number; // 現在の価値（USD）
  projectedValue: number; // 予測される価値（USD）
  percentChange: number; // 変化率（%）
  timeFrame: string; // 時間枠（例："1 year", "30 days"）
  riskLevel: "low" | "medium" | "high"; // リスクレベル
}

export interface Proposal {
  id: string;
  title: string;
  summary: string;
  reason: string[];
  sources: Source[];
  type?: "trade" | "stake" | "risk" | "opportunity";
  proposedBy?: string;
  financialImpact?: FinancialImpact; // 損益情報
  expires_at?: Date; // 有効期限
}

// ユーザー設定の型
export interface ProposalUserPreference {
  hideProposal: boolean; // 同様の提案を表示しない
  holdToken: boolean; // トークンを一定期間保持する
  holdUntil: string; // 保持期間
}
