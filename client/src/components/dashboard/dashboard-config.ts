import type { DashboardConfig, WidgetLayout, WidgetInstance } from "@shared/schema";

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
