import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { WeatherSettings, CryptoSettings } from "@shared/schema";

interface WidgetSettingsDialogProps {
  widgetId: string;
  widgetType: string;
  settings: any;
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
}

const AVAILABLE_COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "ripple", name: "Ripple", symbol: "XRP" },
];

function WeatherSettingsForm({ settings, onSettingsChange }: { settings: WeatherSettings; onSettingsChange: (s: WeatherSettings) => void }) {
  const [city, setCity] = useState(settings.city || "Berlin");
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="city">Stadt</Label>
        <div className="flex gap-2">
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="z.B. Berlin, München, Zürich"
            data-testid="input-weather-city"
          />
          <Button onClick={() => onSettingsChange({ ...settings, city })} size="sm" data-testid="button-save-city">
            Speichern
          </Button>
        </div>
      </div>
      
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-medium text-muted-foreground">Anzeigen</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showWind">Windgeschwindigkeit</Label>
          <Switch
            id="showWind"
            checked={settings.showWind !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, showWind: checked })}
            data-testid="switch-show-wind"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showHumidity">Luftfeuchtigkeit</Label>
          <Switch
            id="showHumidity"
            checked={settings.showHumidity !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, showHumidity: checked })}
            data-testid="switch-show-humidity"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showPressure">Luftdruck</Label>
          <Switch
            id="showPressure"
            checked={settings.showPressure !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, showPressure: checked })}
            data-testid="switch-show-pressure"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showHourlyForecast">Stundenprognose</Label>
          <Switch
            id="showHourlyForecast"
            checked={settings.showHourlyForecast !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, showHourlyForecast: checked })}
            data-testid="switch-show-hourly"
          />
        </div>
      </div>
    </div>
  );
}

function CryptoSettingsForm({ settings, onSettingsChange }: { settings: CryptoSettings; onSettingsChange: (s: CryptoSettings) => void }) {
  const coins = settings.coins || AVAILABLE_COINS.map(c => c.id);
  
  const toggleCoin = (coinId: string) => {
    if (coins.includes(coinId)) {
      onSettingsChange({ ...settings, coins: coins.filter(c => c !== coinId) });
    } else {
      onSettingsChange({ ...settings, coins: [...coins, coinId] });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Kryptowährungen</h4>
        {AVAILABLE_COINS.map((coin) => (
          <div key={coin.id} className="flex items-center justify-between">
            <Label htmlFor={`coin-${coin.id}`}>{coin.name} ({coin.symbol})</Label>
            <Switch
              id={`coin-${coin.id}`}
              checked={coins.includes(coin.id)}
              onCheckedChange={() => toggleCoin(coin.id)}
              data-testid={`switch-coin-${coin.id}`}
            />
          </div>
        ))}
      </div>
      
      <div className="space-y-3 pt-2 border-t">
        <h4 className="text-sm font-medium text-muted-foreground pt-2">Spalten anzeigen</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show1h">1H Änderung</Label>
          <Switch
            id="show1h"
            checked={settings.show1h !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, show1h: checked })}
            data-testid="switch-show-1h"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show24h">24H Änderung</Label>
          <Switch
            id="show24h"
            checked={settings.show24h !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, show24h: checked })}
            data-testid="switch-show-24h"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show7d">7D Änderung</Label>
          <Switch
            id="show7d"
            checked={settings.show7d !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, show7d: checked })}
            data-testid="switch-show-7d"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showChart">Chart anzeigen</Label>
          <Switch
            id="showChart"
            checked={settings.showChart !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, showChart: checked })}
            data-testid="switch-show-chart"
          />
        </div>
      </div>
    </div>
  );
}

export function WidgetSettingsDialog({ widgetId, widgetType, settings, onSettingsChange, onClose }: WidgetSettingsDialogProps) {
  const getTitle = () => {
    switch (widgetType) {
      case "weather": return "Wetter-Widget Einstellungen";
      case "btc": return "Krypto-Widget Einstellungen";
      default: return "Widget Einstellungen";
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Passen Sie an, welche Informationen angezeigt werden sollen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {widgetType === "weather" && (
            <WeatherSettingsForm settings={settings} onSettingsChange={onSettingsChange} />
          )}
          {widgetType === "btc" && (
            <CryptoSettingsForm settings={settings} onSettingsChange={onSettingsChange} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
