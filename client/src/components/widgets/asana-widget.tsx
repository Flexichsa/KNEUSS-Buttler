import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, Circle, CheckCircle2, Calendar, User, ExternalLink, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  due_on?: string;
  due_at?: string;
  assignee?: { name: string };
  project?: { gid: string; name: string; color?: string };
  notes?: string;
}


const PROJECT_COLORS: Record<string, string> = {
  "dark-pink": "bg-pink-500",
  "dark-green": "bg-green-600",
  "dark-blue": "bg-blue-600",
  "dark-red": "bg-red-600",
  "dark-teal": "bg-teal-600",
  "dark-brown": "bg-amber-700",
  "dark-orange": "bg-orange-600",
  "dark-purple": "bg-purple-600",
  "dark-warm-gray": "bg-gray-600",
  "light-pink": "bg-pink-400",
  "light-green": "bg-green-400",
  "light-blue": "bg-blue-400",
  "light-red": "bg-red-400",
  "light-teal": "bg-teal-400",
  "light-yellow": "bg-yellow-400",
  "light-orange": "bg-orange-400",
  "light-purple": "bg-purple-400",
  "light-warm-gray": "bg-gray-400",
};

function formatDueDate(date?: string): { text: string; isOverdue: boolean; isToday: boolean } {
  if (!date) return { text: "", isOverdue: false, isToday: false };
  
  const dueDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)} Tage überfällig`, isOverdue: true, isToday: false };
  } else if (diffDays === 0) {
    return { text: "Heute", isOverdue: false, isToday: true };
  } else if (diffDays === 1) {
    return { text: "Morgen", isOverdue: false, isToday: false };
  } else if (diffDays <= 7) {
    return { text: dueDate.toLocaleDateString('de-DE', { weekday: 'short' }), isOverdue: false, isToday: false };
  } else {
    return { text: dueDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }), isOverdue: false, isToday: false };
  }
}

function TaskItem({ task }: { task: AsanaTask }) {
  const dueInfo = formatDueDate(task.due_on || task.due_at);
  const projectColor = task.project?.color ? (PROJECT_COLORS[task.project.color] || "bg-gray-400") : "bg-gray-400";

  return (
    <div 
      className="flex items-start gap-3 px-4 py-3 hover:bg-black/5 transition-colors border-b border-white/10 last:border-b-0"
      data-testid={`asana-task-${task.gid}`}
    >
      <div className="pt-0.5">
        {task.completed ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-gray-400" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-sm font-medium truncate",
          task.completed ? "text-gray-400 line-through" : "text-gray-900"
        )}>
          {task.name}
        </div>
        
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {task.project && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <span className={cn("w-2 h-2 rounded-full", projectColor)} />
              {task.project.name}
            </span>
          )}
          
          {dueInfo.text && (
            <span className={cn(
              "inline-flex items-center gap-1 text-xs",
              dueInfo.isOverdue ? "text-red-500" : dueInfo.isToday ? "text-orange-500" : "text-gray-500"
            )}>
              <Calendar className="h-3 w-3" />
              {dueInfo.text}
            </span>
          )}
          
          {task.assignee && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <User className="h-3 w-3" />
              {task.assignee.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AsanaWidget() {
  const { data: statusData } = useQuery({
    queryKey: ["asana-status"],
    queryFn: async () => {
      const res = await fetch("/api/asana/status");
      return res.json();
    },
  });

  const { data: tasks, isLoading, error } = useQuery<AsanaTask[]>({
    queryKey: ["asana-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/asana/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: statusData?.connected,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  
  if (!statusData?.connected) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center" data-testid="asana-widget">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mb-4">
          <FolderKanban className="h-6 w-6 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Asana nicht verbunden</h3>
        <p className="text-sm text-gray-500 mb-4">Verbinde deinen Asana-Account in den Einstellungen</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="asana-widget">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
            <FolderKanban className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Asana</h2>
            <p className="text-xs text-gray-500">
              {tasks ? `${tasks.length} Aufgaben` : "Wird geladen..."}
            </p>
          </div>
        </div>
        <a 
          href="https://app.asana.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          data-testid="link-open-asana"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Fehler beim Laden</p>
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          {tasks.slice(0, 10).map((task) => (
            <TaskItem key={task.gid} task={task} />
          ))}
          {tasks.length > 10 && (
            <div className="px-4 py-2 text-xs text-gray-500 text-center">
              +{tasks.length - 10} weitere Aufgaben
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Keine offenen Aufgaben
        </div>
      )}
    </div>
  );
}
