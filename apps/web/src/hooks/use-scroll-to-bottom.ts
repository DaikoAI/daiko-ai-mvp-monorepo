import { useEffect, useRef } from "react";

export function useScrollToBottom<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const messagesEndRef = useRef<T>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  return [containerRef, messagesEndRef] as const;
}
