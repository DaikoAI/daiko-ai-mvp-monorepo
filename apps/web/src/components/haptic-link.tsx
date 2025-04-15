"use client";

import { cn } from "@/utils";
import Link, { type LinkProps } from "next/link";
import type { PropsWithChildren } from "react";
import { useHaptic } from "use-haptic";

export const HapticLink: React.FC<PropsWithChildren<LinkProps & { className?: string }>> = ({
  children,
  className,
  ...props
}) => {
  const { triggerHaptic } = useHaptic();

  return (
    <Link {...props} onClick={() => triggerHaptic()} className={cn(className)}>
      {children}
    </Link>
  );
};
