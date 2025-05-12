import { z } from "zod";

// Possible suggestion types for signals
const SuggestionEnum = ["buy", "sell", "hold", "close_position", "stake"] as const;

export const LlmSignalResponseSchema = z
  .object({
    signalDetected: z.boolean(),
    tokenAddress: z.string(),
    sources: z.array(z.object({ url: z.string(), label: z.string() })),
    sentimentScore: z.number().min(-1).max(1),
    suggestionType: z.enum(SuggestionEnum),
    strength: z.number().min(0).max(100).nullable(),
    confidence: z.number().min(0).max(1).nullable(),
    reasoning: z.string(),
    relatedTweetIds: z.array(z.string()),
    reasonInvalid: z.string().optional(),
    impactScore: z.number().min(1).max(10).nullable(),
  })
  .refine(
    (data) => {
      if (data.signalDetected) {
        // If signal detected, strength must be >= 1 and not null
        return data.strength !== null && data.strength >= 1;
      } else {
        // If signal not detected, strength must be 0 or null
        return data.strength === 0 || data.strength === null;
      }
    },
    {
      message: "Strength must be between 1-100 if signalDetected is true, and 0 or null if signalDetected is false",
      path: ["strength"], // Point error to the strength field
    },
  );

export type LlmSignalResponseType = z.infer<typeof LlmSignalResponseSchema>;
