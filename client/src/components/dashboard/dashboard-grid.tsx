import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Loader2 } from "lucide-react";

// Lazy load all widgets
const CalendarWidget = lazy(() => import("@/components/widgets/calendar-widget").then(m => ({ default: m.CalendarWidget })));
const MailWidget = lazy(() => import("@/components/widgets/mail-widget").then(m => ({ default: m.MailWidget })));
const TodoWidget = lazy(() => import("@/components/widgets/todo-widget").then(m => ({ default: m.TodoWidget })));
const AssistantWidget = lazy(() => import("@/components/widgets/assistant-widget").then(m => ({ default: m.AssistantWidget })));
const BtcWidget = lazy(() => import("@/components/widgets/btc-widget").then(m => ({ default: m.BtcWidget })));
const WeatherWidget = lazy(() => import("@/components/widgets/weather-widget").then(m => ({ default: m.WeatherWidget })));
const MsTodoWidget = lazy(() => import("@/components/widgets/mstodo-widget").then(m => ({ default: m.MsTodoWidget })));
const OneDriveWidget = lazy(() => import("@/components/widgets/onedrive-widget").then(m => ({ default: m.OneDriveWidget })));
const DocumentUploadWidget = lazy(() => import("@/components/widgets/document-upload-widget").then(m => ({ default: m.DocumentUploadWidget })));
const ClockWidget = lazy(() => import("@/components/widgets/clock-widget").then(m => ({ default: m.ClockWidget })));
const CalculatorWidget = lazy(() => import("@/components/widgets/calculator-widget").then(m => ({ default: m.CalculatorWidget })));
const DateTimeWidget = lazy(() => import("@/components/widgets/datetime-widget").then(m => ({ default: m.DateTimeWidget })));
const SingleCoinWidget = lazy(() => import("@/components/widgets/single-coin-widget").then(m => ({ default: m.SingleCoinWidget })));
const StatusReportWidget = lazy(() => import("@/components/widgets/status-report-widget").then(m => ({ default: m.StatusReportWidget })));
const GainersLosersWidget = lazy(() => import("@/components/widgets/gainers-losers-widget").then(m => ({ default: m.GainersLosersWidget })));
const AsanaWidget = lazy(() => import("@/components/widgets/asana-widget").then(m => ({ default: m.AsanaWidget })));
const ContactsWidget = lazy(() => import("@/components/widgets/contacts-widget").then(m => ({ default: m.ContactsWidget })));
const WeblinkWidget = lazy(() => import("@/components/widgets/weblink-widget").then(m => ({ default: m.WeblinkWidget })));
const PasswordWidget = lazy(() => import("@/components/widgets/password-widget").then(m => ({ default: m.PasswordWidget })));
const KnowledgeBaseWidget = lazy(() => import("@/components/widgets/knowledge-base-widget").then(m => ({ default: m.KnowledgeBaseWidget })));
const ErpProgramsWidget = lazy(() => import("@/components/widgets/erp-programs-widget").then(m => ({ default: m.ErpProgramsWidget })));
const SportsWidget = lazy(() => import("@/components/widgets/sports-widget").then(m => ({ default: m.SportsWidget })));
const PomodoroWidget = lazy(() => import("@/components/widgets/pomodoro-widget").then(m => ({ default: m.PomodoroWidget })));
const NewsWidget = lazy(() => import("@/components/widgets/news-widget").then(m => ({ default: m.NewsWidget })));

function WidgetFallback() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
    </div>
  );
}

import { AVAILABLE_WIDGETS } from "./widget-picker";
import { getWidgetType } from "./dashboard-config";
import type { DashboardConfig, WidgetLayout, WeatherSettings, CryptoSettings, ClockSettings, SingleCoinSettings, CalendarSettings, WeblinkSettings, WidgetSizeMode } from "@shared/schema";
import { X, GripVertical, Settings2, Maximize2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetSettingsDialog } from "@/components/dashboard/widget-settings-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { WidgetErrorBoundary } from "@/components/error-boundary";
import { useTodos } from "@/hooks/use-todos";
import { useOutlookEmails, useOutlookEvents } from "@/hooks/use-outlook";
import { useQuery } from "@tanstack/react-query";

