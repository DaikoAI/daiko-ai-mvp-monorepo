import { config } from "dotenv";
import fs from "node:fs";
import { Writable } from "node:stream";

// Load environment variables
config();

const main = async () => {
  const { initProposalAgentGraph } = await import("../src/agents");
  const { agent } = await initProposalAgentGraph("analysis-manual");

  const graphBlob = await (
    await agent.getGraphAsync()
  ).drawMermaidPng({
    withStyles: true,
    curveStyle: "linear",
  });

  const stream = graphBlob.stream();
  const writeStream = fs.createWriteStream("docs/graph.png");
  await stream.pipeTo(Writable.toWeb(writeStream));
};

main();
