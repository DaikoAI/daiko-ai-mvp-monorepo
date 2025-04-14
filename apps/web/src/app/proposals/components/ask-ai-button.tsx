import { Button } from "@/components/ui/button";
import { api, type RouterOutputs } from "@/trpc/react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

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
      size="sm"
      onClick={handleAskAI}
      className="w-full justify-center items-center bg-white text-black font-bold rounded-full h-9 text-base hover:bg-gray-200 shadow-[0px_0px_6px_0px_rgba(255,255,255,0.24)]"
    >
      Ask AI for More Details
      <ChevronRight className="ml-1 h-4 w-4" />
    </Button>
  );
};
