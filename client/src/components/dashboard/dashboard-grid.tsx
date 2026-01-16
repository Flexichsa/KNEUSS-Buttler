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
import { AVAILABLE_WIDGETS } from "./widget-picker";
import type { DashboardConfig, WidgetLayout, WidgetInstance, WeatherSettings, CryptoSettings, ClockSettings, SingleCoinSettings, CalendarSettings, WidgetSizeMode } from "@shared/schema";
import { X, GripVertical, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetSettingsDialog } from "@/components/dashboard/widget-settings-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
      default:
        return <div className="p-4 text-muted-foreground">Widget nicht gefunden</div>;
    }
  };

  const canHaveSettings = (widgetId: string) => {
    const widgetType = getWidgetType(widgetId, config.widgetInstances);
    return ["weather", "btc", "clock", "singlecoin", "calendar"].includes(widgetType);
  };

  const renderIconWidget = (widgetId: string) => {
    const widgetInfo = getWidgetInfo(widgetId);
    if (!widgetInfo) return null;
    
    return (
      <button
        onClick={() => setExpandedIconWidgetId(widgetId)}
        className={cn(
          "w-full h-full flex items-center justify-center cursor-pointer",
          "bg-gradient-to-br text-white rounded-2xl transition-all hover:scale-105",
          widgetInfo.previewGradient
        )}
        data-testid={`icon-widget-${widgetId}`}
      >
        <div className="p-2">
          {widgetInfo.icon}
        </div>
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
                renderIconWidget(widgetId)
              ) : (
                <>
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
    </div>
  );
}
