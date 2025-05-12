import { z } from "zod";

// Possible suggestion types for signals
const SuggestionEnum = ["buy", "sell", "hold", "close_position", "stake"] as const;

export const LlmSignalResponseSchema = z.object({
  signalDetected: z.boolean(),
  tokenAddress: z.string(),
  sources: z.array(z.object({ url: z.string(), label: z.string() })),
  sentimentScore: z.number().min(-1).max(1),
  suggestionType: z.enum(SuggestionEnum),
  strength: z.number().min(1).max(100),
  confidence: z.number().min(0).max(1).nullable(),
  reasoning: z.string(),
  relatedTweetIds: z.array(z.string()),
  reasonInvalid: z.string().optional(),
  impactScore: z.number().min(1).max(10).nullable(),
});

export type LlmSignalResponseType = z.infer<typeof LlmSignalResponseSchema>;
