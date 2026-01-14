import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, Loader2, AlertCircle, Settings2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  if (icon.includes("01") || icon.includes("02")) return <Sun className="h-12 w-12 text-yellow-500" />;
  if (icon.includes("09") || icon.includes("10")) return <CloudRain className="h-12 w-12 text-blue-500" />;
  if (icon.includes("13")) return <Snowflake className="h-12 w-12 text-blue-300" />;
  return <Cloud className="h-12 w-12 text-gray-400" />;
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
    <Card className="h-full border-none shadow-sm bg-gradient-to-br from-blue-50 to-sky-50 overflow-hidden flex flex-col">
      <CardHeader className="px-6 py-4 border-b bg-blue-100/50 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600/70">Wetter</span>
          {editMode ? (
            <div className="flex items-center gap-2">
              <Input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCitySubmit()}
                className="h-7 w-32 text-sm"
                placeholder="Stadt"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleCitySubmit} className="h-7 px-2">
                OK
              </Button>
            </div>
          ) : (
            <CardTitle className="text-lg font-bold tracking-tight text-blue-900 flex items-center gap-2">
              {data?.city || city}
              {onCityChange && (
                <button
                  onClick={() => setEditMode(true)}
                  className="hover:text-blue-600 transition-colors"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              )}
            </CardTitle>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4 flex-1 flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        ) : error || (data && data.configured === false) ? (
          <div className="flex flex-col items-center text-center px-4">
            <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              {data?.configured === false 
                ? "Wetter-API nicht konfiguriert" 
                : "Wetter nicht verfügbar"}
            </p>
            {data?.configured === false && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                OPENWEATHER_API_KEY benötigt
              </p>
            )}
          </div>
        ) : data ? (
          <div className="flex items-center gap-4">
            {getWeatherIcon(data.icon)}
            <div>
              <div className="text-3xl font-bold text-blue-900">{data.temp}°C</div>
              <div className="text-sm text-blue-600 capitalize">{data.description}</div>
              <div className="flex items-center gap-3 mt-1 text-xs text-blue-500">
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" /> {data.humidity}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="h-3 w-3" /> {data.wind} m/s
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
