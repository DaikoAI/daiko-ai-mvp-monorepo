import { AuthAvatar } from "@/components/auth-avater";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming Input component exists
import { Search } from "lucide-react"; // Import Search icon
import type { NextPage } from "next";
import Link from "next/link";

// Placeholder for chat threads data - replace with actual data fetching later
const mockThreads = [
  { id: "1", title: "First chat about SOL price", updatedAt: new Date(Date.now() - 3600 * 1000) },
  { id: "2", title: "Discussion on Perp Trading Strategy", updatedAt: new Date(Date.now() - 2 * 3600 * 1000) },
  { id: "3", title: "New Chat", updatedAt: new Date(Date.now() - 5 * 3600 * 1000) },
];

const ChatListPage: NextPage = async () => {
  // TODO: Fetch actual chat threads for the user
  const threads = mockThreads; // Use mock data for now

  // TODO: Implement search functionality

  return (
    <main className="flex flex-col safe-main-container h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-6">
        <Link href="/profile" className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
            <AuthAvatar />
          </div>
        </Link>
        <Link href={`/chat/new`}>
          <Button variant="ghost" size="sm">
            {" "}
            {/* Adjusted size */}
            <span className="text-muted-foreground">New +</span>
          </Button>
        </Link>
      </header>

      {/* Search Box */}
      {/* Figma Input Style */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Start typing..." // Figma placeholder text
            className="w-full rounded-full bg-white/10 pl-10 pr-5 py-2 text-base border-none focus:ring-0 focus:outline-none h-10"
            // Add onChange handler for search
          />
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {/* Figma List Style */}
        <ul className="space-y-2 p-4">
          {threads.map((thread) => (
            <li
              key={thread.id}
              className="rounded-xl bg-[rgba(255,255,255,0.12)] backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <Link href={`/chat/${thread.id}`} className="block p-4">
                {/* Content based on Figma */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <p className="text-base font-semibold text-white truncate flex-1 mr-4">{thread.title}</p>
                    <time dateTime={thread.updatedAt.toISOString()} className="text-xs text-white/40 flex-shrink-0">
                      {/* Format date like "17:23 15th Mar" - requires a date formatting library or custom function */}
                      {thread.updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                      {thread.updatedAt.toLocaleDateString([], { day: "numeric", month: "short" })}
                    </time>
                  </div>
                  {/* Placeholder for message snippet */}
                  <p className="text-sm text-white/60 line-clamp-2">
                    Detected unusual trading volume, bearish crossover in moving averages...
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {threads.length === 0 && <p className="text-center text-muted-foreground py-8">No chat history found.</p>}
        </ul>
      </div>
    </main>
  );
};

export default ChatListPage;
