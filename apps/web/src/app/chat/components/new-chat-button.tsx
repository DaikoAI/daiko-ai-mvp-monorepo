"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react"; // Import tRPC client
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter
import { toast } from "sonner";

export function NewChatButton() {
  const router = useRouter();

  // Use the tRPC mutation hook
  const createThreadMutation = api.chat.createThread.useMutation({
    onSuccess: (newThread) => {
      router.push(`/chat/${newThread.id}`);
    },
    onError: (error) => {
      console.error("Failed to create chat thread:", error);
      toast.error("Failed to start a new chat. Please try again.", {
        description: error.message,
      });
    },
  });

  const handleClick = () => {
    // Call the mutation
    createThreadMutation.mutate({});
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={createThreadMutation.isPending} // Use mutation's pending state
      aria-label="Start New Chat"
    >
      {createThreadMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <span className="text-muted-foreground">New +</span>
      )}
    </Button>
  );
}
