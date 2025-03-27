import { BaseRepository, COLLECTIONS, TradeProposal } from "@daiko-ai/shared";

export class ProposalRepository extends BaseRepository<TradeProposal> {
  constructor() {
    super(COLLECTIONS.TRADE_PROPOSALS);
  }

  /**
   * URLでサイトを検索
   * @param url - 検索するURL
   */
  async findByTriggerEventId(triggerEventId: string): Promise<TradeProposal | null> {
    return this.findOneByField("triggerEventId", triggerEventId);
  }

  /**
   * ユーザーIDに基づいてサイトリストを取得
   * @param userId - ユーザーID
   */
  async findByUserId(userId: string): Promise<TradeProposal[]> {
    return this.findWhere("userId", "array-contains", userId);
  }

  async createProposal(proposal: TradeProposal): Promise<string> {
    return this.create(proposal);
  }

  async updateProposal(proposalId: string, proposal: TradeProposal): Promise<void> {
    await this.update(proposalId, proposal);
  }
}
