import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { ChevronLeft } from "lucide-react";
import type { NextPage } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChatInterface } from "../components/chat-interface";

interface ChatThreadPageProps {
  params: Promise<{
    threadId: string;
  }>;
}

const ChatThreadPage: NextPage<ChatThreadPageProps> = async ({ params }) => {
  const { threadId } = await params;
  const session = await auth();
  if (!session) {
    redirect("/onboarding"); // Or your login page
  }

  // TODO: Fetch thread title based on threadId to display in header

  return (
    <main className="flex flex-col pb-safe h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-white/10">
        <Link href="/chat">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back to Chats</span>
          </Button>
        </Link>
        {/* TODO: Replace with dynamic thread title */}
        <h1 className="text-xl font-semibold truncate mx-4 flex-1 text-center">Chat title</h1>
      </header>

      {/* Chat Interface takes full height minus header */}
      <div className="flex-1 relative">
        <ChatInterface threadId={threadId} />
      </div>
    </main>
  );
};

export default ChatThreadPage;
