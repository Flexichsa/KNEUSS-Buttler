import { Loader2, ArrowDown, ArrowUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

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
  vechain: "V",
  binancecoin: "◆",
};

type TimeFrame = "1h" | "24h" | "7d" | "30d" | "1y";

const TIMEFRAME_LABELS: Record<TimeFrame, string> = {
  "1h": "Stunde",
  "24h": "Tag",
  "7d": "Woche",
  "30d": "Monat",
  "1y": "Jahr",
};

interface CryptoSettings {
  coins?: string[];
}

interface BtcWidgetProps {
  settings?: CryptoSettings;
}

function PriceChart({ 
  data, 
  isPositive,
  minPrice,
  maxPrice 
}: { 
  data: number[]; 
  isPositive: boolean;
  minPrice: number;
  maxPrice: number;
}) {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return { x, y, val };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `0,100 ${polylinePoints} 100,100`;
  
  const minPoint = points.reduce((a, b) => a.val < b.val ? a : b);
  const maxPoint = points.reduce((a, b) => a.val > b.val ? a : b);

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$ ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$ ${price.toFixed(2)}`;
    return `$ ${price.toFixed(5)}`;
  };

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#chartGradient)" />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={isPositive ? "#10b981" : "#f43f5e"}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      <div 
        className="absolute flex items-center gap-1"
        style={{ 
          left: `${maxPoint.x}%`, 
          top: `${maxPoint.y}%`,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
        <span className="text-xs text-emerald-400 font-medium whitespace-nowrap bg-slate-900/80 px-1 rounded">
          {formatPrice(maxPrice)}
        </span>
      </div>
      
      <div 
        className="absolute flex items-center gap-1"
        style={{ 
          left: `${minPoint.x}%`, 
          top: `${minPoint.y}%`,
          transform: 'translate(-50%, 10%)'
        }}
      >
        <div className="w-2 h-2 rounded-full bg-rose-400 shadow-lg shadow-rose-400/50" />
        <span className="text-xs text-rose-400 font-medium whitespace-nowrap bg-slate-900/80 px-1 rounded">
          {formatPrice(minPrice)}
        </span>
      </div>
    </div>
  );
}

function formatCompact(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)} Bio. $`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)} Mrd. $`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)} Mio. $`;
  return `${num.toLocaleString()} $`;
}

export function BtcWidget({ settings }: BtcWidgetProps) {
  const selectedCoins = settings?.coins || ["bitcoin"];
  const coinId = selectedCoins[0] || "bitcoin";
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>("24h");
  
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

  const getChangeForTimeframe = (tf: TimeFrame): number => {
    if (!coin) return 0;
    switch (tf) {
      case "1h": return coin.change1h ?? 0;
      case "24h": return coin.change24h ?? 0;
      case "7d": return coin.change7d ?? 0;
      case "30d": return coin.change30d ?? 0;
      case "1y": return coin.change1y ?? 0;
      default: return coin.change24h ?? 0;
    }
  };

  const currentChange = getChangeForTimeframe(selectedTimeframe);
  const isPositive = currentChange >= 0;

  const chartData = useMemo(() => {
    if (!coin?.sparkline) return [];
    const sparkline = coin.sparkline;
    switch (selectedTimeframe) {
      case "1h": return sparkline.slice(-6);
      case "24h": return sparkline.slice(-24);
      case "7d": return sparkline;
      case "30d": return sparkline;
      case "1y": return sparkline;
      default: return sparkline;
    }
  }, [coin?.sparkline, selectedTimeframe]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$ ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$ ${price.toFixed(2)}`;
    return `$ ${price.toFixed(5)}`;
  };

  if (isLoading) {
    return (
      <div 
        className="h-full rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        data-testid="crypto-widget"
      >
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div 
        className="h-full rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        data-testid="crypto-widget"
      >
        <div className="text-white/60 text-sm">Daten nicht verfügbar</div>
      </div>
    );
  }

  const minPrice = chartData.length > 0 ? Math.min(...chartData) : coin.price;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData) : coin.price;

  return (
    <div 
      className="h-full rounded-2xl overflow-hidden flex flex-col bg-gradient-to-br from-slate-900 via-slate-800/95 to-slate-900 border border-white/10"
      data-testid="crypto-widget"
    >
      <div className="p-4 pb-2 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          {coin.image ? (
            <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full shadow-lg" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {coinIcon}
            </div>
          )}
          <span className="text-white font-semibold text-lg">{coin.name}</span>
        </div>
        <div className="text-right">
          <div className="text-white/60 text-xs">{coin.symbol} =</div>
          <div className="text-white font-bold">{formatPrice(coin.price)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 px-4 py-3 border-b border-white/10">
        <div className="text-center">
          <div className="text-white/50 text-xs mb-1">Rang</div>
          <div className="text-white font-semibold">
            #{coin.rank}
          </div>
        </div>
        <div className="text-center">
          <div className="text-white/50 text-xs mb-1">Marktkap.</div>
          <div className="text-white font-semibold text-sm">{formatCompact(coin.marketCap)}</div>
        </div>
        <div className="text-center">
          <div className="text-white/50 text-xs mb-1">Tagesvolumen</div>
          <div className="text-white font-semibold text-sm">{formatCompact(coin.volume)}</div>
        </div>
      </div>

      <div className="flex-1 min-h-[120px] px-2 py-2 relative">
        <PriceChart 
          data={chartData} 
          isPositive={isPositive}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex justify-between items-end">
          {(["1h", "24h", "7d", "30d", "1y"] as TimeFrame[]).map((tf) => {
            const change = getChangeForTimeframe(tf);
            const positive = change >= 0;
            const isSelected = selectedTimeframe === tf;
            
            return (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={cn(
                  "flex flex-col items-center px-3 py-2 rounded-lg transition-all",
                  isSelected 
                    ? "bg-orange-500 text-white" 
                    : "hover:bg-white/5"
                )}
                data-testid={`timeframe-${tf}`}
              >
                <span className={cn(
                  "text-xs font-medium",
                  isSelected ? "text-white" : "text-white/70"
                )}>
                  {TIMEFRAME_LABELS[tf]}
                </span>
                <span className={cn(
                  "text-sm font-bold",
                  isSelected 
                    ? "text-white" 
                    : positive 
                      ? "text-emerald-400" 
                      : "text-rose-400"
                )}>
                  {positive ? "+" : ""}{change.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
