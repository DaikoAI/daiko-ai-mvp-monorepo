import { db, proposalTable } from "@daiko-ai/shared";
import { proposalGeneratorState } from "../utils/state";
import { RunnableSequence } from "@langchain/core/runnables";
import { gpt4oMini } from "../utils/model";
import { proposalGenerationPrompt, parser } from "../prompts/proposalGeneration";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const proposalGenerationChain = RunnableSequence.from([proposalGenerationPrompt, gpt4oMini, parser]);

export const proposalGenerationNode = async (
  state: typeof proposalGeneratorState.State,
  options: LangGraphRunnableConfig,
) => {
  const threadId = options.configurable?.thread_id;
  if (!threadId) {
    throw new Error("thread_id is missing in config");
  }

  const { signalData, dbData } = state;

  if (!signalData || !dbData) {
    throw new Error("Required data (signalData, dbData) is missing in state.");
  }

  // 提案生成チェーンを実行
  const result = await proposalGenerationChain.invoke({
    signalData,
    marketData: dbData.marketData,
    tweets: dbData.tweets,
    news: dbData.news,
    portfolio: dbData.portfolio,
    userId: threadId,
  });

  // 生成された提案をDBに保存
  const insertedProposal = await db
    .insert(proposalTable)
    .values({
      userId: threadId,
      triggerEventId: signalData.id,
      title: result.proposal.title,
      summary: result.proposal.summary,
      reason: result.proposal.reason,
      sources: result.proposal.sources,
      type: result.proposal.type,
      proposedBy: "Daiko AI",
      financialImpact: result.proposal.financialImpact,
      expires_at: new Date(result.proposal.expires_at),
      contractCall: result.proposal.contractCall,
      status: "active",
    })
    .returning();

  if (!insertedProposal || insertedProposal.length === 0) {
    throw new Error("Failed to insert proposal into database.");
  }

  return {
    proposal: insertedProposal[0],
    processingStage: "moderation",
  };
};
