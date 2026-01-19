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

const SOFT_PRIORITY_COLORS: Record<number, string> = {
  1: '#dc2626',
  2: '#ea580c', 
  3: '#2563eb',
  4: '#9ca3af'
};

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
      case 'today': return <Sun className="h-5 w-5 text-amber-500" />;
      case 'upcoming': return <CalendarDays className="h-5 w-5 text-violet-500" />;
      case 'inbox': return <Inbox className="h-5 w-5 text-blue-500" />;
      default: return <Inbox className="h-5 w-5 text-slate-600" />;
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
    const priorityColor = SOFT_PRIORITY_COLORS[todo.priority] || SOFT_PRIORITY_COLORS[4];

    return (
      <div className={cn("group", isSubtask && "ml-6")}>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn(
            "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all border",
            todo.completed 
              ? "bg-slate-50 border-slate-100 hover:bg-slate-100" 
              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
          )}
        >
          {subtasks.length > 0 && !isSubtask && (
            <button
              onClick={() => toggleExpanded(todo.id)}
              className="mt-0.5 p-0.5 hover:bg-slate-100 rounded transition-colors"
              data-testid={`btn-expand-${todo.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
          )}
          
          <button
            onClick={() => handleToggle(todo.id, todo.completed)}
            className={cn(
              "mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
              todo.completed 
                ? "border-slate-300 bg-slate-200" 
                : "hover:bg-opacity-20"
            )}
            style={{ 
              borderColor: todo.completed ? undefined : priorityColor,
              backgroundColor: todo.completed ? undefined : `${priorityColor}10`
            }}
            data-testid={`btn-toggle-${todo.id}`}
          >
            {todo.completed && <Check className="h-3 w-3 text-slate-500" />}
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
                className="w-full bg-transparent text-slate-800 border-b border-slate-300 outline-none py-1 focus:border-blue-500"
                autoFocus
                data-testid={`input-edit-${todo.id}`}
              />
            ) : (
              <span 
                className={cn(
                  "text-sm block cursor-pointer",
                  todo.completed ? "text-slate-400 line-through" : "text-slate-700"
                )}
                onDoubleClick={() => startEditing(todo)}
              >
                {todo.text}
              </span>
            )}
            
            {todo.description && (
              <span className="text-xs text-slate-400 block mt-0.5">{todo.description}</span>
            )}
            
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {todo.dueDate && (
                <span className={cn(
                  "text-xs flex items-center gap-1 px-1.5 py-0.5 rounded",
                  isOverdue(todo.dueDate) && !todo.completed 
                    ? "text-red-600 bg-red-50" 
                    : "text-slate-500 bg-slate-100"
                )}>
                  <CalendarIcon className="h-3 w-3" />
                  {formatDueDate(todo.dueDate)}
                  {todo.dueTime && ` ${todo.dueTime}`}
                </span>
              )}
              
              {subtasks.length > 0 && (
                <span className="text-xs text-slate-400">
                  {completedSubtasks}/{subtasks.length}
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
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: label.color + '20', color: label.color }}
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
                  className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                  data-testid={`btn-menu-${todo.id}`}
                >
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
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
                    <Circle 
                      className="h-4 w-4 mr-2" 
                      style={{ color: SOFT_PRIORITY_COLORS[p] }}
                      fill={p < 4 ? SOFT_PRIORITY_COLORS[p] : 'transparent'}
                      strokeWidth={p < 4 ? 0 : 2}
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
    <div className="h-full bg-slate-50 rounded-2xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 flex items-center gap-1 bg-white border-b border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {[
            { mode: 'inbox' as const, icon: Inbox, label: 'Eingang', activeColor: 'text-blue-600 bg-blue-50' },
            { mode: 'today' as const, icon: Sun, label: 'Heute', activeColor: 'text-amber-600 bg-amber-50' },
            { mode: 'upcoming' as const, icon: CalendarDays, label: 'Demnächst', activeColor: 'text-violet-600 bg-violet-50' },
          ].map(({ mode, icon: Icon, label, activeColor }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                viewMode === mode 
                  ? activeColor
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              )}
              data-testid={`btn-view-${mode}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(
              "p-2 rounded-md transition-colors",
              showCompleted ? "bg-slate-100 text-slate-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            )}
            data-testid="btn-toggle-completed"
            title={showCompleted ? "Erledigte ausblenden" : "Erledigte anzeigen"}
          >
            {showCompleted ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          {getViewIcon()}
          <h3 className="text-lg font-semibold text-slate-800">{getViewTitle()}</h3>
          <span className="text-sm text-slate-400 ml-auto">
            {openTodos.length} offen
          </span>
        </div>
        
        <form onSubmit={handleAddTodo} className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input 
                placeholder="Aufgabe hinzufügen... (z.B. 'Meeting morgen !1 @arbeit')" 
                className="bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus-visible:ring-blue-200 focus-visible:border-blue-300"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                data-testid="input-new-todo"
                disabled={createTodo.isPending}
              />
            </div>
            
            <div className="flex items-center gap-1">
              <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                      selectedPriority < 4 
                        ? "text-current" 
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    )}
                    style={{ color: selectedPriority < 4 ? SOFT_PRIORITY_COLORS[selectedPriority] : undefined }}
                    data-testid="btn-priority"
                    title="Priorität"
                  >
                    <Flag 
                      className="h-4 w-4" 
                      fill={selectedPriority < 4 ? 'currentColor' : 'none'}
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
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 rounded-md",
                        selectedPriority === p && "bg-slate-100"
                      )}
                    >
                      <Circle 
                        className="h-3 w-3" 
                        style={{ color: SOFT_PRIORITY_COLORS[p] }}
                        fill={p < 4 ? SOFT_PRIORITY_COLORS[p] : 'transparent'}
                        strokeWidth={p < 4 ? 0 : 2}
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
                      "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                      selectedDate 
                        ? "text-blue-500 bg-blue-50" 
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 rounded-md"
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 rounded-md"
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
                      "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                      selectedLabelIds.length > 0 
                        ? "text-violet-500 bg-violet-50" 
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
                          "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 rounded-md",
                          selectedLabelIds.includes(label.id) && "bg-slate-100"
                        )}
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                        {selectedLabelIds.includes(label.id) && (
                          <Check className="h-4 w-4 ml-auto text-blue-500" />
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
                        className="flex-1 text-sm px-2 py-1 border border-slate-200 rounded focus:border-blue-300 focus:outline-none"
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
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <button 
              type="submit"
              className="px-3 h-9 rounded-md bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white font-medium text-sm disabled:opacity-50 transition-colors"
              disabled={createTodo.isPending || !newTodo.trim()}
              data-testid="btn-add-todo"
            >
              {createTodo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Hinzufügen
                </>
              )}
            </button>
          </div>
          
          {(selectedDate || selectedLabelIds.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {selectedDate && (
                <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                  <CalendarIcon className="h-3 w-3" />
                  {format(selectedDate, "dd. MMM", { locale: de })}
                  <button 
                    type="button" 
                    onClick={() => setSelectedDate(undefined)}
                    className="hover:bg-blue-100 rounded-full ml-0.5 p-0.5"
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
                    className="flex items-center gap-1 px-2 py-1 rounded-full font-medium"
                    style={{ backgroundColor: label.color + '15', color: label.color }}
                  >
                    {label.name}
                    <button 
                      type="button" 
                      onClick={() => setSelectedLabelIds(prev => prev.filter(id => id !== labelId))}
                      className="hover:opacity-70 ml-0.5 p-0.5"
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
      
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : openTodos.length === 0 && completedTodos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">
              {viewMode === 'today' && "Keine Aufgaben für heute"}
              {viewMode === 'upcoming' && "Keine anstehenden Aufgaben"}
              {viewMode === 'inbox' && "Dein Eingang ist leer"}
              {viewMode === 'all' && "Noch keine Aufgaben"}
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Füge oben eine neue Aufgabe hinzu
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
                <div className="text-xs text-slate-400 pt-4 pb-2 font-medium flex items-center gap-2">
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
                className="w-full text-xs text-slate-400 text-center py-3 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 border-t border-slate-100 mt-3"
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
