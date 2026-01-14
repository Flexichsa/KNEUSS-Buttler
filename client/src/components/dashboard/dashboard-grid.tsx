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
import type { DashboardConfig, WidgetLayout } from "@shared/schema";

interface DashboardGridProps {
  config: DashboardConfig;
  onLayoutChange: (layouts: WidgetLayout[]) => void;
  onSettingsChange?: (widgetId: string, settings: any) => void;
}

const COLS = 12;
const ROW_HEIGHT = 80;

const DEFAULT_LAYOUTS: WidgetLayout[] = [
  { i: "calendar", x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  { i: "todo", x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  { i: "mail", x: 0, y: 4, w: 8, h: 4, minW: 4, minH: 3 },
  { i: "assistant", x: 8, y: 4, w: 4, h: 6, minW: 3, minH: 4 },
  { i: "btc", x: 0, y: 8, w: 4, h: 3, minW: 3, minH: 2 },
  { i: "weather", x: 4, y: 8, w: 4, h: 3, minW: 3, minH: 2 },
];

export const DEFAULT_CONFIG: DashboardConfig = {
  layouts: DEFAULT_LAYOUTS,
  enabledWidgets: ["calendar", "todo", "mail", "assistant"],
  widgetSettings: { weather: { city: "Berlin" } },
};

export function DashboardGrid({ config, onLayoutChange, onSettingsChange }: DashboardGridProps) {
  const [containerWidth, setContainerWidth] = useState(1200);

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

  const handleLayoutChange = useCallback(
    (layout: any[]) => {
      const newLayouts: WidgetLayout[] = layout.map((item: any) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
      }));
      onLayoutChange(newLayouts);
    },
    [onLayoutChange]
  );

  const handleWeatherCityChange = useCallback(
    (city: string) => {
      if (onSettingsChange) {
        onSettingsChange("weather", { city });
      }
    },
    [onSettingsChange]
  );

  const layoutItems = useMemo(() => {
    return config.enabledWidgets
      .map((widgetId) => {
        const existingLayout = config.layouts.find((l) => l.i === widgetId);
        if (existingLayout) return existingLayout;

        const widgetDef = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
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
  }, [config.enabledWidgets, config.layouts]);

  const renderWidget = (widgetId: string) => {
    const settings = config.widgetSettings?.[widgetId] || {};

    switch (widgetId) {
      case "calendar":
        return <CalendarWidget />;
      case "todo":
        return <TodoWidget />;
      case "mail":
        return <MailWidget />;
      case "assistant":
        return <AssistantWidget />;
      case "btc":
        return <BtcWidget />;
      case "weather":
        return (
          <WeatherWidget
            city={settings.city || "Berlin"}
            onCityChange={handleWeatherCityChange}
          />
        );
      default:
        return <div className="p-4 text-muted-foreground">Widget nicht gefunden</div>;
    }
  };

  return (
    <div id="dashboard-grid-container" className="w-full">
      <ReactGridLayout
        className="layout"
        layout={layoutItems as any}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={containerWidth}
        onLayoutChange={handleLayoutChange as any}
        draggableHandle=".widget-drag-handle"
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        isResizable={true}
        isDraggable={true}
        margin={[16, 16] as [number, number]}
      >
        {config.enabledWidgets.map((widgetId) => (
          <div key={widgetId} className="widget-container relative">
            <div className="widget-drag-handle absolute top-0 left-0 right-0 h-14 cursor-move z-10 bg-transparent" />
            <div className="h-full">{renderWidget(widgetId)}</div>
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
}
