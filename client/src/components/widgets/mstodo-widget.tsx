import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, AlertCircle, Loader2, ListTodo, Calendar, Flag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import { de } from "date-fns/locale";

interface MicrosoftTodoTask {
  id: string;
  title: string;
  status: 'notStarted' | 'inProgress' | 'completed' | 'waitingOnOthers' | 'deferred';
  importance: 'low' | 'normal' | 'high';
  isReminderOn: boolean;
  dueDateTime?: { dateTime: string; timeZone: string };
  completedDateTime?: { dateTime: string; timeZone: string };
  createdDateTime: string;
}

interface MicrosoftTodoList {
  id: string;
  displayName: string;
  isOwner: boolean;
  wellknownListName?: string;
}

interface TasksData {
  list: MicrosoftTodoList;
  tasks: MicrosoftTodoTask[];
}

function formatDueDate(dueDateTime?: { dateTime: string; timeZone: string }) {
  if (!dueDateTime) return null;
  
  try {
    const date = parseISO(dueDateTime.dateTime);
    if (isToday(date)) return "Heute";
    if (isTomorrow(date)) return "Morgen";
    if (isPast(date)) return "Überfällig";
    return format(date, "d. MMM", { locale: de });
  } catch {
    return null;
  }
}

function getImportanceColor(importance: string) {
  switch (importance) {
    case 'high': return 'text-red-500';
    case 'low': return 'text-gray-400';
    default: return 'text-blue-500';
  }
}

function getDueDateColor(dueDateTime?: { dateTime: string; timeZone: string }) {
  if (!dueDateTime) return '';
  try {
    const date = parseISO(dueDateTime.dateTime);
    if (isPast(date) && !isToday(date)) return 'text-red-500 font-medium';
    if (isToday(date)) return 'text-orange-500 font-medium';
    return 'text-muted-foreground';
  } catch {
    return '';
  }
}

export function MsTodoWidget() {
  const { data, isLoading, error } = useQuery<TasksData[]>({
    queryKey: ["mstodo-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/mstodo/tasks");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch tasks");
      }
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="mstodo-widget-loading">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground p-4" data-testid="mstodo-widget-error">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-center">Microsoft To Do nicht verbunden</p>
        <p className="text-xs text-center opacity-70">Verbinde dein Microsoft-Konto in den Einstellungen</p>
      </div>
    );
  }

  // Flatten all tasks from all lists and sort by importance/due date
  const allTasks = data?.flatMap(d => 
    d.tasks.map(task => ({ ...task, listName: d.list.displayName }))
  ) || [];

  // Sort: high importance first, then by due date, then by creation date
  const sortedTasks = allTasks.sort((a, b) => {
    const importanceOrder = { high: 0, normal: 1, low: 2 };
    if (importanceOrder[a.importance] !== importanceOrder[b.importance]) {
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    }
    if (a.dueDateTime && b.dueDateTime) {
      return new Date(a.dueDateTime.dateTime).getTime() - new Date(b.dueDateTime.dateTime).getTime();
    }
    if (a.dueDateTime) return -1;
    if (b.dueDateTime) return 1;
    return new Date(b.createdDateTime).getTime() - new Date(a.createdDateTime).getTime();
  });

  const totalTasks = sortedTasks.length;
  const highPriorityTasks = sortedTasks.filter(t => t.importance === 'high').length;

  return (
    <div className="h-full flex flex-col" data-testid="mstodo-widget">
      <div className="flex items-center justify-between px-4 pr-14 py-3 border-b">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-sm">Microsoft To Do</h3>
        </div>
        <div className="flex items-center gap-2">
          {highPriorityTasks > 0 && (
            <Badge variant="destructive" className="text-xs">
              {highPriorityTasks} wichtig
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {totalTasks} Aufgaben
          </Badge>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <p className="text-sm">Keine offenen Aufgaben!</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                data-testid={`task-${task.id}`}
              >
                <div className="mt-0.5">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className={cn("h-4 w-4", getImportanceColor(task.importance))} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    task.status === 'completed' && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {task.importance === 'high' && (
                      <Flag className="h-3 w-3 text-red-500" />
                    )}
                    
                    {task.dueDateTime && (
                      <div className={cn("flex items-center gap-1 text-xs", getDueDateColor(task.dueDateTime))}>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDueDate(task.dueDateTime)}</span>
                      </div>
                    )}
                    
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.listName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
