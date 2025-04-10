"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react"; // Import tRPC client
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter
import { toast } from "sonner";
import { revalidateChatList } from "../../actions";

export const NewChatButton = () => {
  const router = useRouter();
  const { mutateAsync, isPending } = api.chat.createThread.useMutation({
    onSuccess: async (data) => {
      // 新規チャット作成後にキャッシュを再検証
      await revalidateChatList();
      router.refresh();
      router.push(`/chat/${data.id}`);
    },
    onError: (error) => {
      console.error("Failed to create chat thread:", error);
      toast.error("Failed to start a new chat. Please try again.", {
        description: error.message,
      });
    },
  });

  const handleClick = async () => {
    await mutateAsync({});
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending} // Use mutation's pending state
      aria-label="Start New Chat"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-muted-foreground">New +</span>}
    </Button>
  );
};
