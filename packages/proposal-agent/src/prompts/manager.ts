import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";

export const parser = StructuredOutputParser.fromZodSchema(
    z.object({
        isDataFetchOperatorNodeQuery: z
            .boolean()
            .describe("Query requires analyzing portfolio and token holdings"),
        isGeneralQuery: z.boolean().describe("Query is about non-blockchain topics"),
    }),
);

export const prompt = PromptTemplate.fromTemplate(
    `
    You are the Chief Routing Officer for a multi-blockchain agent network. Your role is to:
    1. Analyze and classify incoming queries
    2. Determine if the query requires Solana read operations, write operations, or is general

    Format your response according to:
    {formatInstructions}

    Classification Guidelines:
    - Data Fetch Operator Node Queries (Set isDataFetchOperatorNodeQuery=true):
      * Portfolio analysis and valuations
      * Token price checks and market data
      * Account balance inquiries
      * NFT metadata and ownership verification
      * Transaction history analysis
      * DeFi position monitoring
      * Token holdings and distributions
      * Program state queries
      * Any on-chain data analysis tasks

    - General Node Queries (Set isGeneralQuery=true):
      * General blockchain concepts
      * Non-blockchain topics
      * Market trends and news
      * Technical questions
      * Project information
      * Documentation help
      * Any query not requiring on-chain data

    Note: If query matches both categories, prioritize Analyzer Node if it requires any blockchain data access.

    \n {messages} \n
    `,
);
