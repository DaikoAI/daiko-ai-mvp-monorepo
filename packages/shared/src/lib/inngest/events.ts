import { EventSchemas } from "inngest";

/**
 * Type map for all Inngest events used in the Daiko AI application.
 * Event names should follow a convention like 'domain/event.verb' or 'feature.event'.
 * Example: 'data/tweet.updated', 'processing/signal.detected', 'notification/proposal.created'
 */
export type DaikoEvents = {
  // Data source update events
  "data/tweet.updated": {
    data: { updatedAccountIds: string[] /* Add more fields */ };
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
    data: { signalId: string };
  };

  "proposal/dispatched": {
    // New event for user-specific proposal generation
    data: {
      signalId: string;
      userId: string;
    };
  };

  "proposal/generated": {
    // New event sent after a specific user's proposal is generated
    data: {
      signalId: string;
      userId: string;
    };
  };

  "notification/proposal.created": {
    data: {
      proposalId: string;
    };
  };
};

// Optional: If you want stricter event schemas (useful for validation)
export const eventSchemas = new EventSchemas().fromRecord<DaikoEvents>();
