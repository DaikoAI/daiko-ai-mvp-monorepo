import { HumanMessage } from "@langchain/core/messages";
import { config } from "dotenv";

// Load environment variables
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

  console.log(result);
};

main();
