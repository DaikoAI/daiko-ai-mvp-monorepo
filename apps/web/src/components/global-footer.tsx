"use client";

import { cn } from "@/utils";
// import { useWallet } from "@solana/wallet-adapter-react";
import { FileText, MessageSquare, RefreshCcw, Wallet } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHaptic } from "use-haptic";

export const GlobalFooter: React.FC = () => {
  const pathname = usePathname();
  const { triggerHaptic } = useHaptic();
  // const { publicKey } = useWallet();
  const { data: session } = useSession();

  const navItems = [
    {
      name: "Portfolio",
      href: `/portfolio/${session?.user.walletAddress}`,
      icon: Wallet,
    },
    {
      name: "News",
      href: "/proposals",
      icon: FileText,
    },
    {
      name: "Trade",
      href: "/trade",
      icon: RefreshCcw,
    },
    {
      name: "Chat",
      href: "/chat",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/10 border-t border-white/20 pb-safe">
      <nav className="flex h-18 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive =
            (item.href.includes("/portfolio") && pathname.includes("/portfolio")) || item.href === pathname;

          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center space-y-1",
                isActive ? "text-white" : "text-white/50",
              )}
              onClick={() => triggerHaptic()}
            >
              <item.icon size={24} className={cn("transition-opacity", isActive ? "opacity-100" : "opacity-50")} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
