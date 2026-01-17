import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import type { WeatherSettings, CryptoSettings, ClockSettings, SingleCoinSettings, CalendarSettings, WeblinkSettings } from "@shared/schema";

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
  { id: "litecoin", name: "Litecoin", symbol: "LTC" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
  { id: "chainlink", name: "Chainlink", symbol: "LINK" },
  { id: "stellar", name: "Stellar", symbol: "XLM" },
  { id: "monero", name: "Monero", symbol: "XMR" },
  { id: "tron", name: "TRON", symbol: "TRX" },
  { id: "binancecoin", name: "Binance Coin", symbol: "BNB" },
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
  const coins = settings.coins || AVAILABLE_COINS.slice(0, 6).map(c => c.id);
  
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

function ClockSettingsForm({ settings, onSettingsChange }: { settings: ClockSettings; onSettingsChange: (s: ClockSettings) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Anzeigemodus</Label>
        <Select
          value={settings.mode || "digital"}
          onValueChange={(value) => onSettingsChange({ ...settings, mode: value as "digital" | "analog" })}
        >
          <SelectTrigger data-testid="select-clock-mode">
            <SelectValue placeholder="Modus wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="analog">Analog</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-medium text-muted-foreground">Optionen</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showSeconds">Sekunden anzeigen</Label>
          <Switch
            id="showSeconds"
            checked={settings.showSeconds !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, showSeconds: checked })}
            data-testid="switch-show-seconds"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showDate">Datum anzeigen</Label>
          <Switch
            id="showDate"
            checked={settings.showDate !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, showDate: checked })}
            data-testid="switch-show-date"
          />
        </div>
        
        {(settings.mode || "digital") === "digital" && (
          <div className="flex items-center justify-between">
            <Label htmlFor="use24Hour">24-Stunden Format</Label>
            <Switch
              id="use24Hour"
              checked={settings.use24Hour !== false}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, use24Hour: checked })}
              data-testid="switch-24hour"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SingleCoinSettingsForm({ settings, onSettingsChange }: { settings: SingleCoinSettings; onSettingsChange: (s: SingleCoinSettings) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Kryptowährung</Label>
        <Select
          value={settings.coinId || "bitcoin"}
          onValueChange={(value) => onSettingsChange({ ...settings, coinId: value })}
        >
          <SelectTrigger data-testid="select-single-coin">
            <SelectValue placeholder="Coin wählen" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_COINS.map((coin) => (
              <SelectItem key={coin.id} value={coin.id}>
                {coin.name} ({coin.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Darstellung</Label>
        <Select
          value={settings.variant || "detailed"}
          onValueChange={(value) => onSettingsChange({ ...settings, variant: value as "compact" | "detailed" | "chart" })}
        >
          <SelectTrigger data-testid="select-coin-variant">
            <SelectValue placeholder="Stil wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">Kompakt</SelectItem>
            <SelectItem value="detailed">Detailliert</SelectItem>
            <SelectItem value="chart">Mit Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-medium text-muted-foreground">Optionen</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showChart">Chart anzeigen</Label>
          <Switch
            id="showChart"
            checked={settings.showChart !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, showChart: checked })}
            data-testid="switch-coin-show-chart"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showChange">Änderung anzeigen</Label>
          <Switch
            id="showChange"
            checked={settings.showChange !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, showChange: checked })}
            data-testid="switch-coin-show-change"
          />
        </div>
      </div>
    </div>
  );
}

