import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/server";
import { formatChatListTimestamp } from "@/utils/date";
import Link from "next/link";

export const revalidate = 300;

interface ThreadListProps {
  searchQuery?: string;
}

export const ThreadListComponent: React.FC<ThreadListProps> = async ({ searchQuery }) => {
  const threads = await api.chat.getUserThreads({
    query: searchQuery,
  });

  console.log(threads);

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="space-y-2 p-4">
        {threads && threads.length > 0 ? (
          threads.map((thread) => (
            <li
              key={thread.id}
              className="rounded-xl bg-[rgba(255,255,255,0.12)] backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <Link href={`/chat/${thread.id}`} className="block p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <p className="text-base font-semibold text-white truncate flex-1 mr-4">{thread.title}</p>
                    <time dateTime={thread.updatedAt?.toISOString()} className="text-xs text-white/40 flex-shrink-0">
                      {formatChatListTimestamp(thread.updatedAt)}
                    </time>
                  </div>
                  <p className="text-sm text-white/60 line-clamp-2">
                    {(thread.lastMessage?.parts as Array<{ type: string; text?: string }>)?.[0]?.type === "text"
                      ? (thread.lastMessage?.parts as Array<{ type: string; text?: string }>)?.[0]?.text
                      : "No messages yet"}
                  </p>
                </div>
              </Link>
            </li>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? "No matching chats found." : "No chat history found. Start a new chat!"}
          </p>
        )}
      </ul>
    </div>
  );
};

export const ThreadList = Object.assign(ThreadListComponent, {
  Skeleton: () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {[...Array(5)].map((_, i) => (
        <li key={i} className="rounded-xl bg-[rgba(255,255,255,0.12)] p-4 backdrop-blur-sm shadow-sm list-none">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-2/3 bg-white/20 rounded" />
              <Skeleton className="h-3 w-1/4 bg-white/20 rounded" />
            </div>
            <Skeleton className="h-4 w-11/12 bg-white/20 rounded" />
          </div>
        </li>
      ))}
    </div>
  ),
});
