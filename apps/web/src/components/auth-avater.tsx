"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";

export const AuthAvatar: React.FC<{ className?: string; size?: number }> = ({ className, size = 40 }) => {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return <Skeleton className={cn("rounded-full", className)} style={{ height: size, width: size }} />;
  }

  if (status === "unauthenticated" || !user) {
    return null;
  }

  return (
    <Image
      src={user.image ?? "/default-avatar.png"}
      alt={user.name ?? "User Avatar"}
      height={size}
      width={size}
      className={cn("rounded-full", className)}
      onError={(e) => {
        e.currentTarget.src = "/default-avatar.png";
      }}
    />
  );
};
