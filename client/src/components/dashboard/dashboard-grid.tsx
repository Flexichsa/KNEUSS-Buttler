import { useState, useCallback, useMemo, useEffect, useRef } from "react";
// @ts-ignore
import ReactGridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { CalendarWidget } from "@/components/widgets/calendar-widget";
import { MailWidget } from "@/components/widgets/mail-widget";
import { TodoWidget } from "@/components/widgets/todo-widget";
import { AssistantWidget } from "@/components/widgets/assistant-widget";
import { BtcWidget } from "@/components/widgets/btc-widget";
import { WeatherWidget } from "@/components/widgets/weather-widget";
import { MsTodoWidget } from "@/components/widgets/mstodo-widget";
import { OneDriveWidget } from "@/components/widgets/onedrive-widget";
import { DocumentUploadWidget } from "@/components/widgets/document-upload-widget";
import { ClockWidget } from "@/components/widgets/clock-widget";
import { CalculatorWidget } from "@/components/widgets/calculator-widget";
import { DateTimeWidget } from "@/components/widgets/datetime-widget";
import { SingleCoinWidget } from "@/components/widgets/single-coin-widget";
import { StatusReportWidget } from "@/components/widgets/status-report-widget";
import { GainersLosersWidget } from "@/components/widgets/gainers-losers-widget";
import { AsanaWidget } from "@/components/widgets/asana-widget";
import { ContactsWidget } from "@/components/widgets/contacts-widget";
import { WeblinkWidget } from "@/components/widgets/weblink-widget";
import { AVAILABLE_WIDGETS } from "./widget-picker";
import type { DashboardConfig, WidgetLayout, WidgetInstance, WeatherSettings, CryptoSettings, ClockSettings, SingleCoinSettings, CalendarSettings, WeblinkSettings, WidgetSizeMode } from "@shared/schema";
import { X, GripVertical, Settings2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetSettingsDialog } from "@/components/dashboard/widget-settings-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTodos } from "@/hooks/use-todos";
import { useOutlookEmails, useOutlookEvents } from "@/hooks/use-outlook";
import { useQuery } from "@tanstack/react-query";

interface DashboardGridProps {
  config: DashboardConfig;
  onLayoutChange: (layouts: WidgetLayout[]) => void;
  onSettingsChange?: (widgetId: string, settings: any) => void;
  onRemoveWidget?: (widgetId: string) => void;
}

const COLS = 12;
const ROW_HEIGHT = 70;

const DEFAULT_LAYOUTS: WidgetLayout[] = [
  { i: "calendar-1", x: 0, y: 0, w: 6, h: 4, minW: 1, minH: 1, sizeMode: "standard" },
  { i: "todo-1", x: 6, y: 0, w: 6, h: 4, minW: 1, minH: 1, sizeMode: "standard" },
  { i: "mail-1", x: 0, y: 4, w: 8, h: 4, minW: 1, minH: 1, sizeMode: "standard" },
  { i: "assistant-1", x: 8, y: 4, w: 4, h: 6, minW: 1, minH: 2, sizeMode: "standard" },
  { i: "btc-1", x: 0, y: 8, w: 4, h: 5, minW: 1, minH: 1, sizeMode: "standard" },
  { i: "weather-1", x: 4, y: 8, w: 5, h: 4, minW: 1, minH: 1, sizeMode: "standard" },
];

const DEFAULT_INSTANCES: WidgetInstance[] = [
  { id: "calendar-1", type: "calendar" },
  { id: "todo-1", type: "todo" },
  { id: "mail-1", type: "mail" },
  { id: "assistant-1", type: "assistant" },
];

export const DEFAULT_CONFIG: DashboardConfig = {
  layouts: DEFAULT_LAYOUTS,
  enabledWidgets: ["calendar-1", "todo-1", "mail-1", "assistant-1"],
  widgetInstances: DEFAULT_INSTANCES,
  widgetSettings: { 
    "weather-1": { city: "Berlin", showWind: true, showHumidity: true, showPressure: true, showHourlyForecast: true },
    "btc-1": { coins: ["bitcoin", "ethereum", "solana", "dogecoin", "cardano", "ripple"], show1h: true, show24h: true, show7d: true, showChart: true }
  },
};

export function getWidgetType(instanceId: string, instances?: WidgetInstance[]): string {
  if (instances) {
    const instance = instances.find(i => i.id === instanceId);
    if (instance) return instance.type;
  }
  const match = instanceId.match(/^([a-z]+)-\d+$/);
  return match ? match[1] : instanceId;
}

