import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlphaWalletProvider } from "@/features/alphaWallet/AlphaWalletProvider";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { SwapForm } from "./swap-form";

const SwapCardComponent: React.FC = async () => {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return <div>Please Login</div>;
  }

  const tokens = await api.token.getAllTokens();
  const portfolio = await api.portfolio.getUserPortfolio({
    walletAddress: session.user.walletAddress,
  });

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <AlphaWalletProvider>
          <SwapForm tokens={tokens} portfolio={portfolio.tokens} />
        </AlphaWalletProvider>
      </CardContent>
    </Card>
  );
};

export const SwapCard = Object.assign(SwapCardComponent, {
  Skeleton: () => (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[140px]" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          <div className="flex justify-center">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[140px]" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>

          <Skeleton className="h-11 w-full" />
        </div>
      </CardContent>
    </Card>
  ),
});
