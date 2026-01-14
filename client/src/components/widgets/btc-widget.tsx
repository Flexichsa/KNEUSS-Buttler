import { Bitcoin, TrendingUp, TrendingDown, Loader2, AlertCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
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

const COIN_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  bitcoin: { from: "from-amber-400", to: "to-orange-600", accent: "text-amber-200" },
  ethereum: { from: "from-indigo-400", to: "to-purple-600", accent: "text-indigo-200" },
  solana: { from: "from-emerald-400", to: "to-teal-600", accent: "text-emerald-200" },
  dogecoin: { from: "from-yellow-300", to: "to-amber-500", accent: "text-yellow-200" },
  cardano: { from: "from-blue-400", to: "to-indigo-600", accent: "text-blue-200" },
  ripple: { from: "from-slate-400", to: "to-slate-700", accent: "text-slate-200" },
};

export function BtcWidget() {
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const selectedCoin = data?.coins?.[selectedIndex];
  const colors = selectedCoin ? COIN_COLORS[selectedCoin.id] || COIN_COLORS.bitcoin : COIN_COLORS.bitcoin;

  const sparklineData = useMemo(() => {
    if (!selectedCoin?.sparkline?.length) return [];
    const step = Math.max(1, Math.floor(selectedCoin.sparkline.length / 30));
    return selectedCoin.sparkline
      .filter((_, i) => i % step === 0)
      .map((price, i) => ({ x: i, price }));
  }, [selectedCoin?.sparkline]);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    }
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(price);
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `€${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `€${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `€${(value / 1e6).toFixed(1)}M`;
    return `€${value.toLocaleString()}`;
  };

  const nextCoin = () => {
    if (data?.coins) {
      setSelectedIndex((prev) => (prev + 1) % data.coins.length);
    }
  };

  const prevCoin = () => {
    if (data?.coins) {
      setSelectedIndex((prev) => (prev - 1 + data.coins.length) % data.coins.length);
    }
  };

  return (
    <div className={cn("h-full bg-gradient-to-br rounded-2xl overflow-hidden flex flex-col relative", colors.from, colors.to)}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="px-4 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={prevCoin}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            data-testid="button-prev-coin"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <AnimatePresence mode="wait">
            {selectedCoin && (
              <motion.div 
                key={selectedCoin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <motion.div 
                  className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {COIN_ICONS[selectedCoin.id] || selectedCoin.symbol[0]}
                </motion.div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-white/70">{selectedCoin.symbol}</span>
                  <h3 className="text-sm font-bold text-white leading-tight">{selectedCoin.name}</h3>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={nextCoin}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            data-testid="button-next-coin"
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
        </div>
        <motion.div 
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-medium"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Sparkles className="h-2.5 w-2.5" />
          Live
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col px-4 pb-3 relative z-10 min-h-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-white/70 mb-2" />
            <p className="text-sm text-white/70">Nicht verfügbar</p>
          </div>
        ) : selectedCoin ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedCoin.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-2xl font-black text-white tracking-tight drop-shadow-lg">
                    {formatPrice(selectedCoin.price)}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                    selectedCoin.change24h >= 0 ? "bg-green-500/30 text-green-100" : "bg-red-500/30 text-red-100"
                  )}>
                    {selectedCoin.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {selectedCoin.change24h >= 0 ? "+" : ""}{selectedCoin.change24h?.toFixed(1)}%
                  </div>
                </div>

                {sparklineData.length > 0 && (
                  <div className="flex-1 min-h-[40px] -mx-2 my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData}>
                        <defs>
                          <linearGradient id={`gradient-${selectedCoin.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="rgba(255,255,255,0.8)"
                          strokeWidth={2}
                          fill={`url(#gradient-${selectedCoin.id})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mt-auto">
                  <div className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-wide text-white/60 font-medium">7T</div>
                    <div className={cn(
                      "text-xs font-bold",
                      selectedCoin.change7d >= 0 ? "text-green-200" : "text-red-200"
                    )}>
                      {selectedCoin.change7d >= 0 ? "+" : ""}{selectedCoin.change7d?.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-wide text-white/60 font-medium">MCap</div>
                    <div className="text-xs font-bold text-white">{formatMarketCap(selectedCoin.marketCap)}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-wide text-white/60 font-medium">Vol</div>
                    <div className="text-xs font-bold text-white">{formatMarketCap(selectedCoin.volume)}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        ) : null}
      </div>

      {data?.coins && data.coins.length > 1 && (
        <div className="flex justify-center gap-1 pb-2 relative z-10">
          {data.coins.map((coin, i) => (
            <button
              key={coin.id}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === selectedIndex ? "bg-white w-3" : "bg-white/40 hover:bg-white/60"
              )}
              data-testid={`button-select-coin-${coin.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
