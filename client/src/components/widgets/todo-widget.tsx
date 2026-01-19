import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Plus, Loader2, Circle, Calendar as CalendarIcon, Check, Eye, EyeOff, 
  Flag, ChevronDown, ChevronRight, Trash2, Edit2, MoreHorizontal,
  Sun, CalendarDays, Inbox, Tag, X
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { 
  useTodos, useCreateTodo, useToggleTodo, useUpdateTodo, useDeleteTodo,
  useTodoLabels, useCreateTodoLabel,
  parseNaturalLanguageTask, PRIORITY_COLORS, PRIORITY_LABELS,
  type Todo, type TodoLabel
} from "@/hooks/use-todos";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow, isPast, startOfDay, addDays, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = 'inbox' | 'today' | 'upcoming' | 'all';

const DEFAULT_LABEL_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
];

export function TodoWidget() {
  const { data: todos = [], isLoading } = useTodos();
  const { data: labels = [] } = useTodoLabels();
  const createTodo = useCreateTodo();
  const toggleTodo = useToggleTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const createLabel = useCreateTodoLabel();
  
  const [newTodo, setNewTodo] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const [selectedPriority, setSelectedPriority] = useState<number>(4);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [newLabelName, setNewLabelName] = useState("");

  const handleAddTodo = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    const parsed = parseNaturalLanguageTask(newTodo);
    
    let labelIdsToUse = [...selectedLabelIds];
    
    if (parsed.labels && parsed.labels.length > 0) {
      for (const labelName of parsed.labels) {
        const existingLabel = labels.find(l => l.name.toLowerCase() === labelName.toLowerCase());
        if (existingLabel) {
          if (!labelIdsToUse.includes(existingLabel.id)) {
            labelIdsToUse.push(existingLabel.id);
          }
        } else {
          const randomColor = DEFAULT_LABEL_COLORS[Math.floor(Math.random() * DEFAULT_LABEL_COLORS.length)];
          try {
            const newLabel = await createLabel.mutateAsync({ name: labelName, color: randomColor });
            labelIdsToUse.push(newLabel.id);
          } catch (err) {
            console.error('Failed to create label:', err);
          }
        }
      }
    }
    
    createTodo.mutate({
      text: parsed.text,
      priority: parsed.priority || selectedPriority,
      dueDate: parsed.dueDate?.toISOString() || selectedDate?.toISOString() || null,
      dueTime: parsed.dueTime || null,
      labelIds: labelIdsToUse.length > 0 ? labelIdsToUse : null,
    });
    
    setNewTodo("");
    setSelectedDate(undefined);
    setSelectedPriority(4);
    setSelectedLabelIds([]);
  }, [newTodo, selectedPriority, selectedDate, selectedLabelIds, labels, createTodo, createLabel]);

  const handleToggle = useCallback((id: number, completed: boolean) => {
    toggleTodo.mutate({ id, completed: !completed });
  }, [toggleTodo]);

  const handleDelete = useCallback((id: number) => {
    deleteTodo.mutate(id);
  }, [deleteTodo]);

  const startEditing = useCallback((todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingTodoId && editingText.trim()) {
      updateTodo.mutate({ id: editingTodoId, text: editingText.trim() });
    }
    setEditingTodoId(null);
    setEditingText("");
  }, [editingTodoId, editingText, updateTodo]);

  const toggleExpanded = useCallback((id: number) => {
    setExpandedTodos(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const filteredTodos = useMemo(() => {
    const parentTodos = todos.filter(t => !t.parentTodoId);
    const today = startOfDay(new Date());
    const weekEnd = addDays(today, 7);

    switch (viewMode) {
      case 'today':
        return parentTodos.filter(t => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return isToday(dueDate) || (isPast(dueDate) && !t.completed);
        });
      case 'upcoming':
        return parentTodos.filter(t => {
          if (!t.dueDate) return false;
          const dueDate = startOfDay(new Date(t.dueDate));
          return isWithinInterval(dueDate, { start: today, end: weekEnd });
        });
      case 'inbox':
        return parentTodos.filter(t => !t.projectId);
      case 'all':
      default:
        return parentTodos;
    }
  }, [todos, viewMode]);

  const openTodos = filteredTodos.filter(t => !t.completed);
  const completedTodos = filteredTodos.filter(t => t.completed);

  const getSubtasks = useCallback((parentId: number) => {
    return todos.filter(t => t.parentTodoId === parentId);
  }, [todos]);

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    
    if (isToday(date)) return "Heute";
    if (isTomorrow(date)) return "Morgen";
    
    return format(date, "dd. MMM", { locale: de });
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = startOfDay(new Date(dateStr));
    return isPast(date) && !isToday(new Date(dateStr));
  };

  const getViewIcon = () => {
    switch (viewMode) {
      case 'today': return <Sun className="h-5 w-5 text-amber-400" />;
      case 'upcoming': return <CalendarDays className="h-5 w-5 text-purple-400" />;
      case 'inbox': return <Inbox className="h-5 w-5 text-blue-400" />;
      default: return <Inbox className="h-5 w-5 text-white" />;
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'today': return 'Heute';
      case 'upcoming': return 'Demnächst';
      case 'inbox': return 'Eingang';
      default: return 'Alle Aufgaben';
    }
  };

  const TodoItem = ({ todo, isSubtask = false }: { todo: Todo; isSubtask?: boolean }) => {
    const subtasks = getSubtasks(todo.id);
    const isExpanded = expandedTodos.has(todo.id);
    const isEditing = editingTodoId === todo.id;
    const completedSubtasks = subtasks.filter(s => s.completed).length;

    return (
      <div className={cn("group", isSubtask && "ml-6")}>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl transition-colors",
            todo.completed 
              ? "bg-white/5 hover:bg-white/10" 
              : "bg-white/10 hover:bg-white/20"
          )}
        >
          {subtasks.length > 0 && !isSubtask && (
            <button
              onClick={() => toggleExpanded(todo.id)}
              className="mt-0.5 p-0.5 hover:bg-white/20 rounded transition-colors"
              data-testid={`btn-expand-${todo.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-white/70" />
              ) : (
                <ChevronRight className="h-4 w-4 text-white/70" />
              )}
            </button>
          )}
          
          <button
            onClick={() => handleToggle(todo.id, todo.completed)}
            className={cn(
              "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
              todo.completed 
                ? "border-white/30 bg-white/20" 
                : "border-current hover:bg-current/20"
            )}
            style={{ 
              borderColor: todo.completed ? undefined : PRIORITY_COLORS[todo.priority],
              color: PRIORITY_COLORS[todo.priority]
            }}
            data-testid={`btn-toggle-${todo.id}`}
          >
            {todo.completed && <Check className="h-3 w-3 text-white/70" />}
          </button>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') {
                    setEditingTodoId(null);
                    setEditingText("");
                  }
                }}
                className="w-full bg-transparent text-white border-b border-white/30 outline-none py-1"
                autoFocus
                data-testid={`input-edit-${todo.id}`}
              />
            ) : (
              <span 
                className={cn(
                  "text-sm font-medium block",
                  todo.completed ? "text-white/50 line-through" : "text-white"
                )}
                onDoubleClick={() => startEditing(todo)}
              >
                {todo.text}
              </span>
            )}
            
            {todo.description && (
              <span className="text-xs text-white/50 block mt-1">{todo.description}</span>
            )}
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {todo.dueDate && (
                <span className={cn(
                  "text-xs flex items-center gap-1",
                  isOverdue(todo.dueDate) && !todo.completed ? "text-red-300" : "text-white/60"
                )}>
                  <CalendarIcon className="h-3 w-3" />
                  {formatDueDate(todo.dueDate)}
                  {todo.dueTime && ` ${todo.dueTime}`}
                </span>
              )}
              
              {subtasks.length > 0 && (
                <span className="text-xs text-white/50">
                  {completedSubtasks}/{subtasks.length} Unteraufgaben
                </span>
              )}
              
              {todo.labelIds && todo.labelIds.length > 0 && (
                <div className="flex items-center gap-1">
                  {todo.labelIds.map(labelId => {
                    const label = labels.find(l => l.id === labelId);
                    if (!label) return null;
                    return (
                      <span 
                        key={labelId}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: label.color + '40', color: label.color }}
                      >
                        {label.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  data-testid={`btn-menu-${todo.id}`}
                >
                  <MoreHorizontal className="h-4 w-4 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => startEditing(todo)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {[1, 2, 3, 4].map(p => (
                  <DropdownMenuItem 
                    key={p}
                    onClick={() => updateTodo.mutate({ id: todo.id, priority: p })}
                  >
                    <Flag 
                      className="h-4 w-4 mr-2" 
                      style={{ color: PRIORITY_COLORS[p] }}
                      fill={p < 4 ? PRIORITY_COLORS[p] : 'none'}
                    />
                    {PRIORITY_LABELS[p]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDelete(todo.id)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
        
        <AnimatePresence>
          {isExpanded && subtasks.map(subtask => (
            <TodoItem key={subtask.id} todo={subtask} isSubtask />
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl overflow-hidden flex flex-col relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="px-4 py-3 flex items-center gap-2 relative z-10 border-b border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { mode: 'inbox' as const, icon: Inbox, label: 'Eingang', color: 'text-blue-300' },
            { mode: 'today' as const, icon: Sun, label: 'Heute', color: 'text-amber-300' },
            { mode: 'upcoming' as const, icon: CalendarDays, label: 'Demnächst', color: 'text-purple-300' },
          ].map(({ mode, icon: Icon, label, color }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                viewMode === mode 
                  ? "bg-white/20 text-white" 
                  : "text-white/70 hover:bg-white/10"
              )}
              data-testid={`btn-view-${mode}`}
            >
              <Icon className={cn("h-4 w-4", viewMode === mode && color)} />
              {label}
            </button>
          ))}
        </div>
        
        <div className="ml-auto flex items-center gap-2">
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
      </div>
      
      <div className="px-4 py-3 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          {getViewIcon()}
          <h3 className="text-lg font-bold text-white">{getViewTitle()}</h3>
          <span className="text-sm text-white/60 ml-auto">
            {openTodos.length} offen
          </span>
        </div>
        
        <form onSubmit={handleAddTodo} className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input 
                placeholder="Aufgabe hinzufügen... (z.B. 'Meeting heute um 14:00 !1')" 
                className="pr-10 bg-white/20 border-white/30 text-white placeholder:text-white/50 focus-visible:ring-white/30 focus-visible:bg-white/25"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                data-testid="input-new-todo"
                disabled={createTodo.isPending}
              />
            </div>
            
            <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    selectedPriority < 4 ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
                  )}
                  data-testid="btn-priority"
                  title="Priorität"
                >
                  <Flag 
                    className="h-4 w-4" 
                    style={{ color: PRIORITY_COLORS[selectedPriority] }}
                    fill={selectedPriority < 4 ? PRIORITY_COLORS[selectedPriority] : 'none'}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" align="end">
                {[1, 2, 3, 4].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedPriority(p);
                      setPriorityOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    <Flag 
                      className="h-4 w-4" 
                      style={{ color: PRIORITY_COLORS[p] }}
                      fill={p < 4 ? PRIORITY_COLORS[p] : 'none'}
                    />
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    selectedDate ? "bg-white/30 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}
                  data-testid="btn-due-date"
                  title="Fälligkeitsdatum"
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-2 border-b space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(new Date());
                      setCalendarOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    <Sun className="h-4 w-4 text-amber-500" />
                    Heute
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setSelectedDate(tomorrow);
                      setCalendarOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    <CalendarDays className="h-4 w-4 text-orange-500" />
                    Morgen
                  </button>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }}
                  locale={de}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    selectedLabelIds.length > 0 ? "bg-white/30 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}
                  data-testid="btn-labels"
                  title="Labels"
                >
                  <Tag className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {labels.map(label => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => {
                        setSelectedLabelIds(prev => 
                          prev.includes(label.id) 
                            ? prev.filter(id => id !== label.id)
                            : [...prev, label.id]
                        );
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md",
                        selectedLabelIds.includes(label.id) && "bg-accent"
                      )}
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                      {selectedLabelIds.includes(label.id) && (
                        <Check className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Neues Label..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="flex-1 text-sm px-2 py-1 border rounded"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newLabelName.trim()) {
                          e.preventDefault();
                          const color = DEFAULT_LABEL_COLORS[labels.length % DEFAULT_LABEL_COLORS.length];
                          createLabel.mutate({ name: newLabelName.trim(), color });
                          setNewLabelName("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newLabelName.trim()) {
                          const color = DEFAULT_LABEL_COLORS[labels.length % DEFAULT_LABEL_COLORS.length];
                          createLabel.mutate({ name: newLabelName.trim(), color });
                          setNewLabelName("");
                        }
                      }}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
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
          
          {(selectedDate || selectedLabelIds.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
              {selectedDate && (
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded">
                  <CalendarIcon className="h-3 w-3" />
                  {format(selectedDate, "dd. MMM", { locale: de })}
                  <button 
                    type="button" 
                    onClick={() => setSelectedDate(undefined)}
                    className="text-white/50 hover:text-white ml-1"
                    data-testid="btn-clear-due-date"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {selectedLabelIds.map(labelId => {
                const label = labels.find(l => l.id === labelId);
                if (!label) return null;
                return (
                  <div 
                    key={labelId}
                    className="flex items-center gap-1 px-2 py-1 rounded"
                    style={{ backgroundColor: label.color + '40', color: label.color }}
                  >
                    <Tag className="h-3 w-3" />
                    {label.name}
                    <button 
                      type="button" 
                      onClick={() => setSelectedLabelIds(prev => prev.filter(id => id !== labelId))}
                      className="hover:opacity-70 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </form>
      </div>
      
      <div className="flex-1 px-4 pb-4 overflow-y-auto relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/70" />
          </div>
        ) : openTodos.length === 0 && completedTodos.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-white/50" />
            </div>
            <p className="text-sm text-white/70">
              {viewMode === 'today' && "Keine Aufgaben für heute"}
              {viewMode === 'upcoming' && "Keine anstehenden Aufgaben"}
              {viewMode === 'inbox' && "Dein Eingang ist leer"}
              {viewMode === 'all' && "Noch keine Aufgaben"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {openTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </AnimatePresence>
            
            {showCompleted && completedTodos.length > 0 && (
              <>
                <div className="text-xs text-white/50 pt-4 pb-2 font-medium flex items-center gap-2">
                  <Check className="h-3 w-3" />
                  Erledigt ({completedTodos.length})
                </div>
                <AnimatePresence mode="popLayout">
                  {completedTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </AnimatePresence>
              </>
            )}
            
            {!showCompleted && completedTodos.length > 0 && (
              <button
                onClick={() => setShowCompleted(true)}
                className="w-full text-xs text-white/50 text-center pt-3 hover:text-white/70 transition-colors flex items-center justify-center gap-2"
                data-testid="btn-show-completed"
              >
                <Check className="h-3 w-3" />
                {completedTodos.length} erledigt anzeigen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
