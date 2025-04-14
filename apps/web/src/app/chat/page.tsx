import { AuthAvatar } from "@/components/auth-avater";
import Link from "next/link";
import { Suspense } from "react";
import { NewChatButton } from "./components/new-chat-button"; // Client Component
import { SearchBox } from "./components/search-box"; // Client Component
import { ThreadList } from "./components/thread-list"; // Server Component

interface ChatListPageProps {
  searchParams?: Promise<{
    q?: string;
  }>;
}

export default async function ChatListPage({ searchParams }: ChatListPageProps) {
  const searchQuery = (await searchParams)?.q || "";

  return (
    <main className="flex flex-col safe-main-container h-screen">
      <header className="flex items-center justify-between px-4 py-6">
        <Link href="/profile" className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
            <AuthAvatar />
          </div>
        </Link>
        <NewChatButton />
      </header>

      <SearchBox />

      <Suspense fallback={<ThreadList.Skeleton />}>
        <ThreadList searchQuery={searchQuery} />
      </Suspense>
    </main>
  );
}
