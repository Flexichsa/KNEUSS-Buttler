import { Loader2, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
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

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkGrad-${isPositive ? 'up' : 'down'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity="0.4" />
          <stop offset="100%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sparkGrad-${isPositive ? 'up' : 'down'})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? "#10b981" : "#f43f5e"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatCompactNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function ChangeIndicator({ value, label, size = "sm" }: { value: number; label: string; size?: "sm" | "lg" }) {
  const isPositive = value >= 0;
  const Icon = isPositive ? ArrowUp : ArrowDown;
  
  return (
    <div className={cn(
      "flex items-center gap-1 rounded-full px-2 py-0.5",
      isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400",
      size === "lg" && "px-3 py-1"
    )}>
      <Icon className={cn("h-3 w-3", size === "lg" && "h-4 w-4")} />
      <span className={cn("font-bold", size === "sm" ? "text-xs" : "text-sm")}>
        {Math.abs(value).toFixed(2)}%
      </span>
      <span className="text-white/50 text-xs">{label}</span>
    </div>
  );
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

  const pricePosition = useMemo(() => {
    if (!coin) return 50;
    const range = coin.high24h - coin.low24h;
    if (range === 0) return 50;
    return ((coin.price - coin.low24h) / range) * 100;
  }, [coin]);

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
        <div className="text-white/60 text-sm">Unable to load data</div>
      </div>
    );
  }

  const isPositive = coin.change24h >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div 
      className={cn(
        "h-full rounded-2xl overflow-hidden flex flex-col relative",
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        "border border-white/10"
      )}
      data-testid="crypto-widget"
    >
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl",
        isPositive ? "bg-gradient-to-b from-emerald-400 to-emerald-600" : "bg-gradient-to-b from-rose-400 to-rose-600"
      )} />
      
      <div className={cn(
        "absolute inset-0 opacity-20 blur-3xl pointer-events-none",
        isPositive ? "bg-emerald-500/30" : "bg-rose-500/30"
      )} style={{ top: '30%' }} />

      <div className="relative z-10 p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold",
              "bg-gradient-to-br shadow-lg",
              isPositive 
                ? "from-emerald-500/30 to-emerald-600/20 text-emerald-400 shadow-emerald-500/20" 
                : "from-rose-500/30 to-rose-600/20 text-rose-400 shadow-rose-500/20"
            )}>
              {coinIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">{coin.name}</span>
                <span className="text-white/40 text-sm">{coin.symbol.toUpperCase()}</span>
              </div>
              <div className="text-white text-2xl font-bold">{formatPrice(coin.price)}</div>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl",
            isPositive ? "bg-emerald-500/20" : "bg-rose-500/20"
          )}>
            <TrendIcon className={cn("h-5 w-5", isPositive ? "text-emerald-400" : "text-rose-400")} />
            <span className={cn("text-2xl font-bold", isPositive ? "text-emerald-400" : "text-rose-400")}>
              {isPositive ? "+" : ""}{coin.change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {coin.change1h !== undefined && <ChangeIndicator value={coin.change1h} label="1h" />}
          <ChangeIndicator value={coin.change24h} label="24h" />
          <ChangeIndicator value={coin.change7d} label="7d" />
        </div>

        <div className="flex-1 min-h-[60px] mb-3 relative">
          <MiniSparkline data={coin.sparkline} isPositive={isPositive} />
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>24h Range</span>
            <span>{formatPrice(coin.low24h)} - {formatPrice(coin.high24h)}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
            <div 
              className={cn(
                "absolute left-0 top-0 h-full rounded-full",
                isPositive ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-rose-600 to-rose-400"
              )}
              style={{ width: `${pricePosition}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg border-2"
              style={{ 
                left: `${pricePosition}%`, 
                transform: 'translate(-50%, -50%)',
                borderColor: isPositive ? '#10b981' : '#f43f5e'
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-white/50 text-xs mb-1">Market Cap</div>
            <div className="text-white font-bold">{formatCompactNumber(coin.marketCap)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-white/50 text-xs mb-1">24h Volume</div>
            <div className="text-white font-bold">{formatCompactNumber(coin.volume)}</div>
          </div>
        </div>

        <div className="text-center mt-3">
          <span className="text-white/30 text-[10px]">Press & hold to customize</span>
        </div>
      </div>
    </div>
  );
}
