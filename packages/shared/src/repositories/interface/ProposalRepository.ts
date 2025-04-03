import { ProposalInsert, ProposalSelect } from "../../db/schema/proposals";
import { Repository } from "./Repository";

export interface ProposalRepository extends Repository<ProposalSelect, ProposalInsert> {
  /**
   * トリガーイベントIDに基づいて提案を検索
   * @param triggerEventId - トリガーイベントID
   */
  findByTriggerEventId(triggerEventId: string): Promise<ProposalSelect | null>;

  /**
   * ユーザーIDに基づいて提案を検索
   * @param userId - ユーザーID
   */
  findByUserId(userId: string): Promise<ProposalSelect[]>;

  /**
   * 有効期限が切れていない提案を検索
   */
  findActive(): Promise<ProposalSelect[]>;

  /**
   * 提案を作成
   * @param proposal - 提案データ
   */
  createProposal(proposal: ProposalInsert): Promise<ProposalSelect>;

  /**
   * 提案を更新
   * @param proposalId - 提案ID
   * @param proposal - 更新データ
   */
  updateProposal(proposalId: string, proposal: Partial<ProposalSelect>): Promise<void>;
}
