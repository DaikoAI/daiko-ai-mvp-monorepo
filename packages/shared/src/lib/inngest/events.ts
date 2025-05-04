import { EventSchemas } from "inngest";
import type { ProposalSelect } from "../../db/schema"; // Import DB schema type

/**
 * Helper type: Represents a Proposal object after JSON serialization (Dates become strings).
 * Based on ProposalSelect, but adjust specific fields as needed.
 */
type ProposalSerialized = Omit<ProposalSelect, "createdAt" | "updatedAt" | "expires_at"> & {
  createdAt: string; // Date fields become strings
  updatedAt: string;
  expires_at: string | null; // Assuming expires_at can be null in the DB
};

/**
 * Defines the structure for the 'data/tweet.updated' event payload.
 */
type TweetUpdatedPayload = {
  updatedAccountIds: string[];
};

/**
 * Defines the structure for the 'signal.detected' event payload.
 * Placeholder - Adjust structure based on actual signal data.
 */
type SignalDetectedPayload = {
  signalId: string; // The ID of the detected signal record in the DB
  // Add other signal details, e.g., type, confidence, related data IDs
};

/**
 * Defines the structure for the 'proposal.created' event payload.
 * Contains an array of proposals generated from a single signal detection event.
 */
type ProposalCreatedPayload = {
  proposals: ProposalSerialized[]; // Use the serialized type
  // Removed single proposalId, signalId, userIds as per user code change
};

/**
 * Type map for all Inngest events used in the Daiko AI application.
 * Event names should follow a convention like 'domain/event.verb' or 'feature.event'.
 * Example: 'data/tweet.updated', 'processing/signal.detected', 'notification/proposal.created'
 */
export type DaikoEvents = {
  // Data source update events
  "data/tweet.updated": {
    data: TweetUpdatedPayload;
    // user?: { id: string }; // Optional: Associate event with a user/actor
  };
  "data/news.updated": {
    data: { newsId: string /* Add more fields */ };
  };
  "data/market_data.updated": {
    data: { tokenId: string /* Add more fields */ };
  };

  // Processing events
  "processing/signal.detected": {
    data: SignalDetectedPayload;
  };

  // Outcome/Notification events
  "notification/proposal.created": {
    data: ProposalCreatedPayload;
  };

  // --- Example Events (Keep or remove as needed) ---
  // If using the original names from web app directly:
  // tweetUpdated: { data: { xId: string } };
  // newsUpdated: { data: { newsId: string } };
  // signalDetected: { data: { signalId: string } };
  // proposalCreated: { data: { proposalId: string } };
};

// Optional: If you want stricter event schemas (useful for validation)
export const eventSchemas = new EventSchemas().fromRecord<DaikoEvents>();
