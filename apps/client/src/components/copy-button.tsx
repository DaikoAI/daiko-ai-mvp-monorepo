"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [copied]);

  const onClick = useCallback(() => {
    setCopied(true);
    navigator.clipboard.writeText(value);
  }, [value]);

  return (
    <button disabled={copied} onClick={onClick} className="text-white hover:text-primary transition-colors">
      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
    </button>
  );
};
