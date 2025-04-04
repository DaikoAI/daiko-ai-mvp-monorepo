import type { NextPage } from "next";
import { ChatInterface } from "./components/chat-interface";

interface ChatPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

const ChatPage: NextPage<ChatPageProps> = async ({ searchParams }) => {
  const { q } = await searchParams;

  return (
    <div className="flex flex-col safe-chat-container pb-safe">
      <div className="px-4 py-6 flex items-center">
        <h1 className="text-2xl font-bold">Chat</h1>
      </div>

      <div className="flex-1 relative">
        <ChatInterface question={q} />
      </div>
    </div>
  );
};

export default ChatPage;
