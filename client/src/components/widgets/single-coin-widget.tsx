import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
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

const COIN_INFO: Record<string, { icon: string; color: string; gradient: string }> = {
  bitcoin: { icon: "₿", color: "#F7931A", gradient: "from-orange-500 to-amber-600" },
  ethereum: { icon: "Ξ", color: "#627EEA", gradient: "from-indigo-500 to-purple-600" },
  solana: { icon: "◎", color: "#00FFA3", gradient: "from-emerald-400 to-teal-600" },
  dogecoin: { icon: "Ð", color: "#C3A634", gradient: "from-yellow-400 to-amber-500" },
  cardano: { icon: "₳", color: "#0033AD", gradient: "from-blue-600 to-indigo-700" },
  ripple: { icon: "✕", color: "#23292F", gradient: "from-slate-600 to-slate-800" },
  litecoin: { icon: "Ł", color: "#BFBBBB", gradient: "from-slate-400 to-slate-600" },
  polkadot: { icon: "●", color: "#E6007A", gradient: "from-pink-500 to-rose-600" },
  chainlink: { icon: "⬡", color: "#375BD2", gradient: "from-blue-500 to-indigo-600" },
  stellar: { icon: "✦", color: "#14B6E7", gradient: "from-cyan-400 to-blue-500" },
  monero: { icon: "ɱ", color: "#FF6600", gradient: "from-orange-500 to-red-600" },
  tron: { icon: "◈", color: "#FF0013", gradient: "from-red-500 to-rose-600" },
  binancecoin: { icon: "◆", color: "#F3BA2F", gradient: "from-yellow-400 to-amber-500" },
  usdtether: { icon: "₮", color: "#26A17B", gradient: "from-green-500 to-emerald-600" },
};

interface SingleCoinWidgetProps {
  settings?: SingleCoinSettings;
}

export function SingleCoinWidget({ settings }: SingleCoinWidgetProps) {
  const coinId = settings?.coinId || "bitcoin";
  const showChart = settings?.showChart !== false;
  const showChange = settings?.showChange !== false;
  const variant = settings?.variant || "detailed";

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

  const coinInfo = COIN_INFO[coinId] || { icon: "?", color: "#888", gradient: "from-slate-600 to-slate-800" };

  const sparklineData = useMemo(() => {
    if (!coin?.sparkline?.length) return [];
    const step = Math.max(1, Math.floor(coin.sparkline.length / 24));
    return coin.sparkline
      .filter((_, i) => i % step === 0)
      .map((price, i) => ({ x: i, price }));
  }, [coin?.sparkline]);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return new Intl.NumberFormat("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    }
    return new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className={cn(
        "h-full rounded-2xl flex items-center justify-center bg-gradient-to-br",
        coinInfo.gradient
      )} data-testid={`single-coin-widget-${coinId}`}>
        <Loader2 className="h-6 w-6 animate-spin text-white/50" />
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className={cn(
        "h-full rounded-2xl flex items-center justify-center bg-gradient-to-br",
        coinInfo.gradient
      )} data-testid={`single-coin-widget-${coinId}`}>
        <div className="text-white/60 text-sm">N/A</div>
      </div>
    );
  }

  const isPositive = coin.change24h >= 0;

  if (variant === "compact") {
    return (
      <div className="h-full bg-slate-900 rounded-2xl p-3 flex flex-col justify-between" data-testid={`single-coin-widget-${coinId}`}>
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: coinInfo.color + '33' }}
          >
            <span style={{ color: coinInfo.color }}>{coinInfo.icon}</span>
          </div>
          <div>
            <div className="text-xs text-white/60">{coin.symbol.toUpperCase()}</div>
            <div className={cn(
              "text-xs font-medium",
              isPositive ? "text-green-400" : "text-red-400"
            )}>
              {isPositive ? "+" : ""}{coin.change24h.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="text-xl font-bold text-white">${formatPrice(coin.price)}</div>
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className="h-full bg-slate-900 rounded-2xl overflow-hidden flex flex-col" data-testid={`single-coin-widget-${coinId}`}>
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: coinInfo.color + '33' }}
            >
              <span style={{ color: coinInfo.color }}>{coinInfo.icon}</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">{coin.name}</div>
              <div className="text-xs text-white/50">{coin.symbol.toUpperCase()}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">${formatPrice(coin.price)}</div>
            <div className={cn(
              "text-xs font-medium flex items-center justify-end gap-1",
              isPositive ? "text-green-400" : "text-red-400"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? "+" : ""}{coin.change24h.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="flex-1 px-2 pb-2">
          {sparklineData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`gradient-${coinId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? "#4ade80" : "#f87171"} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={isPositive ? "#4ade80" : "#f87171"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#4ade80" : "#f87171"}
                  strokeWidth={2}
                  fill={`url(#gradient-${coinId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full rounded-2xl overflow-hidden flex flex-col relative bg-gradient-to-br",
      coinInfo.gradient
    )} data-testid={`single-coin-widget-${coinId}`}>
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative z-10 p-4 flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl font-bold bg-white/20 text-white shadow-lg"
          >
            {coinInfo.icon}
          </div>
          {showChange && (
            <div className={cn(
              "px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1",
              isPositive ? "bg-green-500/30 text-green-200" : "bg-red-500/30 text-red-200"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? "+" : ""}{coin.change24h.toFixed(2)}%
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="text-white/70 text-sm font-medium">{coin.symbol.toUpperCase()}</div>
          <div className="text-2xl font-bold text-white">${formatPrice(coin.price)}</div>
        </div>

        {showChart && sparklineData.length > 0 && (
          <div className="h-12 mt-2 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`mini-gradient-${coinId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={1.5}
                  fill={`url(#mini-gradient-${coinId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
