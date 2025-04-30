import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
// import { generateProposal } from "@/lib/inngest/workflows/proposal";
import { notifyUser } from "@/lib/inngest/workflows/notification";

export const maxDuration = 300; // 5mins (Pro plan limit = 300 seconds)

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // generateProposal,
    notifyUser,
  ],
});
