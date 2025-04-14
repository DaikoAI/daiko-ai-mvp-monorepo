import { Button } from "@/components/ui/button";
import { ArrowUp, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function Loading() {
  return (
    <div className="flex flex-col min-w-0 h-dvh relative">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-white/10">
        <Link href="/chat">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back to Chats</span>
          </Button>
        </Link>
        <h1 className="text-xl font-semibold truncate mx-4 flex-1 text-center">New Chat</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-36 pt-2"></div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-3xl">
        <form className="bg-white/10 backdrop-blur-[64px] border-t border-white/10 flex flex-col gap-3 rounded-t-2xl">
          <div className="relative w-full flex flex-col gap-4 h-[98px] pt-4 px-4">
            <p className="text-base text-muted-foreground">Send a message...</p>
            <div className="absolute bottom-4 right-2 p-2 w-fit">
              <Button
                className="rounded-full p-1.5 h-fit border bg-white hover:bg-white/90 text-primary-foreground"
                disabled
              >
                <ArrowUp className="size-4 stroke-3 text-black" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
