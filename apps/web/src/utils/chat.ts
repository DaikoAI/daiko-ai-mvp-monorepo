import type { UIMessage } from "ai";

export function convertToUIMessages(
  messages: Array<{ id: string; role: string; parts: any; attachments?: any; createdAt: Date }>,
): Array<UIMessage> {
  return messages.map(
    (message) =>
      ({
        id: message.id,
        role: message.role,
        content: message.parts[0]?.type === "text" ? message.parts[0].text : "",
        parts: message.parts,
        createdAt: message.createdAt,
        experimental_attachments: message.attachments ?? [],
      }) as UIMessage,
  );
}
