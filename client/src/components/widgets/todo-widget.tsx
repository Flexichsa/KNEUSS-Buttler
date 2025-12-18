import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTodos, useCreateTodo, useToggleTodo } from "@/hooks/use-todos";

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

  return (
    <Card className="h-full border-none shadow-sm bg-white overflow-hidden flex flex-col">
      <CardHeader className="px-6 py-5 border-b bg-secondary/10 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1">
           <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Aufgaben</span>
           <CardTitle className="text-lg font-bold tracking-tight text-foreground">
             {todos.filter(t => !t.completed).length} offen
           </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">
        <form onSubmit={handleAddTodo} className="relative">
          <Input 
            placeholder="Neue Aufgabe hinzufügen..." 
            className="pr-8 bg-secondary/30 border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            data-testid="input-new-todo"
            disabled={createTodo.isPending}
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 disabled:opacity-50"
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
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Noch keine Aufgaben. Füge oben eine hinzu!
          </div>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <div 
                key={todo.id} 
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary/30 transition-colors group"
              >
                <Checkbox 
                  id={`todo-${todo.id}`} 
                  checked={todo.completed}
                  onCheckedChange={() => handleToggle(todo.id, todo.completed)}
                  disabled={toggleTodo.isPending}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer ${todo.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}
                >
                  {todo.text}
                </label>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
