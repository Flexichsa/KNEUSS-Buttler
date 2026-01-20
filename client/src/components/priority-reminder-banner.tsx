import { useMemo, useState } from "react";
import { useTodos, useUpdateTodo, type Todo } from "@/hooks/use-todos";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Calendar, ChevronRight, ChevronDown, Check, Clock } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);

  const urgentTasks = useMemo(() => {
    return todos.filter(todo => {
      if (todo.completed) return false;
      if (todo.priority !== 1) return false;
      return true;
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
        <div className="bg-gradient-to-r from-rose-400 via-pink-400 to-orange-300 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2.5 flex items-center gap-3 bg-black/10 hover:bg-black/15 transition-colors cursor-pointer"
            data-testid="toggle-urgent-banner"
          >
            <div className="p-1.5 bg-white/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-white font-medium text-sm">
                {urgentTasks.length === 1 
                  ? "1 dringende Aufgabe" 
                  : `${urgentTasks.length} dringende Aufgaben`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {urgentTasks.length}
              </span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-white" />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-2">
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
                          {todo.dueDate && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "text-xs flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                                isPast(startOfDay(new Date(todo.dueDate))) && !isToday(new Date(todo.dueDate))
                                  ? "bg-red-100 text-red-700"
                                  : isToday(new Date(todo.dueDate))
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                              )}>
                                <Clock className="h-3 w-3" />
                                {isToday(new Date(todo.dueDate)) 
                                  ? "Heute fällig" 
                                  : isPast(startOfDay(new Date(todo.dueDate)))
                                    ? `Überfällig seit ${format(new Date(todo.dueDate), "dd. MMM", { locale: de })}`
                                    : `Fällig am ${format(new Date(todo.dueDate), "dd. MMM", { locale: de })}`
                                }
                              </span>
                            </div>
                          )}
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
