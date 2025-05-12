// Load environment variables
import { config } from "dotenv";
config();

const main = async () => {
  const { initProposalGeneratorGraph } = await import("../src/index");
  const { graph, config } = await initProposalGeneratorGraph("signal-id", "signal-id");

  const result = await graph.invoke({}, config);

  console.log(result.proposal);

  // const proposalRepository = new PostgresProposalRepository();
  // if (result.proposal) {
  //   await proposalRepository.createProposal(result.proposal);
  // } else {
  //   console.error("提案が生成されませんでした");
  // }
};

main();
