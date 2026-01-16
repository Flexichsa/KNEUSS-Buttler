import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { useTodos, useCreateTodo, useToggleTodo } from "@/hooks/use-todos";
import { motion, AnimatePresence } from "framer-motion";

export function TodoWidget() {
  const { data: todos = [], isLoading } = useTodos();
  const createTodo = useCreateTodo();
  const toggleTodo = useToggleTodo();
  const [newTodo, setNewTodo] = useState("");

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    createTodo.mutate(newTodo);
    setNewTodo("");
  };

  const handleToggle = (id: number, completed: boolean) => {
    toggleTodo.mutate({ id, completed: !completed });
  };

  const openTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

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
      </div>
      <div className="flex-1 px-4 pb-4 overflow-y-auto relative z-10">
        <form onSubmit={handleAddTodo} className="relative mb-3">
          <Input 
            placeholder="Neue Aufgabe..." 
            className="pr-10 bg-white/20 border-white/30 text-white placeholder:text-white/50 focus-visible:ring-white/30 focus-visible:bg-white/25"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            data-testid="input-new-todo"
            disabled={createTodo.isPending}
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white disabled:opacity-50 transition-colors"
            disabled={createTodo.isPending || !newTodo.trim()}
          >
            {createTodo.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
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
              {openTodos.slice(0, 4).map((todo) => (
                <motion.div 
                  key={todo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer group"
                  onClick={() => handleToggle(todo.id, todo.completed)}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center group-hover:border-white transition-colors">
                    <Circle className="h-3 w-3 text-transparent group-hover:text-white/50" />
                  </div>
                  <span className="text-sm text-white font-medium flex-1">{todo.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {completedTodos.length > 0 && (
              <div className="text-xs text-white/50 text-center pt-2">
                {completedTodos.length} erledigt
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
