import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils";
import type { Attachment, UIMessage } from "ai";
import type { UseChatHelpers } from "ai/react";
import { ArrowUp, Square } from "lucide-react";
import { memo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useWindowSize } from "usehooks-ts";

interface MultimodalInputProps {
  threadId: string;
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: any) => void;
  status: string;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: (attachments: Array<Attachment>) => void;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  append: UseChatHelpers["append"];
  className?: string;
}

const PureMultimodalInput: React.FC<MultimodalInputProps> = ({
  threadId,
  input,
  status,
  messages,
  className,
  setInput,
  handleSubmit,
  stop,
  setMessages,
}: MultimodalInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "98px";
    }
  };

  const submitForm = useCallback(() => {
    window.history.replaceState({}, "", `/chat/${threadId}`);
    handleSubmit(undefined);
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [handleSubmit, width, threadId]);

  return (
    <div className="relative w-full flex flex-col gap-4">
      <Textarea
        ref={textareaRef}
        placeholder="Send a message..."
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          adjustHeight();
        }}
        className={cn(
          "min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none !text-base bg-transparent mb-safe !pb-4 px-4 !border-none !rounded-t-2xl",
          className,
        )}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();

            if (status !== "ready") {
              toast.error("Please wait for the model to finish its response!");
            } else {
              submitForm();
            }
          }
        }}
      />

      <div className="absolute bottom-4 right-2 p-2 w-fit">
        {status === "submitted" && messages.length > 0 && messages[messages.length - 1]?.role === "user" ? (
          <Button
            data-testid="stop-button"
            className="rounded-full p-1.5 h-fit border bg-white hover:bg-white/90"
            onClick={(event) => {
              event.preventDefault();
              stop();
              setMessages((messages) => messages);
            }}
          >
            <Square className="size-3 text-black" fill="black" />
          </Button>
        ) : (
          <Button
            data-testid="send-button"
            className="rounded-full p-1.5 h-fit border bg-white hover:bg-white/90"
            onClick={(event) => {
              event.preventDefault();
              submitForm();
            }}
            disabled={input.length === 0}
          >
            <ArrowUp className="size-4 stroke-3 text-black" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const MultimodalInput = memo(PureMultimodalInput);
