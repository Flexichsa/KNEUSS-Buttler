import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { DashboardConfig, WidgetLayout } from "@shared/schema";
import { DEFAULT_CONFIG } from "@/components/dashboard/dashboard-grid";

function getSessionId(): string {
  let sessionId = localStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("session_id", sessionId);
  }
  return sessionId;
}

export function useDashboardLayout() {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  const [localConfig, setLocalConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);

  const { data: savedConfig, isLoading } = useQuery<DashboardConfig | null>({
    queryKey: ["dashboard-layout", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/layout/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch layout");
      return res.json();
    },
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (config: DashboardConfig) => {
      const res = await fetch(`/api/dashboard/layout/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save layout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-layout", sessionId] });
    },
  });

  useEffect(() => {
    if (savedConfig) {
      // Migrate old configs without widgetInstances
      let widgetInstances = savedConfig.widgetInstances || [];
      let needsMigration = false;
      
      // Auto-generate widgetInstances for enabled widgets that don't have them
      savedConfig.enabledWidgets.forEach(widgetId => {
        if (!widgetInstances.find(i => i.id === widgetId)) {
          // Extract type from ID (e.g., "weather-1" -> "weather", or legacy "weather" -> "weather")
          const match = widgetId.match(/^([a-z]+)(-\d+)?$/);
          const type = match ? match[1] : widgetId;
          widgetInstances = [...widgetInstances, { id: widgetId, type }];
          needsMigration = true;
        }
      });
      
      // For existing users, keep their settings; for new widgets, use defaults
      const migratedConfig = {
        ...DEFAULT_CONFIG,
        ...savedConfig,
        enabledWidgets: savedConfig.enabledWidgets,
        widgetInstances,
        widgetSettings: {
          ...DEFAULT_CONFIG.widgetSettings,
          ...savedConfig.widgetSettings,
        },
      };
      
      setLocalConfig(migratedConfig);
      
      // Persist migrated config to server if migration occurred
      if (needsMigration) {
        saveMutation.mutate(migratedConfig);
      }
    }
  }, [savedConfig]);

  const updateLayouts = (layouts: WidgetLayout[]) => {
    const newConfig = { ...localConfig, layouts };
    setLocalConfig(newConfig);
    saveMutation.mutate(newConfig);
  };

  const toggleWidget = (widgetId: string, enabled: boolean) => {
    const enabledWidgets = enabled
      ? [...localConfig.enabledWidgets, widgetId]
      : localConfig.enabledWidgets.filter((id) => id !== widgetId);
    
    const newConfig = { ...localConfig, enabledWidgets };
    setLocalConfig(newConfig);
    saveMutation.mutate(newConfig);
  };

  const updateWidgetSettings = (widgetId: string, settings: any) => {
    const newConfig = {
      ...localConfig,
      widgetSettings: {
        ...localConfig.widgetSettings,
        [widgetId]: settings,
      },
    };
    setLocalConfig(newConfig);
    saveMutation.mutate(newConfig);
  };

  const removeWidget = (widgetId: string) => {
    const enabledWidgets = localConfig.enabledWidgets.filter((id) => id !== widgetId);
    const layouts = localConfig.layouts.filter((l) => l.i !== widgetId);
    const widgetInstances = (localConfig.widgetInstances || []).filter((i) => i.id !== widgetId);
    
    const newConfig = { ...localConfig, enabledWidgets, layouts, widgetInstances };
    setLocalConfig(newConfig);
    saveMutation.mutate(newConfig);
  };

  const addWidget = (widgetType: string) => {
    // Generate unique ID for new widget instance
    const existingIds = localConfig.enabledWidgets.filter(id => id.startsWith(`${widgetType}-`));
    let counter = 1;
    while (existingIds.includes(`${widgetType}-${counter}`)) {
      counter++;
    }
    const newId = `${widgetType}-${counter}`;
    
    // Create new instance
    const newInstance = { id: newId, type: widgetType };
    const widgetInstances = [...(localConfig.widgetInstances || []), newInstance];
    const enabledWidgets = [...localConfig.enabledWidgets, newId];
    
    // Add default settings for configurable widgets
    const widgetSettings = { ...localConfig.widgetSettings };
    if (widgetType === "weather") {
      widgetSettings[newId] = { city: "Berlin", showWind: true, showHumidity: true, showPressure: true, showHourlyForecast: true };
    } else if (widgetType === "btc") {
      widgetSettings[newId] = { coins: ["bitcoin", "ethereum", "solana", "dogecoin", "cardano", "ripple"], show1h: true, show24h: true, show7d: true, showChart: true };
    }
    
    const newConfig = { ...localConfig, enabledWidgets, widgetInstances, widgetSettings };
    setLocalConfig(newConfig);
    saveMutation.mutate(newConfig);
  };

  return {
    config: localConfig,
    isLoading,
    isSaving: saveMutation.isPending,
    updateLayouts,
    toggleWidget,
    removeWidget,
    addWidget,
    updateWidgetSettings,
  };
}
