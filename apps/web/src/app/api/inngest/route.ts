import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateProposal } from "@/lib/inngest/workflows/proposal";
import { notifyUser } from "@/lib/inngest/workflows/notification";

export const { POST } = serve({
  client: inngest,
  functions: [generateProposal, notifyUser],
});
