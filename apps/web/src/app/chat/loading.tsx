import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex flex-col safe-chat-container pb-safe">
      <div className="px-4 py-6 flex items-center">
        <h1 className="text-2xl font-bold">Chat</h1>
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0 bottom-16 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* AI message skeleton - 初期メッセージ */}
            <div className="flex max-w-[80%] flex-col rounded-lg p-3 bg-secondary">
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6 mb-1" />
              <Skeleton className="h-4 w-4/6 mb-1" />
              <Skeleton className="h-3 w-16 self-end mt-1" />
            </div>

            {/* AI typing indicator は最初の読み込み時には表示しない */}
          </div>
        </div>

        {/* Input area */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-background pt-3 px-4 z-10">
          <div className="flex items-start space-x-2">
            <Skeleton className="flex-1 h-10 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
