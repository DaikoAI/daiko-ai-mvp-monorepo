import { HumanMessage } from "@langchain/core/messages";
import { ProposalRepository } from "../src/repositories/proposalRepository";
// Load environment variables
import { config } from "dotenv";
config();

const main = async () => {
  const { initProposalAgentGraph } = await import("../src/agents");
  const { agent, config } = await initProposalAgentGraph("test-user");

  const result = await agent.invoke(
    {
      messages: [
        new HumanMessage(
          "Generate an analysis of the following wallet address: ESRjTPkB7YFhYQv9hn6nqTVHPcDLYUVhvCGE1WuRZWm5",
        ),
      ],
    },
    config,
  );

  console.log(result.proposal);

  const proposalRepository = new ProposalRepository();
  if (result.proposal) {
    await proposalRepository.createProposal(result.proposal);
  } else {
    console.error("提案が生成されませんでした");
  }
};

main();
