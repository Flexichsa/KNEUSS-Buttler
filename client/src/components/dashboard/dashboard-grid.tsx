import { useState, useCallback, useMemo, useEffect } from "react";
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
import { AVAILABLE_WIDGETS } from "./widget-picker";
import type { DashboardConfig, WidgetLayout, WidgetInstance, WeatherSettings, CryptoSettings } from "@shared/schema";
import { X, GripVertical, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetSettingsDialog } from "@/components/dashboard/widget-settings-dialog";

interface DashboardGridProps {
  config: DashboardConfig;
  onLayoutChange: (layouts: WidgetLayout[]) => void;
  onSettingsChange?: (widgetId: string, settings: any) => void;
  onRemoveWidget?: (widgetId: string) => void;
}

const COLS = 12;
const ROW_HEIGHT = 80;

const DEFAULT_LAYOUTS: WidgetLayout[] = [
  { i: "calendar-1", x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  { i: "todo-1", x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  { i: "mail-1", x: 0, y: 4, w: 8, h: 4, minW: 4, minH: 3 },
  { i: "assistant-1", x: 8, y: 4, w: 4, h: 6, minW: 3, minH: 4 },
  { i: "btc-1", x: 0, y: 8, w: 4, h: 5, minW: 3, minH: 4 },
  { i: "weather-1", x: 4, y: 8, w: 5, h: 4, minW: 4, minH: 3 },
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
    return layout.map((item: any) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
    }));
  }, []);

  const handleDragStop = useCallback(
    (layout: any[]) => {
      onLayoutChange(convertLayout(layout));
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
        };
      })
      .filter(Boolean) as WidgetLayout[];
  }, [config.enabledWidgets, config.layouts, config.widgetInstances]);

  const renderWidget = (widgetId: string) => {
    const widgetType = getWidgetType(widgetId, config.widgetInstances);
    const settings = config.widgetSettings?.[widgetId] || {};

    switch (widgetType) {
      case "calendar":
        return <CalendarWidget />;
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
      default:
        return <div className="p-4 text-muted-foreground">Widget nicht gefunden</div>;
    }
  };

  const canHaveSettings = (widgetId: string) => {
    const widgetType = getWidgetType(widgetId, config.widgetInstances);
    return widgetType === "weather" || widgetType === "btc";
  };

  return (
    <div id="dashboard-grid-container" className="w-full">
      <ReactGridLayout
        className="layout"
        layout={layoutItems as any}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={containerWidth}
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
        {config.enabledWidgets.map((widgetId) => (
          <div 
            key={widgetId} 
            className="widget-container relative group"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl border border-white/50 shadow-lg shadow-black/5 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/10 group-hover:border-white/70 group-hover:scale-[1.01] z-0" />
            <div className="widget-drag-handle absolute top-3 left-3 w-8 h-8 cursor-move z-20 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 hover:bg-black/10">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <div className="h-full relative z-10 overflow-hidden rounded-2xl">{renderWidget(widgetId)}</div>
          </div>
        ))}
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
    </div>
  );
}