function CalendarSettingsForm({ settings, onSettingsChange }: { settings: CalendarSettings; onSettingsChange: (s: CalendarSettings) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ansicht</Label>
        <Select
          value={settings.viewMode || "list"}
          onValueChange={(value) => onSettingsChange({ ...settings, viewMode: value as "day" | "week" | "month" | "list" })}
        >
          <SelectTrigger data-testid="select-calendar-view">
            <SelectValue placeholder="Ansicht wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">Liste</SelectItem>
            <SelectItem value="day">Tagesansicht</SelectItem>
            <SelectItem value="week">Wochenansicht</SelectItem>
            <SelectItem value="month">Monatsansicht</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-medium text-muted-foreground">Optionen</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showTime">Uhrzeit anzeigen</Label>
          <Switch
            id="showTime"
            checked={settings.showTime !== false}
            onCheckedChange={(checked) => onSettingsChange({ ...settings, showTime: checked })}
            data-testid="switch-calendar-show-time"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="maxEvents">Max. Termine</Label>
          <Select
            value={String(settings.maxEvents || 10)}
            onValueChange={(value) => onSettingsChange({ ...settings, maxEvents: parseInt(value) })}
          >
            <SelectTrigger data-testid="select-max-events">
              <SelectValue placeholder="Anzahl wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 Termine</SelectItem>
              <SelectItem value="10">10 Termine</SelectItem>
              <SelectItem value="15">15 Termine</SelectItem>
              <SelectItem value="20">20 Termine</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

const BACKGROUND_COLORS = [
  { id: "#3b82f6", name: "Blau" },
  { id: "#10b981", name: "Grün" },
  { id: "#f59e0b", name: "Orange" },
  { id: "#ef4444", name: "Rot" },
  { id: "#8b5cf6", name: "Violett" },
  { id: "#ec4899", name: "Pink" },
  { id: "#06b6d4", name: "Cyan" },
  { id: "#6366f1", name: "Indigo" },
  { id: "#64748b", name: "Grau" },
];

function WeblinkSettingsForm({ settings, onSettingsChange, onClose }: { settings: WeblinkSettings; onSettingsChange: (s: WeblinkSettings) => void; onClose: () => void }) {
  const [url, setUrl] = useState(settings.url || "");
  const [title, setTitle] = useState(settings.title || "");
  const [selectedColor, setSelectedColor] = useState(settings.backgroundColor || "#3b82f6");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const handleSave = () => {
    setIsSaving(true);
    onSettingsChange({ ...settings, url, title: title || undefined, backgroundColor: selectedColor });
    
    toast({
      title: "Gespeichert",
      description: "Webseiten-Link wurde erfolgreich aktualisiert.",
    });
    
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="weblink-url">Webseiten-URL</Label>
        <Input
          id="weblink-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.google.com/"
          data-testid="input-weblink-url"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="weblink-title">Titel (optional)</Label>
        <Input
          id="weblink-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Google Suche"
          data-testid="input-weblink-title"
        />
        <p className="text-xs text-muted-foreground">Leer lassen für automatischen Titel</p>
      </div>
      
      <div className="space-y-2">
        <Label>Hintergrundfarbe</Label>
        <div className="flex flex-wrap gap-2">
          {BACKGROUND_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color.id)}
              className="w-8 h-8 rounded-lg border-2 transition-all"
              style={{ 
                backgroundColor: color.id,
                borderColor: selectedColor === color.id ? "white" : "transparent",
                boxShadow: selectedColor === color.id ? "0 0 0 2px black" : "none"
              }}
              title={color.name}
              data-testid={`color-${color.id}`}
            />
          ))}
        </div>
      </div>
      
      <Button onClick={handleSave} className="w-full" disabled={isSaving} data-testid="button-save-weblink">
        {isSaving ? (
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Gespeichert!
          </span>
        ) : (
          "Speichern"
        )}
      </Button>
    </div>
  );
}

export function WidgetSettingsDialog({ widgetId, widgetType, settings, onSettingsChange, onClose }: WidgetSettingsDialogProps) {
  const getTitle = () => {
    switch (widgetType) {
      case "weather": return "Wetter-Widget Einstellungen";
      case "btc": return "Krypto-Widget Einstellungen";
      case "clock": return "Uhr-Widget Einstellungen";
      case "singlecoin": return "Coin-Widget Einstellungen";
      case "calendar": return "Kalender-Widget Einstellungen";
      case "weblink": return "Webseiten-Link Einstellungen";
      default: return "Widget Einstellungen";
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
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
          {widgetType === "clock" && (
            <ClockSettingsForm settings={settings} onSettingsChange={onSettingsChange} />
          )}
          {widgetType === "singlecoin" && (
            <SingleCoinSettingsForm settings={settings} onSettingsChange={onSettingsChange} />
          )}
          {widgetType === "calendar" && (
            <CalendarSettingsForm settings={settings} onSettingsChange={onSettingsChange} />
          )}
          {widgetType === "weblink" && (
            <WeblinkSettingsForm settings={settings} onSettingsChange={onSettingsChange} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
