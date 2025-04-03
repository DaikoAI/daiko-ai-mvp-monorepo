import { ProposalInsert, ProposalRepository, ProposalSelect, db, proposalTable } from "@daiko-ai/shared";
import { and, eq, gt } from "drizzle-orm";

export class PostgresProposalRepository implements ProposalRepository {
  async findAll(): Promise<ProposalSelect[]> {
    return await db.select().from(proposalTable);
  }

  async findById(id: string): Promise<ProposalSelect | null> {
    const [proposal] = await db.select().from(proposalTable).where(eq(proposalTable.id, id)).limit(1);
    return proposal || null;
  }

  async findWhere<K extends keyof ProposalSelect>(
    field: K,
    operator: string,
    value: ProposalSelect[K],
  ): Promise<ProposalSelect[]> {
    // 簡易的な実装 - 実際には様々な演算子をサポートする必要がある
    if (operator === "=") {
      return await db
        .select()
        .from(proposalTable)
        .where(eq(proposalTable[field as keyof ProposalSelect], value));
    }
    return [];
  }

  async create(data: ProposalInsert): Promise<ProposalSelect> {
    const [proposal] = await db.insert(proposalTable).values(data).returning();
    return proposal;
  }

  async update(id: string, data: Partial<ProposalSelect>): Promise<void> {
    await db.update(proposalTable).set(data).where(eq(proposalTable.id, id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(proposalTable).where(eq(proposalTable.id, id));
  }

  async findByTriggerEventId(triggerEventId: string): Promise<ProposalSelect | null> {
    const [proposal] = await db.select().from(proposalTable).where(eq(proposalTable, triggerEventId)).limit(1);
    return proposal || null;
  }

  async findByUserId(userId: string): Promise<ProposalSelect[]> {
    return await db.select().from(proposalTable).where(eq(proposalTable.userId, userId));
  }

  async findActive(): Promise<ProposalSelect[]> {
    const now = new Date();
    return await db
      .select()
      .from(proposalTable)
      .where(and(gt(proposalTable.expires_at, now), eq(proposalTable.status, "active")));
  }

  async createProposal(proposal: ProposalInsert): Promise<ProposalSelect> {
    return await this.create(proposal);
  }

  async updateProposal(proposalId: string, proposal: Partial<ProposalSelect>): Promise<void> {
    await this.update(proposalId, {
      ...proposal,
      updatedAt: new Date(),
    });
  }
}
