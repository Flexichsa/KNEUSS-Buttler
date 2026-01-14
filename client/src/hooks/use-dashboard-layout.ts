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

  useEffect(() => {
    if (savedConfig) {
      setLocalConfig(savedConfig);
    }
  }, [savedConfig]);

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

  return {
    config: localConfig,
    isLoading,
    isSaving: saveMutation.isPending,
    updateLayouts,
    toggleWidget,
    updateWidgetSettings,
  };
}
