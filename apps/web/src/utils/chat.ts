import type { UIMessage } from "ai";

export function convertToUIMessages(
  messages: Array<{ id: string; role: string; parts: any; attachments?: any; createdAt: Date }>,
): Array<UIMessage> {
  return messages.map((message) => {
    // Ensure parts is an array and contains valid text content
    const parts = Array.isArray(message.parts)
      ? message.parts.map((part) => {
          if (part.type === "text") {
            // If text is an array containing a text object, extract the inner text
            if (Array.isArray(part.text) && part.text[0]?.type === "text") {
              return {
                type: "text",
                text: part.text[0].text,
              };
            }
            // If text is already a string, keep it as is
            if (typeof part.text === "string") {
              return part;
            }
            // Default to empty string if text is invalid
            return {
              type: "text",
              text: "",
            };
          }
          return part;
        })
      : [{ type: "text", text: "" }];

    const content = parts[0]?.type === "text" ? parts[0].text : "";

    return {
      id: message.id,
      role: message.role,
      content,
      parts,
      createdAt: message.createdAt,
      experimental_attachments: message.attachments ?? [],
    } as UIMessage;
  });
}
