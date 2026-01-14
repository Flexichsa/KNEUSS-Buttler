import { TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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

const COIN_ICONS: Record<string, string> = {
  bitcoin: "₿",
  ethereum: "Ξ",
  solana: "◎",
  dogecoin: "Ð",
  cardano: "₳",
  ripple: "✕",
};

interface CryptoSettings {
  coins?: string[];
  show1h?: boolean;
  show24h?: boolean;
  show7d?: boolean;
  showChart?: boolean;
}

function CoinRow({ coin, index, settings }: { coin: CoinData; index: number; settings?: CryptoSettings }) {
  const show1h = settings?.show1h !== false;
  const show24h = settings?.show24h !== false;
  const show7d = settings?.show7d !== false;
  const showChart = settings?.showChart !== false;
  const sparklineData = useMemo(() => {
    if (!coin.sparkline?.length) return [];
    const step = Math.max(1, Math.floor(coin.sparkline.length / 20));
    return coin.sparkline
      .filter((_, i) => i % step === 0)
      .map((price, i) => ({ x: i, price }));
  }, [coin.sparkline]);

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

  const change1h = coin.change1h ?? (coin.change24h / 24);
  const isPositive1h = change1h >= 0;
  const isPositive24h = coin.change24h >= 0;
  const isPositive7d = coin.change7d >= 0;

  return (
    <div 
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-white/10 last:border-b-0"
      data-testid={`crypto-row-${coin.id}`}
    >
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/30 to-indigo-600/30 flex items-center justify-center text-white font-bold text-sm">
          {COIN_ICONS[coin.id] || coin.symbol[0]}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white">{coin.symbol}/USDT</span>
          <span className="text-[10px] text-white/50">7D</span>
        </div>
      </div>

      {showChart && (
        <div className="flex-1 h-8 mx-2">
          {sparklineData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`sparkline-gradient-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive7d ? "rgba(74, 222, 128, 0.3)" : "rgba(248, 113, 113, 0.3)"} />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive7d ? "#4ade80" : "#f87171"}
                  strokeWidth={1.5}
                  fill={`url(#sparkline-gradient-${coin.id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      <div className="text-right min-w-[70px]">
        <div className="text-sm font-bold text-white">{formatPrice(coin.price)}</div>
        <div className="text-[10px] text-white/50">
          {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5 min-w-[90px]">
        {show1h && (
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-[10px] font-semibold",
              isPositive1h ? "text-green-400" : "text-red-400"
            )}>
              {isPositive1h ? "+" : ""}{change1h.toFixed(2)}%
            </span>
            <span className="text-[9px] text-white/40">1H</span>
          </div>
        )}
        {show24h && (
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-[10px] font-semibold",
              isPositive24h ? "text-green-400" : "text-red-400"
            )}>
              {isPositive24h ? "+" : ""}{coin.change24h.toFixed(2)}%
            </span>
            <span className="text-[9px] text-white/40">24H</span>
          </div>
        )}
        {show7d && (
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-[10px] font-semibold",
              isPositive7d ? "text-green-400" : "text-red-400"
            )}>
              {isPositive7d ? "+" : ""}{coin.change7d.toFixed(2)}%
            </span>
            <span className="text-[9px] text-white/40">7D</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface BtcWidgetProps {
  settings?: CryptoSettings;
}

export function BtcWidget({ settings }: BtcWidgetProps) {
  const selectedCoins = settings?.coins || ["bitcoin", "ethereum", "solana", "dogecoin", "cardano", "ripple"];
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

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-2xl overflow-hidden flex flex-col relative" data-testid="crypto-widget">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <AlertCircle className="h-8 w-8 text-white/50 mb-2" />
            <p className="text-sm text-white/60">Nicht verfügbar</p>
          </div>
        ) : data?.coins && data.coins.length > 0 ? (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {data.coins
              .filter(coin => selectedCoins.includes(coin.id))
              .map((coin, index) => (
                <CoinRow key={coin.id} coin={coin} index={index} settings={settings} />
              ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/50 text-sm">
            Keine Daten
          </div>
        )}
      </div>
    </div>
  );
}
