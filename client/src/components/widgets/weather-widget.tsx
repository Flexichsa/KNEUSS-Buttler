import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, Loader2, AlertCircle, Settings2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind: number;
  configured?: boolean;
  error?: string;
}

const getWeatherIcon = (icon: string) => {
  if (icon.includes("01") || icon.includes("02")) return <Sun className="h-16 w-16 text-yellow-300 drop-shadow-lg" />;
  if (icon.includes("09") || icon.includes("10")) return <CloudRain className="h-16 w-16 text-white drop-shadow-lg" />;
  if (icon.includes("13")) return <Snowflake className="h-16 w-16 text-white drop-shadow-lg" />;
  return <Cloud className="h-16 w-16 text-white/80 drop-shadow-lg" />;
};

interface WeatherWidgetProps {
  city?: string;
  onCityChange?: (city: string) => void;
}

export function WeatherWidget({ city = "Berlin", onCityChange }: WeatherWidgetProps) {
  const [editMode, setEditMode] = useState(false);
  const [cityInput, setCityInput] = useState(city);

  const { data, isLoading, error, refetch } = useQuery<WeatherData>({
    queryKey: ["weather", city],
    queryFn: async () => {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch weather");
      return json;
    },
    refetchInterval: 300000,
    staleTime: 60000,
    retry: false,
  });

  const handleCitySubmit = () => {
    if (cityInput.trim() && onCityChange) {
      onCityChange(cityInput.trim());
    }
    setEditMode(false);
  };

  return (
    <div className="h-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-2xl overflow-hidden flex flex-col relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="px-5 py-4 flex items-center justify-between relative z-10">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">Wetter</span>
          {editMode ? (
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCitySubmit()}
                className="h-7 w-28 text-sm bg-white/20 border-white/30 text-white placeholder:text-white/50"
                placeholder="Stadt"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleCitySubmit} className="h-7 px-2 text-white hover:bg-white/20">
                OK
              </Button>
            </div>
          ) : (
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {data?.city || city}
              {onCityChange && (
                <button
                  onClick={() => setEditMode(true)}
                  className="hover:text-white/80 transition-colors"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              )}
            </h3>
          )}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-5 relative z-10">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        ) : error || (data && data.configured === false) ? (
          <div className="flex flex-col items-center text-center px-4">
            <AlertCircle className="h-10 w-10 text-white/70 mb-2" />
            <p className="text-sm font-medium text-white/90">
              {data?.configured === false 
                ? "API nicht konfiguriert" 
                : "Nicht verfügbar"}
            </p>
          </div>
        ) : data ? (
          <motion.div 
            className="flex items-center gap-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              {getWeatherIcon(data.icon)}
            </motion.div>
            <div>
              <div className="text-4xl font-black text-white drop-shadow-lg">{data.temp}°C</div>
              <div className="text-sm text-white/80 capitalize font-medium">{data.description}</div>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" /> {data.humidity}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="h-3 w-3" /> {data.wind} m/s
                </span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
