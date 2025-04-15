import { Chat } from "@/app/chat/components/chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { convertToUIMessages } from "@/utils/chat";
import type { NextPage } from "next";
import { notFound } from "next/navigation";

interface ChatPageProps {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ msg: string }>;
}

const ChatPage: NextPage<ChatPageProps> = async ({ params, searchParams }) => {
  const { threadId } = await params;
  const { msg } = await searchParams;

  const thread = await api.chat.getThread({
    threadId,
  });

  if (!thread) {
    notFound();
  }

  const session = await auth();

  const messages = await api.chat.getMessages({
    threadId,
  });

  return (
    <Chat
      thread={thread}
      initialMessages={convertToUIMessages(messages)}
      initialInput={msg}
      selectedChatModel={DEFAULT_CHAT_MODEL}
      isReadonly={session?.user?.id !== thread.userId}
    />
  );
};

export default ChatPage;
