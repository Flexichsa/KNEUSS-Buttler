import { Bitcoin, TrendingUp, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface BtcData {
  price: number;
  priceUsd?: number;
  cached?: boolean;
  stale?: boolean;
}

export function BtcWidget() {
  const { data, isLoading, error } = useQuery<BtcData>({
    queryKey: ["btc-price"],
    queryFn: async () => {
      const res = await fetch("/api/crypto/btc");
      if (!res.ok) throw new Error("Failed to fetch BTC price");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="h-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl overflow-hidden flex flex-col relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="px-5 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Bitcoin className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">Krypto</span>
            <h3 className="text-base font-bold text-white">Bitcoin</h3>
          </div>
        </div>
        <motion.div 
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-xs font-medium"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Sparkles className="h-3 w-3" />
          Live
        </motion.div>
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-5 relative z-10">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        ) : error ? (
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-8 w-8 text-white/70 mb-2" />
            <p className="text-sm text-white/70">Nicht verfügbar</p>
          </div>
        ) : data ? (
          <motion.div 
            className="text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
              {formatPrice(data.price)}
            </div>
            {data.priceUsd && (
              <div className="text-sm text-white/80 mt-1 font-medium">
                ${data.priceUsd.toLocaleString("en-US")} USD
              </div>
            )}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
