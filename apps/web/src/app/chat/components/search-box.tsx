"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function SearchBox() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Initialize state with current URL param or empty string
  const [inputValue, setInputValue] = useState(searchParams.get("q")?.toString() || "");

  const handleSearch = useDebouncedCallback((term: string) => {
    console.log(`Searching... ${term}`);
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300); // Debounce search input by 300ms

  // Update input value if URL param changes externally
  useEffect(() => {
    setInputValue(searchParams.get("q")?.toString() || "");
  }, [searchParams]);

  return (
    <div className="px-4 py-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search chats..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            handleSearch(e.target.value);
          }}
          className="w-full rounded-full bg-white/10 pl-10 pr-5 py-2 text-base border-none focus:ring-0 focus:outline-none h-10"
        />
      </div>
    </div>
  );
}
