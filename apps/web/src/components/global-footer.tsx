"use client";

import { cn } from "@/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { BarChart3, MessageSquare, ScrollText, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHaptic } from "use-haptic";

export const GlobalFooter: React.FC = () => {
  const pathname = usePathname();
  const { triggerHaptic } = useHaptic();
  const { publicKey } = useWallet();

  const navItems = [
    {
      name: "Portfolio",
      href: `/portfolio/${publicKey}`,
      icon: BarChart3,
    },
    {
      name: "Proposals",
      href: "/proposals",
      icon: ScrollText,
    },
    {
      name: "Chat",
      href: "/chat",
      icon: MessageSquare,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/60 border-t border-white/5 pb-safe">
      <nav className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center space-y-1 px-2 text-muted-foreground transition-colors hover:text-primary",
                isActive && "text-primary glow-text",
              )}
              onClick={() => triggerHaptic()}
            >
              <item.icon size={24} className={cn(isActive && "text-primary icon-highlight")} />
              <span className={cn("text-xs", isActive && "font-medium text-primary")}>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