export function DashboardGrid({ config, onLayoutChange, onSettingsChange, onRemoveWidget }: DashboardGridProps) {
  const [containerWidth, setContainerWidth] = useState(1200);
  const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);
  const [expandedIconWidgetId, setExpandedIconWidgetId] = useState<string | null>(null);
  const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: todos = [] } = useTodos();
  const { data: emails = [] } = useOutlookEmails(50);
  const { data: events = [] } = useOutlookEvents();
  const { data: cryptoData, isLoading: cryptoLoading, isError: cryptoError } = useQuery<{ coins: Array<{ id: string; price: number; change24h: number }> }>({
    queryKey: ["crypto-prices"],
    queryFn: async () => {
      const res = await fetch("/api/crypto");
      if (!res.ok) throw new Error("Failed to fetch crypto prices");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const formatCompactPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}K`;
    }
    return `$${price.toFixed(0)}`;
  };

  const getWidgetBadge = (widgetId: string): number | null => {
    const widgetType = getWidgetType(widgetId, config.widgetInstances);
    switch (widgetType) {
      case "todo":
        const pendingTodos = todos.filter(t => !t.completed).length;
        return pendingTodos > 0 ? pendingTodos : null;
      case "mail":
        const unreadEmails = emails.filter((e: any) => !e.isRead).length;
        return unreadEmails > 0 ? unreadEmails : null;
      case "calendar":
        return events.length > 0 ? events.length : null;
      default:
        return null;
    }
  };

  const getWidgetSizeMode = (widgetId: string): WidgetSizeMode => {
    const layout = config.layouts.find(l => l.i === widgetId);
    return layout?.sizeMode || "standard";
  };

  const isIconMode = (widgetId: string): boolean => {
    return getWidgetSizeMode(widgetId) === "icon";
  };

  const getWidgetInfo = (widgetId: string) => {
    const widgetType = getWidgetType(widgetId, config.widgetInstances);
    return AVAILABLE_WIDGETS.find(w => w.id === widgetType);
  };

  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById("dashboard-grid-container");
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const convertLayout = useCallback((layout: any[]): WidgetLayout[] => {
    return layout.map((item: any) => {
      const existingLayout = config.layouts.find(l => l.i === item.i);
      return {
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        sizeMode: existingLayout?.sizeMode ?? "standard",
      };
    });
  }, [config.layouts]);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  }, []);

  const handleDragStop = useCallback(
    (layout: any[]) => {
      onLayoutChange(convertLayout(layout));
      dragTimeoutRef.current = setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    },
    [onLayoutChange, convertLayout]
  );

  const handleResizeStop = useCallback(
    (layout: any[]) => {
      onLayoutChange(convertLayout(layout));
    },
    [onLayoutChange, convertLayout]
  );

  const handleSettingsChange = useCallback(
    (widgetId: string, settings: any) => {
      if (onSettingsChange) {
        onSettingsChange(widgetId, settings);
      }
    },
    [onSettingsChange]
  );

  const layoutItems = useMemo(() => {
    return config.enabledWidgets
      .map((widgetId) => {
        const existingLayout = config.layouts.find((l) => l.i === widgetId);
        if (existingLayout) return existingLayout;

        const widgetType = getWidgetType(widgetId, config.widgetInstances);
        const widgetDef = AVAILABLE_WIDGETS.find((w) => w.id === widgetType);
        if (!widgetDef) return null;

        const maxY = config.layouts.reduce((max, l) => Math.max(max, l.y + l.h), 0);
        return {
          i: widgetId,
          x: 0,
          y: maxY,
          w: widgetDef.defaultSize.w,
          h: widgetDef.defaultSize.h,
          minW: widgetDef.minSize?.w,
          minH: widgetDef.minSize?.h,
          sizeMode: "standard" as WidgetSizeMode,
        };
      })
      .filter(Boolean) as WidgetLayout[];
  }, [config.enabledWidgets, config.layouts, config.widgetInstances]);

  const renderWidget = (widgetId: string) => {
    const widgetType = getWidgetType(widgetId, config.widgetInstances);
    const settings = config.widgetSettings?.[widgetId] || {};

    switch (widgetType) {
      case "calendar":
        return <CalendarWidget settings={settings as CalendarSettings} />;
      case "todo":
        return <TodoWidget />;
      case "mail":
        return <MailWidget />;
      case "assistant":
        return <AssistantWidget />;
      case "btc":
        return (
          <BtcWidget
            settings={settings as CryptoSettings}
          />
        );
      case "weather":
        return (
          <WeatherWidget
            widgetId={widgetId}
            settings={settings as WeatherSettings}
            onCityChange={(city) => handleSettingsChange(widgetId, { ...settings, city })}
          />
        );
      case "mstodo":
        return <MsTodoWidget />;
      case "onedrive":
        return <OneDriveWidget />;
      case "docupload":
        return <DocumentUploadWidget />;
      case "clock":
        return <ClockWidget settings={settings as ClockSettings} />;
      case "calculator":
        return <CalculatorWidget />;
      case "datetime":
        return <DateTimeWidget />;
      case "singlecoin":
        return <SingleCoinWidget settings={settings as SingleCoinSettings} />;
      case "statusreport":
        return <StatusReportWidget />;
      case "gainerslosers":
        return <GainersLosersWidget />;
      case "asana":
        return <AsanaWidget />;
      case "contacts":
        return <ContactsWidget />;
      case "weblink":
        return <WeblinkWidget settings={settings as WeblinkSettings} />;
      default:
        return <div className="p-4 text-muted-foreground">Widget nicht gefunden</div>;
    }
  };

  const canHaveSettings = (widgetId: string) => {
    const widgetType = getWidgetType(widgetId, config.widgetInstances);
    return ["weather", "btc", "clock", "singlecoin", "calendar", "weblink"].includes(widgetType);
  };

  const canExpandWidget = (widgetId: string) => {
    const widgetType = getWidgetType(widgetId, config.widgetInstances);
    return ["contacts", "todo", "mail", "calendar", "asana", "mstodo", "onedrive", "docupload"].includes(widgetType);
  };

  const handleWidgetExpand = useCallback((widgetId: string) => {
    if (!isDraggingRef.current) {
      setExpandedWidgetId(widgetId);
    }
  }, []);

  const handleIconWidgetClick = useCallback((widgetId: string) => {
    if (!isDraggingRef.current) {
      setExpandedIconWidgetId(widgetId);
    }
  }, []);

  const getIconWidgetData = (widgetId: string): { text?: string; subtext?: string } | null => {
    const widgetType = getWidgetType(widgetId, config.widgetInstances);
    const settings = config.widgetSettings?.[widgetId] || {};
    
    switch (widgetType) {
      case "btc":
        if (cryptoError) return { text: "!", subtext: "Fehler" };
        if (cryptoLoading || !cryptoData?.coins) return { text: "...", subtext: "" };
        const btc = cryptoData.coins.find(c => c.id === "bitcoin");
        if (btc) {
          const isPositive = btc.change24h >= 0;
          return {
            text: formatCompactPrice(btc.price),
            subtext: `${isPositive ? "+" : ""}${btc.change24h?.toFixed(1)}%`,
          };
        }
        return { text: "...", subtext: "" };
      case "singlecoin":
        if (cryptoError) return { text: "!", subtext: "Fehler" };
        if (cryptoLoading || !cryptoData?.coins) return { text: "...", subtext: "" };
        const coinId = (settings as any).coinId || "bitcoin";
        const coin = cryptoData.coins.find(c => c.id === coinId);
        if (coin) {
          const isPositive = coin.change24h >= 0;
          return {
            text: formatCompactPrice(coin.price),
            subtext: `${isPositive ? "+" : ""}${coin.change24h?.toFixed(1)}%`,
          };
        }
        return { text: "...", subtext: "" };
      default:
        return null;
    }
  };

  const renderIconWidget = (widgetId: string) => {
    const widgetInfo = getWidgetInfo(widgetId);
    if (!widgetInfo) return null;
    
    const badge = getWidgetBadge(widgetId);
    const iconData = getIconWidgetData(widgetId);
    
    return (
      <button
        onClick={() => handleIconWidgetClick(widgetId)}
        className={cn(
          "w-full h-full flex flex-col items-center justify-center cursor-pointer relative",
          "bg-gradient-to-br text-white rounded-2xl transition-all hover:scale-105",
          widgetInfo.previewGradient
        )}
        data-testid={`icon-widget-${widgetId}`}
      >
        <div className="p-1">
          {widgetInfo.icon}
        </div>
        {iconData ? (
          <div className="flex flex-col items-center mt-1">
            <span className="text-xs font-bold leading-tight">{iconData.text}</span>
            {iconData.subtext && (
              <span className="text-[10px] opacity-80 leading-tight">{iconData.subtext}</span>
            )}
          </div>
        ) : badge !== null ? (
          <span className="absolute bottom-2 right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </button>
    );
  };

  const renderCompactWidget = (widgetId: string) => {
    const sizeMode = getWidgetSizeMode(widgetId);
    return (
      <div className={cn(
        "h-full relative z-10 overflow-hidden rounded-2xl",
        sizeMode === "compact" && "compact-mode"
      )}>
        {renderWidget(widgetId)}
      </div>
    );
  };

  return (
    <div id="dashboard-grid-container" className="w-full">
      <ReactGridLayout
        className="layout"
        layout={layoutItems as any}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={containerWidth}
        onDragStart={handleDragStart as any}
        onDragStop={handleDragStop as any}
        onResizeStop={handleResizeStop as any}
        draggableHandle=".widget-drag-handle"
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        isResizable={true}
        isDraggable={true}
        margin={[16, 16] as [number, number]}
      >
        {config.enabledWidgets.map((widgetId) => {
          const iconMode = isIconMode(widgetId);
          const sizeMode = getWidgetSizeMode(widgetId);
          
          return (
            <div 
              key={widgetId} 
              className={cn(
                "widget-container relative group",
                iconMode && "icon-widget"
              )}
              data-size-mode={sizeMode}
            >
              {iconMode ? (
                <div className="relative w-full h-full">
                  {renderIconWidget(widgetId)}
                  <div className="widget-drag-handle absolute top-1 left-1 w-6 h-6 cursor-move z-20 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/30">
                    <GripVertical className="h-3 w-3 text-white" />
                  </div>
                  {canHaveSettings(widgetId) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSettingsWidgetId(widgetId); }}
                      className="absolute top-1 right-7 w-6 h-6 cursor-pointer z-20 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/40 text-white"
                      data-testid={`button-settings-icon-widget-${widgetId}`}
                    >
                      <Settings2 className="h-3 w-3" />
                    </button>
                  )}
                  {onRemoveWidget && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveWidget(widgetId); }}
                      className="absolute top-1 right-1 w-6 h-6 cursor-pointer z-20 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-red-500 text-white"
                      data-testid={`button-remove-icon-widget-${widgetId}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl border border-white/50 shadow-lg shadow-black/5 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/10 group-hover:border-white/70 group-hover:scale-[1.01] z-0" />
                  <div className="widget-drag-handle absolute top-3 left-3 w-8 h-8 cursor-move z-20 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 hover:bg-black/10">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canExpandWidget(widgetId) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleWidgetExpand(widgetId); }}
                        className="w-7 h-7 cursor-pointer flex items-center justify-center rounded-lg bg-black/5 hover:bg-blue-500 hover:text-white text-muted-foreground transition-all"
                        data-testid={`button-expand-widget-${widgetId}`}
                        title="Vollansicht öffnen"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    )}
                    {canHaveSettings(widgetId) && (
                      <button
                        onClick={() => setSettingsWidgetId(widgetId)}
                        className="w-7 h-7 cursor-pointer flex items-center justify-center rounded-lg bg-black/5 hover:bg-black/10 text-muted-foreground hover:text-foreground transition-all"
                        data-testid={`button-settings-widget-${widgetId}`}
                      >
                        <Settings2 className="h-4 w-4" />
                      </button>
                    )}
                    {onRemoveWidget && (
                      <button
                        onClick={() => onRemoveWidget(widgetId)}
                        className="w-7 h-7 cursor-pointer flex items-center justify-center rounded-lg bg-black/5 hover:bg-red-500 hover:text-white text-muted-foreground transition-all"
                        data-testid={`button-remove-widget-${widgetId}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {renderCompactWidget(widgetId)}
                </>
              )}
            </div>
          );
        })}
      </ReactGridLayout>

      {settingsWidgetId && (
        <WidgetSettingsDialog
          widgetId={settingsWidgetId}
          widgetType={getWidgetType(settingsWidgetId, config.widgetInstances)}
          settings={config.widgetSettings?.[settingsWidgetId] || {}}
          onSettingsChange={(settings) => handleSettingsChange(settingsWidgetId, settings)}
          onClose={() => setSettingsWidgetId(null)}
        />
      )}

      <Dialog open={!!expandedIconWidgetId} onOpenChange={(open) => !open && setExpandedIconWidgetId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {expandedIconWidgetId && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getWidgetInfo(expandedIconWidgetId)?.icon}
                  {getWidgetInfo(expandedIconWidgetId)?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto min-h-[400px]">
                {renderWidget(expandedIconWidgetId)}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!expandedWidgetId} onOpenChange={(open) => !open && setExpandedWidgetId(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          {expandedWidgetId && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                    {getWidgetInfo(expandedWidgetId)?.icon}
                  </div>
                  <div>
                    <span className="block">{getWidgetInfo(expandedWidgetId)?.name}</span>
                    <span className="text-sm font-normal text-muted-foreground">Vollansicht</span>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto min-h-[500px]">
                {renderWidget(expandedWidgetId)}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
