import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bitcoin, TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface BtcData {
  price: number;
  priceUsd?: number;
  cached?: boolean;
  stale?: boolean;
}

export function BtcWidget() {
  const { data, isLoading, error } = useQuery<BtcData>({
    queryKey: ["btc-price"],
    queryFn: async () => {
      const res = await fetch("/api/crypto/btc");
      if (!res.ok) throw new Error("Failed to fetch BTC price");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="h-full border-none shadow-sm bg-gradient-to-br from-orange-50 to-yellow-50 overflow-hidden flex flex-col">
      <CardHeader className="px-6 py-4 border-b bg-orange-100/50 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-orange-600/70">Krypto</span>
          <CardTitle className="text-lg font-bold tracking-tight text-orange-900 flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-orange-500" />
            Bitcoin
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4 flex-1 flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        ) : error ? (
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Preis nicht verfügbar</p>
          </div>
        ) : data ? (
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-900">
              {formatPrice(data.price)}
            </div>
            {data.priceUsd && (
              <div className="text-sm text-orange-600/70 mt-1">
                ${data.priceUsd.toLocaleString("en-US")} USD
              </div>
            )}
            {data.stale && (
              <div className="text-xs text-muted-foreground mt-2">
                (zwischengespeichert)
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
