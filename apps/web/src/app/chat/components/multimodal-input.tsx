import type { Attachment, UIMessage } from "ai";
import type { UseChatHelpers } from "ai/react";
import cx from "classnames";
import { SendIcon, Square } from "lucide-react";
import { memo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useWindowSize } from "usehooks-ts";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";

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
  setInput,
  handleSubmit,
  status,
  stop,
  setMessages,
  className,
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
        className={cx(
          "min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700",
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

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {status === "in_progress" ? (
          <Button
            data-testid="stop-button"
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            onClick={(event) => {
              event.preventDefault();
              stop();
              setMessages((messages) => messages);
            }}
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            data-testid="send-button"
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            onClick={(event) => {
              event.preventDefault();
              submitForm();
            }}
            disabled={input.length === 0}
          >
            <SendIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const MultimodalInput = memo(PureMultimodalInput);
