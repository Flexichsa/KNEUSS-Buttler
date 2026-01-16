import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SingleCoinSettings } from "@shared/schema";

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

const COIN_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  bitcoin: { from: "from-orange-600", to: "to-amber-500", accent: "text-amber-400" },
  ethereum: { from: "from-indigo-600", to: "to-purple-500", accent: "text-purple-400" },
  solana: { from: "from-purple-600", to: "to-fuchsia-500", accent: "text-fuchsia-400" },
  dogecoin: { from: "from-yellow-500", to: "to-amber-400", accent: "text-yellow-400" },
  cardano: { from: "from-blue-600", to: "to-cyan-500", accent: "text-cyan-400" },
  ripple: { from: "from-slate-500", to: "to-slate-400", accent: "text-slate-300" },
  litecoin: { from: "from-slate-400", to: "to-blue-400", accent: "text-blue-400" },
  binancecoin: { from: "from-yellow-500", to: "to-yellow-400", accent: "text-yellow-400" },
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGradSmall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points} 100,100`}
        fill="url(#sparkGradSmall)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

function formatCompactPrice(price: number): string {
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}K`;
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  return `$${price.toFixed(4)}`;
}

interface SingleCoinWidgetProps {
  settings?: SingleCoinSettings;
}

export function SingleCoinWidget({ settings }: SingleCoinWidgetProps) {
  const coinId = settings?.coinId || "bitcoin";

  const { data, isLoading, error } = useQuery<CryptoResponse>({
    queryKey: ["crypto-prices"],
    queryFn: async () => {
      const res = await fetch("/api/crypto");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const coin = useMemo(() => {
    return data?.coins?.find(c => c.id === coinId);
  }, [data, coinId]);

  const coinIcon = COIN_ICONS[coinId] || "?";
  const colors = COIN_COLORS[coinId] || { from: "from-slate-600", to: "to-slate-500", accent: "text-slate-400" };

  if (isLoading) {
    return (
      <div 
        className={cn(
          "h-full rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br", colors.from, colors.to
        )}
        data-testid={`single-coin-widget-${coinId}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-white/50" />
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div 
        className={cn(
          "h-full rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br", colors.from, colors.to
        )}
        data-testid={`single-coin-widget-${coinId}`}
      >
        <div className="text-white/60 text-sm">N/A</div>
      </div>
    );
  }

  const isPositive = coin.change24h >= 0;
  const Icon = isPositive ? ArrowUp : ArrowDown;

  return (
    <div 
      className={cn(
        "h-full rounded-2xl overflow-hidden flex flex-col relative",
        "bg-gradient-to-br", colors.from, colors.to,
        "shadow-lg"
      )}
      data-testid={`single-coin-widget-${coinId}`}
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <MiniSparkline data={coin.sparkline} color="white" />
      </div>

      <div className="relative z-10 p-3 flex flex-col h-full justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold shadow-inner">
            {coinIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/80 text-xs font-medium truncate">{coin.symbol.toUpperCase()}</div>
          </div>
        </div>

        <div className="text-center py-2">
          <div className="text-white text-xl font-bold drop-shadow-lg">
            {formatCompactPrice(coin.price)}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full",
            isPositive ? "bg-white/20 text-white" : "bg-black/20 text-white"
          )}>
            <Icon className="h-3 w-3" />
            <span className="text-sm font-bold">
              {isPositive ? "+" : ""}{coin.change24h.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