interface DashboardGridProps {
  config: DashboardConfig;
  onLayoutChange: (layouts: WidgetLayout[]) => void;
  onSettingsChange?: (widgetId: string, settings: any) => void;
  onRemoveWidget?: (widgetId: string) => void;
  recentlySavedWidgetId?: string | null;
}

const COLS = 12;
const ROW_HEIGHT = 70;

export function DashboardGrid({ config, onLayoutChange, onSettingsChange, onRemoveWidget, recentlySavedWidgetId }: DashboardGridProps) {
  const [containerWidth, setContainerWidth] = useState(1200);
  const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);
  const [expandedIconWidgetId, setExpandedIconWidgetId] = useState<string | null>(null);
  const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const justDraggedRef = useRef(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
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
    justDraggedRef.current = true;
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
  }, []);

  const handleDragStop = useCallback((layout: any) => {
    onLayoutChange(convertLayout(layout));
    isDraggingRef.current = false;
    dragTimeoutRef.current = setTimeout(() => {
      justDraggedRef.current = false;
    }, 800);
  }, [onLayoutChange, convertLayout]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const wasDragged = useCallback((e: React.MouseEvent): boolean => {
    if (!mouseDownPosRef.current) return false;
    const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
    return dx > 5 || dy > 5;
  }, []);

  const handleResizeStop = useCallback((layout: any) => {
    onLayoutChange(convertLayout(layout));
  }, [onLayoutChange, convertLayout]);

  const handleSettingsChange = useCallback((widgetId: string, settings: any) => {
    if (onSettingsChange) onSettingsChange(widgetId, settings);
  }, [onSettingsChange]);

  const layoutItems = useMemo(() => {
    return config.enabledWidgets
      .map((widgetId) => {
        const widgetType = getWidgetType(widgetId, config.widgetInstances);
        const widgetDef = AVAILABLE_WIDGETS.find((w) => w.id === widgetType);
        if (!widgetDef) return null;

        const existingLayout = config.layouts.find((l) => l.i === widgetId);
        if (existingLayout) {
          return {
            ...existingLayout,
            minW: widgetDef.minSize?.w || 1,
            minH: widgetDef.minSize?.h || 1,
          };
        }

        const maxY = config.layouts.reduce((max, l) => Math.max(max, l.y + l.h), 0);
        return {
          i: widgetId,
          x: 0,
          y: maxY,
          w: widgetDef.defaultSize.w,
          h: widgetDef.defaultSize.h,
          minW: widgetDef.minSize?.w || 1,
          minH: widgetDef.minSize?.h || 1,
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
        return <BtcWidget settings={settings as CryptoSettings} />;
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
      case "passwords":
        return <PasswordWidget />;
      case "knowledgebase":
        return <KnowledgeBaseWidget />;
      case "erpprograms":
        return <ErpProgramsWidget />;
      case "sports":
        return <SportsWidget settings={settings} />;
      case "pomodoro":
        return <PomodoroWidget settings={settings} />;
      case "news":
        return <NewsWidget settings={settings} />;
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
    return ["contacts", "todo", "mail", "calendar", "asana", "mstodo", "onedrive", "docupload", "statusreport", "assistant", "passwords", "knowledgebase", "erpprograms", "sports", "news"].includes(widgetType);
  };

  const handleWidgetExpand = useCallback((widgetId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      if (wasDragged(e)) return;
    }
    if (isDraggingRef.current || justDraggedRef.current) return;
    setExpandedWidgetId(widgetId);
  }, [wasDragged]);

  const handleIconWidgetClick = useCallback((widgetId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      if (wasDragged(e)) return;
    }
    if (isDraggingRef.current || justDraggedRef.current) return;
    setExpandedIconWidgetId(widgetId);
  }, [wasDragged]);

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
    const widgetType = getWidgetType(widgetId, config.widgetInstances);
    const settings = config.widgetSettings?.[widgetId] || {};

    if (widgetType === "weblink") {
      return <WeblinkWidget settings={settings as WeblinkSettings} />;
    }

    const widgetInfo = getWidgetInfo(widgetId);
    if (!widgetInfo) return null;

    const badge = getWidgetBadge(widgetId);
    const iconData = getIconWidgetData(widgetId);

    return (
      <button
        onDoubleClick={(e) => handleIconWidgetClick(widgetId, e)}
        className={cn(
          "w-full h-full flex flex-col items-center justify-center cursor-pointer relative",
          "bg-gradient-to-br text-white rounded-[1.25rem] transition-all duration-200 hover:scale-105 hover:shadow-lg",
          widgetInfo.previewGradient
        )}
        data-testid={`icon-widget-${widgetId}`}
      >
        <div className="p-1">{widgetInfo.icon}</div>
        {iconData ? (
          <div className="flex flex-col items-center mt-1">
            <span className="text-xs font-bold leading-tight">{iconData.text}</span>
            {iconData.subtext && (
              <span className="text-[10px] opacity-80 leading-tight">{iconData.subtext}</span>
            )}
          </div>
        ) : badge !== null ? (
          <span className="absolute bottom-2 right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-md">
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
        "h-full relative z-10 overflow-hidden rounded-[1.25rem]",
        sizeMode === "compact" && "compact-mode"
      )}>
        <WidgetErrorBoundary widgetName={getWidgetType(widgetId, config.widgetInstances)}>
          <Suspense fallback={<WidgetFallback />}>
            {renderWidget(widgetId)}
          </Suspense>
        </WidgetErrorBoundary>
      </div>
    );
  };

  const GridLayoutComponent = GridLayout as any;

  return (
    <div ref={containerRef} className="w-full">
      <GridLayoutComponent
        className="layout"
        layout={layoutItems}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={containerWidth}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        draggableHandle=".widget-drag-handle"
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        isResizable={true}
        isDraggable={true}
        margin={[14, 14]}
      >
        {config.enabledWidgets.map((widgetId) => {
          const iconMode = isIconMode(widgetId);
          const sizeMode = getWidgetSizeMode(widgetId);
          const isRecentlySaved = recentlySavedWidgetId === widgetId;

          return (
            <div
              key={widgetId}
              className={cn(
                "widget-container relative group",
                iconMode && "icon-widget"
              )}
              data-size-mode={sizeMode}
              onMouseDown={handleMouseDown}
              onDoubleClick={(e) => {
                if (canExpandWidget(widgetId)) handleWidgetExpand(widgetId, e);
              }}
            >
              {/* Save feedback */}
              <AnimatePresence>
                {isRecentlySaved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.2, 0] }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 rounded-[1.25rem] bg-green-500"
                    />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.1, 1] }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                    >
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {iconMode ? (
                <div className="relative w-full h-full">
                  {renderIconWidget(widgetId)}
                  {/* Icon mode controls */}
                  <div className="widget-drag-handle absolute top-1 left-1 w-5 h-5 cursor-move z-20 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 hover:bg-black/40">
                    <GripVertical className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canHaveSettings(widgetId) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSettingsWidgetId(widgetId); }}
                        className="w-5 h-5 cursor-pointer flex items-center justify-center rounded-md bg-black/25 hover:bg-black/40 text-white transition-colors"
                        data-testid={`button-settings-icon-widget-${widgetId}`}
                      >
                        <Settings2 className="h-3 w-3" />
                      </button>
                    )}
                    {onRemoveWidget && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveWidget(widgetId); }}
                        className="w-5 h-5 cursor-pointer flex items-center justify-center rounded-md bg-black/25 hover:bg-red-500/80 text-white transition-colors"
                        data-testid={`button-remove-icon-widget-${widgetId}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Widget card background — Clean, modern surface */}
                  <div className="absolute inset-0 rounded-[1.25rem] bg-card border border-border/50 shadow-sm transition-all duration-300 ease-out group-hover:shadow-md group-hover:border-border/70 z-0" />

                  {/* Widget controls overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
                    <div className="widget-drag-handle w-6 h-6 cursor-move flex items-center justify-center rounded-lg bg-foreground/5 hover:bg-foreground/10 dark:bg-white/8 dark:hover:bg-white/15 transition-colors">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    {canExpandWidget(widgetId) && (
                      <button
                        onClick={(e) => handleWidgetExpand(widgetId, e)}
                        className="w-6 h-6 cursor-pointer flex items-center justify-center rounded-lg bg-foreground/5 hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all"
                        data-testid={`button-expand-widget-${widgetId}`}
                        title="Vollansicht"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canHaveSettings(widgetId) && (
                      <button
                        onClick={() => setSettingsWidgetId(widgetId)}
                        className="w-6 h-6 cursor-pointer flex items-center justify-center rounded-lg bg-foreground/5 hover:bg-foreground/10 dark:bg-white/8 dark:hover:bg-white/15 text-muted-foreground hover:text-foreground transition-all"
                        data-testid={`button-settings-widget-${widgetId}`}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onRemoveWidget && (
                      <button
                        onClick={() => onRemoveWidget(widgetId)}
                        className="w-6 h-6 cursor-pointer flex items-center justify-center rounded-lg bg-foreground/5 hover:bg-red-500 hover:text-white text-muted-foreground transition-all"
                        data-testid={`button-remove-widget-${widgetId}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {renderCompactWidget(widgetId)}
                </>
              )}
            </div>
          );
        })}
      </GridLayoutComponent>

      {/* Settings Dialog */}
      {settingsWidgetId && (
        <WidgetSettingsDialog
          widgetId={settingsWidgetId}
          widgetType={getWidgetType(settingsWidgetId, config.widgetInstances)}
          settings={config.widgetSettings?.[settingsWidgetId] || {}}
          onSettingsChange={(settings) => handleSettingsChange(settingsWidgetId, settings)}
          onClose={() => setSettingsWidgetId(null)}
        />
      )}

      {/* Icon widget expanded dialog */}
      <Dialog open={!!expandedIconWidgetId} onOpenChange={(open) => !open && setExpandedIconWidgetId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {expandedIconWidgetId && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[15px]">
                  {getWidgetInfo(expandedIconWidgetId)?.icon}
                  {getWidgetInfo(expandedIconWidgetId)?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto min-h-[400px]">
                <Suspense fallback={<WidgetFallback />}>
                  {renderWidget(expandedIconWidgetId)}
                </Suspense>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Full expanded widget dialog */}
      <Dialog open={!!expandedWidgetId} onOpenChange={(open) => !open && setExpandedWidgetId(null)}>
        <DialogContent className={cn(
          "overflow-hidden flex flex-col p-0",
          expandedWidgetId && getWidgetType(expandedWidgetId, config.widgetInstances) === "statusreport"
            ? "sm:max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh]"
            : "sm:max-w-4xl max-h-[85vh]"
        )}>
          {expandedWidgetId && (
            <>
              <DialogHeader className="px-5 pt-4 pb-3 border-b shrink-0">
                <DialogTitle className="flex items-center gap-3 text-[15px]">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white">
                    {getWidgetInfo(expandedWidgetId)?.icon}
                  </div>
                  <div>
                    <span className="block">{getWidgetInfo(expandedWidgetId)?.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">Vollansicht</span>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto min-h-0">
                <Suspense fallback={<WidgetFallback />}>
                  {renderWidget(expandedWidgetId)}
                </Suspense>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
