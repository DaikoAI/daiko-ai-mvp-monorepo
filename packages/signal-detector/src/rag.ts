import { TavilySearchAPIRetriever } from "@langchain/community/retrievers/tavily_search_api";
import { OpenAIEmbeddings } from "@langchain/openai";
import fs from "fs";
import { Document } from "langchain/document";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import path from "path";

let vectorStore: MemoryVectorStore | null = null;

/**
 * Initialize or return existing in-memory vector store built from project specs.
 */
async function initializeVectorStore(): Promise<MemoryVectorStore> {
  if (vectorStore) return vectorStore;
  const specsDir = path.resolve(process.cwd(), "docs/specs");
  const docs: Document[] = [];
  if (fs.existsSync(specsDir)) {
    const files = fs.readdirSync(specsDir).filter((f) => f.endsWith(".md") || f.endsWith(".txt"));
    for (const file of files) {
      const loader = new TextLoader(path.join(specsDir, file));
      const loaded = await loader.load();
      docs.push(...loaded);
    }
  }
  const embeddings = new OpenAIEmbeddings({});
  vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  return vectorStore;
}

/**
 * Retrieves relevant project context for the given token symbol via vector search,
 * with fallback to TavilySearch if no matches found and API key is configured.
 * @param tokenSymbol Token symbol to search context for.
 */
export async function getProjectContext(tokenSymbol: string): Promise<string[]> {
  const store = await initializeVectorStore();
  const results = await store.similaritySearch(tokenSymbol, 3);
  let contexts = results.map((doc) => doc.pageContent.trim()).filter(Boolean);
  // Fallback to web search if no context and Tavily API key provided
  if (contexts.length === 0 && process.env.TAVILY_API_KEY) {
    const retriever = new TavilySearchAPIRetriever({ apiKey: process.env.TAVILY_API_KEY, k: 3 });
    try {
      const webDocs = await retriever.invoke(tokenSymbol);
      contexts = (webDocs || []).map((d) => d.pageContent?.trim() || "").filter(Boolean);
    } catch (error) {
      // ignore fallback errors
    }
  }
  return contexts;
}

/**
 * Builds a combined project context block for inclusion in LLM prompt.
 */
export function buildProjectContextBlock(contexts: string[]): string {
  if (!contexts || contexts.length === 0) {
    return "Relevant Project Knowledge: None available.";
  }
  const formatted = contexts.map((c) => `- ${c}`).join("\n");
  return `Relevant Project Knowledge:\nSTART_PROJECT_CONTEXT\n${formatted}\nEND_PROJECT_CONTEXT`;
}
