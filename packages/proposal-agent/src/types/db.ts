// User type definition
export interface UserProfile {
    // Basic info
    userId: string;
    walletAddress: string;

    // Economic situation
    age?: number;

    // Risk tolerance for crypto assets (1-10)
    cryptoRiskTolerance?: number;

    // Asset information
    totalAssets?: number;
    cryptoAssets?: number;

    // Emotional state
    panicLevel?: number; // Self-reported panic level (1-10)
    heartRate?: number; // From wearable devices like CUDIS ring

    // Interest areas derived from chat history
    interests?: string[];

    // Last updated timestamp
    lastUpdated: number;

    // Chat history references
    chatHistory?: {
        messageId: string;
        timestamp: number;
        content: string;
    }[];

    // Input waiting state
    waitingForInput?: string | null;

    // Setup process tracking
    currentSetupStep?: string | null;
    setupCompleted?: boolean;
}
