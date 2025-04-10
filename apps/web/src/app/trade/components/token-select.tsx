"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type TokenSelect as Token } from "@daiko-ai/shared";
import Image from "next/image";

interface TokenSelectProps {
  value: string;
  onChange: (value: string) => void;
  tokens: Token[];
}

export const TokenSelect: React.FC<TokenSelectProps> = ({ value, onChange, tokens }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {tokens.map((token) => (
          <SelectItem key={token.symbol} value={token.symbol}>
            <div className="flex items-center gap-2">
              <div className="relative h-5 w-5">
                <Image src={token.iconUrl} alt={token.name} fill className="rounded-full" />
              </div>
              <span>{token.symbol}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
