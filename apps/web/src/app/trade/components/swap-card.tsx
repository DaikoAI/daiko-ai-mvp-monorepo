import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/server";
import { SwapForm } from "./swap-form";

const SwapCardComponent: React.FC = async () => {
  const tokens = await api.token.getAllTokens();

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <SwapForm tokens={tokens} />
      </CardContent>
    </Card>
  );
};

export const SwapCard = Object.assign(SwapCardComponent, {
  Skeleton: () => (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <Skeleton className="w-full h-full" />
      </CardContent>
    </Card>
  ),
});
