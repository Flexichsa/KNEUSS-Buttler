import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";

export function TodoWidget() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Review quarterly report", completed: false },
    { id: 2, text: "Call insurance company", completed: true },
    { id: 3, text: "Prepare presentation slides", completed: false },
    { id: 4, text: "Update team calendar", completed: false },
  ]);

  const [newTodo, setNewTodo] = useState("");

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([{ id: Date.now(), text: newTodo, completed: false }, ...todos]);
    setNewTodo("");
  };

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">Tasks</CardTitle>
        <span className="text-xs text-muted-foreground">{todos.filter(t => !t.completed).length} pending</span>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <form onSubmit={addTodo} className="relative">
          <Input 
            placeholder="Add a new task..." 
            className="pr-8 bg-white border-transparent shadow-sm focus-visible:ring-primary/20"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            data-testid="input-new-todo"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>

        <div className="space-y-2">
          {todos.map((todo) => (
            <div 
              key={todo.id} 
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-white/50 transition-colors group"
            >
              <Checkbox 
                id={`todo-${todo.id}`} 
                checked={todo.completed}
                onCheckedChange={() => toggleTodo(todo.id)}
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
      </CardContent>
    </Card>
  );
}
