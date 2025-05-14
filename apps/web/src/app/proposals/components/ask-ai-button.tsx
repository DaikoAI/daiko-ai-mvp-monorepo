import { Button } from "@/components/ui/button";
import { api, type RouterOutputs } from "@/trpc/react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import bg from "/public/rainbow-bg.jpg";

export const AskAIButton = ({ proposal }: { proposal: RouterOutputs["proposal"]["getProposals"][number] }) => {
  const router = useRouter();
  const { mutate: createThread } = api.chat.createThread.useMutation({
    onSuccess: (thread) => {
      const reasonText = proposal.reason.join(". ");
      router.push(
        `/chat/${thread.id}?msg=${encodeURIComponent(`Tell me more about this proposal: ${proposal.title}. ${reasonText}`)}`,
      );
    },
  });

  const handleAskAI = () => {
    createThread({
      title: `Proposal ${proposal.title}`,
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleAskAI}
      className="relative flex w-full items-center justify-center rounded-full py-2 px-4 text-base font-bold text-gray-800 overflow-hidden h-10 hover:opacity-90 transition-opacity border border-white/30"
      style={{
        background: `url(${bg.src}) center/cover no-repeat`,
      }}
    >
      <span className="relative z-10">Ask AI</span>
      <ChevronRight className="ml-2" size={20} strokeWidth={2.4} />
    </Button>
  );
};
