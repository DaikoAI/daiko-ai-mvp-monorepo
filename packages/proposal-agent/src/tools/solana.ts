import { createSolanaTools } from "solana-agent-kit";
import { solanaAgent } from "../utils/solanaAgent";

export const solanaTools = () => {
    const tools = createSolanaTools(solanaAgent);
    return tools;
};
