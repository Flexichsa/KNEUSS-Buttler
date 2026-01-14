import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, Loader2, AlertCircle, Settings2, CloudSun, CloudFog, CloudLightning, Gauge, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HourlyForecast {
  time: string;
  hour: number;
  temp: number;
  weatherCode: number;
  icon: string;
}

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind: string | number;
  pressure?: number;
  hourlyForecast?: HourlyForecast[];
  configured?: boolean;
  error?: string;
}

const getWeatherIcon = (icon: string, size: "lg" | "sm" = "lg") => {
  const baseClass = size === "lg" ? "h-12 w-12" : "h-5 w-5";
  const colorClass = "text-yellow-300 drop-shadow-lg";
  
  if (icon.includes("01")) return <Sun className={`${baseClass} ${colorClass}`} />;
  if (icon.includes("02")) return <CloudSun className={`${baseClass} text-white drop-shadow-lg`} />;
  if (icon.includes("03") || icon.includes("04")) return <Cloud className={`${baseClass} text-white/80 drop-shadow-lg`} />;
  if (icon.includes("09") || icon.includes("10")) return <CloudRain className={`${baseClass} text-white drop-shadow-lg`} />;
  if (icon.includes("11")) return <CloudLightning className={`${baseClass} text-yellow-200 drop-shadow-lg`} />;
  if (icon.includes("13")) return <Snowflake className={`${baseClass} text-white drop-shadow-lg`} />;
  if (icon.includes("50")) return <CloudFog className={`${baseClass} text-white/70 drop-shadow-lg`} />;
  return <Cloud className={`${baseClass} text-white/80 drop-shadow-lg`} />;
};

interface WeatherWidgetProps {
  city?: string;
  onCityChange?: (city: string) => void;
}

export function WeatherWidget({ city = "Mägenwil", onCityChange }: WeatherWidgetProps) {
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

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="h-full bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 rounded-2xl overflow-hidden flex flex-col relative" data-testid="weather-widget">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-yellow-300/30 to-transparent rounded-full -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="px-4 pt-3 pb-2 flex items-center justify-between relative z-10">
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
                data-testid="input-city"
              />
              <Button size="sm" variant="ghost" onClick={handleCitySubmit} className="h-7 px-2 text-white hover:bg-white/20" data-testid="button-city-submit">
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
                  data-testid="button-edit-city"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              )}
            </h3>
          )}
        </div>
        {data && !isLoading && !error && (
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            {getWeatherIcon(data.icon, "lg")}
          </motion.div>
        )}
      </div>

      <div className="flex-1 flex flex-col px-4 pb-3 relative z-10">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
          </div>
        ) : error || (data && data.configured === false) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <AlertCircle className="h-10 w-10 text-white/70 mb-2" />
            <p className="text-sm font-medium text-white/90">
              {data?.configured === false 
                ? "API nicht konfiguriert" 
                : "Nicht verfügbar"}
            </p>
          </div>
        ) : data ? (
          <motion.div 
            className="flex-1 flex flex-col"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-5xl font-black text-white drop-shadow-lg leading-none">
                  +{data.temp}°C
                </div>
                <div className="text-sm text-white/80 capitalize font-medium mt-1">
                  {data.description}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-white/80 mb-3">
              <span className="flex items-center gap-1">
                <Wind className="h-3.5 w-3.5" /> {data.wind} m/s
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5" /> {data.humidity}%
              </span>
              {data.pressure && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" /> {data.pressure} hPa
                </span>
              )}
            </div>

            {data.hourlyForecast && data.hourlyForecast.length > 0 && (
              <div className="mt-auto">
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  <button className="text-white/50 hover:text-white/80 flex-shrink-0">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex gap-2 overflow-x-auto flex-1 justify-center">
                    {data.hourlyForecast.slice(0, 7).map((hour, index) => (
                      <div 
                        key={index} 
                        className="flex flex-col items-center min-w-[40px] text-white/90"
                        data-testid={`hourly-forecast-${index}`}
                      >
                        <span className="text-[10px] text-white/60 mb-1">
                          {formatHour(hour.hour)}
                        </span>
                        {getWeatherIcon(hour.icon, "sm")}
                        <span className="text-xs font-semibold mt-1">
                          +{hour.temp}°
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="text-white/50 hover:text-white/80 flex-shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
