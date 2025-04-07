import { auth } from "@/server/auth";
import { cn } from "@/utils";
import Image from "next/image";

export const AuthAvatar: React.FC<{ className?: string; size?: number }> = async ({ className, size = 40 }) => {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return null;
  }

  return (
    <Image src={user?.image} alt={user?.name} height={size} width={size} className={cn("rounded-full", className)} />
  );
};
