import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Loader2, CheckCircle2, Circle, Calendar as CalendarIcon, Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useTodos, useCreateTodo, useToggleTodo } from "@/hooks/use-todos";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function TodoWidget() {
  const { data: todos = [], isLoading } = useTodos();
  const createTodo = useCreateTodo();
  const toggleTodo = useToggleTodo();
  const [newTodo, setNewTodo] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    createTodo.mutate({ text: newTodo, dueDate: dueDate?.toISOString() || null });
    setNewTodo("");
    setDueDate(undefined);
  };

  const handleToggle = (id: number, completed: boolean) => {
    toggleTodo.mutate({ id, completed: !completed });
  };

  const openTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Heute";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Morgen";
    } else {
      return format(date, "dd.MM.", { locale: de });
    }
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="h-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl overflow-hidden flex flex-col relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="px-5 pr-14 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
          >
            <CheckCircle2 className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">Aufgaben</span>
            <h3 className="text-base font-bold text-white">{openTodos.length} offen</h3>
          </div>
        </div>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          data-testid="btn-toggle-completed"
          title={showCompleted ? "Erledigte ausblenden" : "Erledigte anzeigen"}
        >
          {showCompleted ? (
            <EyeOff className="h-4 w-4 text-white" />
          ) : (
            <Eye className="h-4 w-4 text-white" />
          )}
        </button>
      </div>
      <div className="flex-1 px-4 pb-4 overflow-y-auto relative z-10">
        <form onSubmit={handleAddTodo} className="mb-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input 
                placeholder="Neue Aufgabe..." 
                className="pr-10 bg-white/20 border-white/30 text-white placeholder:text-white/50 focus-visible:ring-white/30 focus-visible:bg-white/25"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                data-testid="input-new-todo"
                disabled={createTodo.isPending}
              />
            </div>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    dueDate ? "bg-white/30 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}
                  data-testid="btn-due-date"
                  title="Fälligkeitsdatum"
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setCalendarOpen(false);
                  }}
                  locale={de}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <button 
              type="submit"
              className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white disabled:opacity-50 transition-colors"
              disabled={createTodo.isPending || !newTodo.trim()}
              data-testid="btn-add-todo"
            >
              {createTodo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          </div>
          {dueDate && (
            <div className="mt-2 text-xs text-white/70">
              Fällig: {format(dueDate, "dd. MMMM yyyy", { locale: de })}
              <button 
                type="button" 
                onClick={() => setDueDate(undefined)}
                className="ml-2 text-white/50 hover:text-white"
                data-testid="btn-clear-due-date"
              >
                ✕
              </button>
            </div>
          )}
        </form>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/70" />
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-8 text-sm text-white/70">
            Noch keine Aufgaben
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {openTodos.map((todo) => (
                <motion.div 
                  key={todo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer group"
                  onClick={() => handleToggle(todo.id, todo.completed)}
                  data-testid={`todo-item-${todo.id}`}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center group-hover:border-white transition-colors flex-shrink-0">
                    <Circle className="h-3 w-3 text-transparent group-hover:text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white font-medium block truncate">{todo.text}</span>
                    {todo.dueDate && (
                      <span className={cn(
                        "text-xs",
                        isOverdue(todo.dueDate) ? "text-red-200" : "text-white/60"
                      )}>
                        {formatDueDate(todo.dueDate)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {showCompleted && completedTodos.length > 0 && (
              <>
                <div className="text-xs text-white/50 pt-3 pb-1 font-medium">
                  Erledigt ({completedTodos.length})
                </div>
                <AnimatePresence>
                  {completedTodos.map((todo) => (
                    <motion.div 
                      key={todo.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer group"
                      onClick={() => handleToggle(todo.id, todo.completed)}
                      data-testid={`todo-item-completed-${todo.id}`}
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-white/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white/50 font-medium line-through block truncate">{todo.text}</span>
                        {todo.dueDate && (
                          <span className="text-xs text-white/40">
                            {formatDueDate(todo.dueDate)}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}
            
            {!showCompleted && completedTodos.length > 0 && (
              <button
                onClick={() => setShowCompleted(true)}
                className="w-full text-xs text-white/50 text-center pt-2 hover:text-white/70 transition-colors"
                data-testid="btn-show-completed"
              >
                {completedTodos.length} erledigt anzeigen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
