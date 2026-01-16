import { TrendingUp, TrendingDown, Loader2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

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

const COIN_LOGOS: Record<string, { bg: string; icon: string; color: string }> = {
  bitcoin: { bg: "#F7931A", icon: "₿", color: "white" },
  ethereum: { bg: "#627EEA", icon: "Ξ", color: "white" },
  solana: { bg: "#14F195", icon: "◎", color: "black" },
  dogecoin: { bg: "#C2A633", icon: "Ð", color: "white" },
  cardano: { bg: "#0033AD", icon: "₳", color: "white" },
  ripple: { bg: "#23292F", icon: "✕", color: "white" },
};

interface CryptoSettings {
  coins?: string[];
  show1h?: boolean;
  show24h?: boolean;
  show7d?: boolean;
  showChart?: boolean;
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)} Tn`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)} Bn`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)} Mn`;
  return `$${num.toLocaleString()}`;
}

function CoinCard({ coin, onRefresh }: { coin: CoinData; onRefresh: () => void }) {
  const sparklineData = useMemo(() => {
    if (!coin.sparkline?.length) return [];
    const step = Math.max(1, Math.floor(coin.sparkline.length / 15));
    return coin.sparkline
      .filter((_, i) => i % step === 0)
      .map((price, i) => ({ x: i, price }));
  }, [coin.sparkline]);

  const isPositive = coin.change24h >= 0;
  const logo = COIN_LOGOS[coin.id] || { bg: "#6366f1", icon: coin.symbol[0], color: "white" };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div 
      className="h-full bg-white rounded-2xl p-4 pr-12 flex flex-col"
      data-testid={`crypto-card-${coin.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-md"
            style={{ backgroundColor: logo.bg, color: logo.color }}
          >
            {logo.icon}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900">{coin.name}</span>
            <span className="text-gray-400 text-sm">{coin.symbol.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a 
            href={`https://coinmarketcap.com/currencies/${coin.id}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            data-testid="btn-coinmarketcap"
            title="Auf CoinMarketCap ansehen"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
          <button 
            onClick={onRefresh}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            data-testid="btn-refresh-crypto"
            title="Aktualisieren"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="text-3xl font-bold text-gray-900 mb-2">
        {formatPrice(coin.price)}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium",
          isPositive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
        )}>
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>{isPositive ? "+" : ""}{coin.change24h.toFixed(2)}%</span>
        </div>
        
        {sparklineData.length > 0 && (
          <div className="flex-1 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`card-gradient-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"} />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#22c55e" : "#ef4444"}
                  strokeWidth={1.5}
                  fill={`url(#card-gradient-${coin.id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex gap-6 mt-auto pt-2 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Market Cap</div>
          <div className="text-sm font-semibold text-gray-700">{formatLargeNumber(coin.marketCap)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">24h Volume</div>
          <div className="text-sm font-semibold text-gray-700">{formatLargeNumber(coin.volume)}</div>
        </div>
      </div>
    </div>
  );
}

interface BtcWidgetProps {
  settings?: CryptoSettings;
}

export function BtcWidget({ settings }: BtcWidgetProps) {
  const queryClient = useQueryClient();
  const selectedCoins = settings?.coins || ["bitcoin"];
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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["crypto-prices"] });
  };

  const firstCoin = data?.coins?.find(coin => selectedCoins.includes(coin.id));

  return (
    <div className="h-full" data-testid="crypto-widget">
      {isLoading ? (
        <div className="h-full bg-white rounded-2xl flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="h-full bg-white rounded-2xl flex flex-col items-center justify-center text-center px-4">
          <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Nicht verfügbar</p>
        </div>
      ) : firstCoin ? (
        <CoinCard coin={firstCoin} onRefresh={handleRefresh} />
      ) : (
        <div className="h-full bg-white rounded-2xl flex items-center justify-center text-gray-400 text-sm">
          Keine Daten
        </div>
      )}
    </div>
  );
}
