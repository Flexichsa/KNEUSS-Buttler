import { Cloud, Sun, CloudRain, Snowflake, Wind, Loader2, AlertCircle, Settings2, CloudSun, CloudFog, CloudLightning, MapPin, Sunrise, Sunset } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface HourlyForecast {
  time: string;
  hour: number;
  temp: number;
  weatherCode: number;
  icon: string;
}

interface DailyForecast {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
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
  weatherCode: number;
  humidity: number;
  wind: string | number;
  pressure?: number;
  hourlyForecast?: HourlyForecast[];
  dailyForecast?: DailyForecast[];
  sunrise?: string;
  sunset?: string;
  configured?: boolean;
  error?: string;
}

const getWeatherIcon = (icon: string, size: "xl" | "lg" | "md" | "sm" = "lg") => {
  const sizeClasses = {
    xl: "h-16 w-16",
    lg: "h-12 w-12",
    md: "h-8 w-8",
    sm: "h-5 w-5"
  };
  const baseClass = sizeClasses[size];
  
  if (icon.includes("01")) return <Sun className={`${baseClass} text-yellow-300 drop-shadow-lg`} />;
  if (icon.includes("02")) return <CloudSun className={`${baseClass} text-white drop-shadow-lg`} />;
  if (icon.includes("03") || icon.includes("04")) return <Cloud className={`${baseClass} text-white/80 drop-shadow-lg`} />;
  if (icon.includes("09") || icon.includes("10")) return <CloudRain className={`${baseClass} text-white drop-shadow-lg`} />;
  if (icon.includes("11")) return <CloudLightning className={`${baseClass} text-yellow-200 drop-shadow-lg`} />;
  if (icon.includes("13")) return <Snowflake className={`${baseClass} text-white drop-shadow-lg`} />;
  if (icon.includes("50")) return <CloudFog className={`${baseClass} text-white/70 drop-shadow-lg`} />;
  return <Cloud className={`${baseClass} text-white/80 drop-shadow-lg`} />;
};

const getWeatherGradient = (weatherCode: number): string => {
  if (weatherCode === 0) return "from-sky-400 via-blue-400 to-blue-500";
  if (weatherCode <= 2) return "from-sky-400 via-blue-500 to-blue-600";
  if (weatherCode === 3) return "from-slate-400 via-slate-500 to-slate-600";
  if (weatherCode >= 45 && weatherCode <= 48) return "from-slate-500 via-gray-500 to-gray-600";
  if (weatherCode >= 51 && weatherCode <= 65) return "from-slate-500 via-slate-600 to-slate-700";
  if (weatherCode >= 71 && weatherCode <= 86) return "from-slate-300 via-blue-200 to-slate-400";
  if (weatherCode >= 95) return "from-slate-700 via-purple-900 to-slate-800";
  return "from-sky-400 via-blue-500 to-blue-600";
};

interface WeatherSettings {
  city?: string;
  showWind?: boolean;
  showHumidity?: boolean;
  showPressure?: boolean;
  showHourlyForecast?: boolean;
  showDailyForecast?: boolean;
}

interface WeatherWidgetProps {
  widgetId?: string;
  city?: string;
  settings?: WeatherSettings;
  onCityChange?: (city: string) => void;
}

export function WeatherWidget({ widgetId = "weather-1", city, settings, onCityChange }: WeatherWidgetProps) {
  const effectiveCity = settings?.city || city || "Berlin";
  const showDailyForecast = settings?.showDailyForecast !== false;
  const [editMode, setEditMode] = useState(false);
  const [cityInput, setCityInput] = useState(effectiveCity);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setCityInput(effectiveCity);
  }, [effectiveCity]);

  useEffect(() => {
    // Update once per minute since the display format is H:mm (no seconds shown)
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading, error } = useQuery<WeatherData>({
    queryKey: ["weather", widgetId, effectiveCity],
    queryFn: async () => {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(effectiveCity)}`);
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

  const gradient = data ? getWeatherGradient(data.weatherCode) : "from-sky-400 via-blue-500 to-blue-600";

  return (
    <div className={`h-full bg-gradient-to-br ${gradient} rounded-2xl overflow-hidden flex flex-col relative`} data-testid="weather-widget">
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/20 to-transparent" />
      
      <div className="relative z-10 flex-1 flex flex-col p-4 pr-12">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
          </div>
        ) : error || (data && data.configured === false) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <AlertCircle className="h-10 w-10 text-white/70 mb-2" />
            <p className="text-sm font-medium text-white/90">
              {data?.configured === false ? "API nicht konfiguriert" : "Nicht verfügbar"}
            </p>
          </div>
        ) : data ? (
          <motion.div 
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                {editMode ? (
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCitySubmit()}
                      className="h-7 w-32 text-sm bg-white/20 border-white/30 text-white placeholder:text-white/50"
                      placeholder="Stadt"
                      autoFocus
                      data-testid="input-city"
                    />
                    <Button size="sm" variant="ghost" onClick={handleCitySubmit} className="h-7 px-2 text-white hover:bg-white/20" data-testid="button-city-submit">
                      OK
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-white/90 mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">{data.city}</span>
                    {onCityChange && (
                      <button
                        onClick={() => setEditMode(true)}
                        className="ml-1 hover:text-white transition-colors"
                        data-testid="button-edit-city"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
                
                <div className="text-white/70 text-xs mb-2">
                  {format(currentTime, "EEEE - d. MMMM", { locale: de })}
                </div>
                
                <div className="text-5xl font-light text-white tracking-tight leading-none">
                  {format(currentTime, "H:mm")}
                  <span className="text-lg ml-1 align-top">{format(currentTime, "a").toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between my-3">
              <div className="flex flex-col text-white/80 text-xs space-y-1">
                <div className="flex items-center gap-1">
                  <span>Gefühlt:</span>
                  <span className="font-medium">{data.feels_like}°</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-3 w-3" />
                  <span>{data.wind} m/s</span>
                </div>
                {data.sunrise && (
                  <div className="flex items-center gap-1">
                    <Sunrise className="h-3 w-3" />
                    <span>{data.sunrise}</span>
                  </div>
                )}
                {data.sunset && (
                  <div className="flex items-center gap-1">
                    <Sunset className="h-3 w-3" />
                    <span>{data.sunset}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-4xl font-bold text-white">
                    {data.temp}<span className="text-2xl">°</span>
                  </div>
                  <div className="text-xs text-white/70 capitalize">{data.description}</div>
                </div>
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  {getWeatherIcon(data.icon, "xl")}
                </motion.div>
              </div>
            </div>

            {showDailyForecast && data.dailyForecast && data.dailyForecast.length > 0 && (
              <div className="mt-auto pt-3 border-t border-white/20">
                <div className="flex items-center justify-between gap-1">
                  {data.dailyForecast.slice(0, 5).map((day, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col items-center flex-1 text-white/90"
                      data-testid={`daily-forecast-${index}`}
                    >
                      <span className="text-[10px] text-white/60 mb-1 font-medium">
                        {day.dayName}
                      </span>
                      {getWeatherIcon(day.icon, "sm")}
                      <div className="text-[10px] mt-1">
                        <span className="text-white font-medium">{day.tempMax}°</span>
                        <span className="text-white/50">/{day.tempMin}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
