import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

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

const COIN_LOGOS: Record<string, { bg: string; icon: React.ReactNode }> = {
  ripple: {
    bg: "bg-slate-800",
    icon: <span className="text-white text-lg font-bold">X</span>
  },
  diem: {
    bg: "bg-purple-100",
    icon: <span className="text-purple-600 text-lg">≈</span>
  },
  monero: {
    bg: "bg-orange-500",
    icon: <span className="text-white text-lg font-bold">M</span>
  },
  bitcoin: {
    bg: "bg-orange-500",
    icon: <span className="text-white text-lg font-bold">₿</span>
  },
  ethereum: {
    bg: "bg-slate-700",
    icon: <span className="text-white text-lg font-bold">Ξ</span>
  },
  solana: {
    bg: "bg-gradient-to-br from-purple-500 to-teal-400",
    icon: <span className="text-white text-lg font-bold">◎</span>
  },
  dogecoin: {
    bg: "bg-amber-400",
    icon: <span className="text-white text-lg font-bold">Ð</span>
  },
  cardano: {
    bg: "bg-blue-600",
    icon: <span className="text-white text-lg font-bold">₳</span>
  },
};

const DISPLAY_NAMES: Record<string, string> = {
  ripple: "XRP",
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  solana: "Solana",
  dogecoin: "Dogecoin",
  cardano: "Cardano",
  monero: "Monero",
  diem: "Diem",
};

function CoinCard({ coin }: { coin: CoinData }) {
  const isPositive = coin.change24h >= 0;
  
  const sparklineData = useMemo(() => {
    if (!coin.sparkline?.length) return [];
    const step = Math.max(1, Math.floor(coin.sparkline.length / 12));
    return coin.sparkline
      .filter((_, i) => i % step === 0)
      .map((price, i) => ({ x: i, price }));
  }, [coin.sparkline]);

  const formatPrice = (price: number) => {
    if (price >= 100) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(8)}`;
    }
  };

  const logoConfig = COIN_LOGOS[coin.id] || {
    bg: "bg-gray-400",
    icon: <span className="text-white text-lg font-bold">{coin.symbol[0]}</span>
  };

  const displayName = DISPLAY_NAMES[coin.id] || coin.name;

  return (
    <div 
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-shrink-0 min-w-[140px]"
      data-testid={`gainers-losers-coin-${coin.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-full ${logoConfig.bg} flex items-center justify-center`}>
          {logoConfig.icon}
        </div>
        <div className="h-8 w-16">
          {sparklineData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`gl-gradient-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"} />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#22c55e" : "#ef4444"}
                  strokeWidth={1.5}
                  fill={`url(#gl-gradient-${coin.id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      <div className="mt-3">
        <div className="text-gray-900 font-semibold text-sm">{displayName}</div>
        <div className="text-gray-500 text-xs mt-0.5">{formatPrice(coin.price)}</div>
      </div>
      
      <div className="mt-2 flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="h-3 w-3 text-green-500" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500" />
        )}
        <span className={`text-xs font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {Math.abs(coin.change24h).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export function GainersLosersWidget() {
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

  const sortedCoins = useMemo(() => {
    if (!data?.coins) return [];
    return [...data.coins].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 6);
  }, [data?.coins]);

  return (
    <div className="h-full p-5 pr-14 flex flex-col" data-testid="gainers-losers-widget">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Gainers & Losers</h2>
        <button 
          className="text-sm text-blue-500 font-medium hover:text-blue-600 transition-colors"
          data-testid="button-see-all-crypto"
        >
          See All
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Nicht verfügbar</p>
        </div>
      ) : sortedCoins.length > 0 ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 pb-2">
            {sortedCoins.map((coin) => (
              <CoinCard key={coin.id} coin={coin} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Keine Daten
        </div>
      )}
    </div>
  );
}
