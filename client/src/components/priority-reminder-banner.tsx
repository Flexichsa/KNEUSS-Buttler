import { useMemo, useState } from "react";
import { useTodos, useUpdateTodo, type Todo } from "@/hooks/use-todos";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Calendar, ChevronRight, Check, Clock } from "lucide-react";
import { format, isToday, isPast, startOfDay, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskEditModal } from "@/components/task-edit-modal";

export function PriorityReminderBanner() {
  const { data: todos = [] } = useTodos();
  const updateTodo = useUpdateTodo();
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const urgentTasks = useMemo(() => {
    return todos.filter(todo => {
      if (todo.completed) return false;
      if (todo.priority !== 1) return false;
      if (!todo.dueDate) return false;
      
      const dueDate = startOfDay(new Date(todo.dueDate));
      const today = startOfDay(new Date());
      
      return dueDate <= today;
    });
  }, [todos]);

  const handlePostpone = (todo: Todo) => {
    const tomorrow = addDays(new Date(), 1);
    updateTodo.mutate({
      id: todo.id,
      dueDate: tomorrow.toISOString(),
    });
  };

  const handleComplete = (todo: Todo) => {
    updateTodo.mutate({
      id: todo.id,
      completed: true,
    });
  };

  const handleOpenTask = (todo: Todo) => {
    setSelectedTodo(todo);
    setModalOpen(true);
  };

  if (urgentTasks.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-6 mt-4"
      >
        <div className="bg-gradient-to-r from-red-500 via-red-600 to-orange-500 rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3 bg-black/10">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">
                {urgentTasks.length === 1 
                  ? "1 dringende Aufgabe wartet auf dich!" 
                  : `${urgentTasks.length} dringende Aufgaben warten auf dich!`
                }
              </h3>
              <p className="text-white/80 text-xs">
                Diese Priorität-1 Aufgaben sind heute fällig
              </p>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <AnimatePresence>
              {urgentTasks.map(todo => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="bg-white rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleComplete(todo)}
                      className="mt-0.5 w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0"
                      data-testid={`btn-complete-urgent-${todo.id}`}
                    >
                      <Check className="h-3 w-3 text-red-500 opacity-0 hover:opacity-100" />
                    </button>

                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleOpenTask(todo)}
                    >
                      <p className="font-medium text-slate-800 text-sm hover:text-blue-600 transition-colors">
                        {todo.text}
                      </p>
                      {todo.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {todo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-xs flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                          isPast(startOfDay(new Date(todo.dueDate!))) && !isToday(new Date(todo.dueDate!))
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        )}>
                          <Clock className="h-3 w-3" />
                          {isToday(new Date(todo.dueDate!)) 
                            ? "Heute fällig" 
                            : `Überfällig seit ${format(new Date(todo.dueDate!), "dd. MMM", { locale: de })}`
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePostpone(todo)}
                        className="text-xs text-slate-500 hover:text-slate-700 h-7 px-2"
                        data-testid={`btn-postpone-${todo.id}`}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Morgen
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenTask(todo)}
                        className="text-xs text-blue-500 hover:text-blue-700 h-7 px-2"
                        data-testid={`btn-open-urgent-${todo.id}`}
                      >
                        Öffnen
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <TaskEditModal
        todo={selectedTodo}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setSelectedTodo(null);
        }}
      />
    </>
  );
}
