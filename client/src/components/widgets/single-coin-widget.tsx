import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SingleCoinSettings } from "@shared/schema";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  rank: number;
  change1h: number;
  change24h: number;
  change7d: number;
  change30d: number;
  change1y: number;
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
  vechain: "V",
  binancecoin: "◆",
};

const COIN_COLORS: Record<string, { bg: string; icon: string }> = {
  bitcoin: { bg: "from-orange-600 to-amber-500", icon: "bg-gradient-to-br from-orange-500 to-yellow-500" },
  ethereum: { bg: "from-indigo-600 to-purple-500", icon: "bg-gradient-to-br from-indigo-500 to-purple-500" },
  solana: { bg: "from-purple-600 to-fuchsia-500", icon: "bg-gradient-to-br from-purple-500 to-fuchsia-500" },
  dogecoin: { bg: "from-yellow-500 to-amber-400", icon: "bg-gradient-to-br from-yellow-500 to-amber-400" },
  cardano: { bg: "from-blue-600 to-cyan-500", icon: "bg-gradient-to-br from-blue-500 to-cyan-500" },
  ripple: { bg: "from-slate-500 to-slate-400", icon: "bg-gradient-to-br from-slate-500 to-slate-400" },
  vechain: { bg: "from-blue-600 to-blue-400", icon: "bg-gradient-to-br from-blue-500 to-blue-400" },
};

function MiniSparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
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
        <linearGradient id="miniSparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points} 100,100`}
        fill="url(#miniSparkGrad)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

function formatCompactPrice(price: number): string {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
  if (price >= 1) return `$${price.toFixed(2)}`;
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
  const colors = COIN_COLORS[coinId] || { bg: "from-slate-600 to-slate-500", icon: "bg-gradient-to-br from-slate-500 to-slate-400" };

  if (isLoading) {
    return (
      <div 
        className={cn(
          "h-full rounded-2xl flex items-center justify-center bg-gradient-to-br",
          colors.bg
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
          "h-full rounded-2xl flex items-center justify-center bg-gradient-to-br",
          colors.bg
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
        "h-full rounded-2xl overflow-hidden flex flex-col relative bg-gradient-to-br",
        colors.bg
      )}
      data-testid={`single-coin-widget-${coinId}`}
    >
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <MiniSparkline data={coin.sparkline.slice(-24)} isPositive={isPositive} />
      </div>

      <div className="relative z-10 p-3 flex flex-col h-full">
        <div className="flex items-center gap-2">
          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg", colors.icon)}>
            {coinIcon}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-white text-xl font-bold drop-shadow-lg">
            {formatCompactPrice(coin.price)}
          </div>
          <div className={cn(
            "flex items-center gap-0.5 mt-1",
            isPositive ? "text-white" : "text-white/90"
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
