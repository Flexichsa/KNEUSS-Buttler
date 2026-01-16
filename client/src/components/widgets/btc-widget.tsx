import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  change7d: number;
  change1h?: number;
  marketCap: number;
  volume: number;
  sparkline: number[];
  high24h: number;
  low24h: number;
}

interface CryptoResponse {
  coins: CoinData[];
  cached?: boolean;
  stale?: boolean;
}

const COIN_ICONS: Record<string, string> = {
  bitcoin: "₿",
  ethereum: "Ξ",
  solana: "◎",
  dogecoin: "Ð",
  cardano: "₳",
  ripple: "✕",
  litecoin: "Ł",
  polkadot: "●",
  chainlink: "⬡",
  stellar: "✦",
  monero: "ɱ",
  tron: "◈",
  binancecoin: "◆",
  usdtether: "₮",
  luna: "🌙",
};

interface CryptoSettings {
  coins?: string[];
  show1h?: boolean;
  show24h?: boolean;
  show7d?: boolean;
  showChart?: boolean;
}

interface BtcWidgetProps {
  settings?: CryptoSettings;
}

export function BtcWidget({ settings }: BtcWidgetProps) {
  const selectedCoins = settings?.coins || ["bitcoin"];
  const coinId = selectedCoins[0] || "bitcoin";
  
  const { data, isLoading, error } = useQuery<CryptoResponse>({
    queryKey: ["crypto-prices"],
    queryFn: async () => {
      const res = await fetch("/api/crypto");
      if (!res.ok) throw new Error("Failed to fetch crypto prices");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const coin = data?.coins?.find(c => c.id === coinId);
  const coinIcon = COIN_ICONS[coinId] || coin?.symbol?.[0] || "?";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div 
        className="h-full rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"
        data-testid="crypto-widget"
      >
        <Loader2 className="h-6 w-6 animate-spin text-white/50" />
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div 
        className="h-full rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"
        data-testid="crypto-widget"
      >
        <div className="text-white/60 text-sm">N/A</div>
      </div>
    );
  }

  const isPositive = coin.change24h >= 0;
  const changePercent = Math.abs(coin.change24h).toFixed(2);

  return (
    <div 
      className={cn(
        "h-full rounded-2xl overflow-hidden flex flex-col p-4 relative",
        isPositive 
          ? "bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-900/50" 
          : "bg-gradient-to-br from-slate-800 via-slate-800 to-rose-900/50"
      )}
      data-testid="crypto-widget"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-sm">
          {coinIcon}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">{coin.symbol.toUpperCase()}</span>
          <span className="text-white/60 text-xs">{formatPrice(coin.price)}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <span className={cn(
          "text-3xl font-bold",
          isPositive ? "text-emerald-400" : "text-rose-400"
        )}>
          {isPositive ? "+" : "-"}{changePercent}%
        </span>
      </div>

      <div className="text-center">
        <span className="text-white/40 text-[10px]">Press & hold to customize</span>
      </div>
    </div>
  );
}
