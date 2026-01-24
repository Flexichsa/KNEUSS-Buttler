import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Plus, Loader2, Calendar as CalendarIcon, Check, Eye, EyeOff, 
  Flag, ChevronDown, ChevronRight, Trash2, Edit2, MoreHorizontal,
  Sun, CalendarDays, Inbox, Tag, X, Mic, MicOff, Circle
} from "lucide-react";
import { useState, useMemo, useCallback, memo } from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { 
  useTodos, useCreateTodo, useToggleTodo, useUpdateTodo, useDeleteTodo,
  useTodoLabels, useCreateTodoLabel,
  parseNaturalLanguageTask, PRIORITY_COLORS, PRIORITY_LABELS,
  type Todo, type TodoLabel
} from "@/hooks/use-todos";
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
import { TaskEditModal } from "@/components/task-edit-modal";

type ViewMode = 'inbox' | 'today' | 'upcoming' | 'all';

const DEFAULT_LABEL_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
];

const PRIORITY_STYLE: Record<number, { border: string; bg: string; dot: string }> = {
  1: { border: 'border-red-400', bg: 'bg-red-50', dot: 'bg-red-500' },
  2: { border: 'border-orange-400', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  3: { border: 'border-blue-400', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  4: { border: 'border-slate-200', bg: 'bg-slate-50', dot: 'bg-slate-300' }
};

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

interface TodoItemProps {
  todo: Todo;
  labels: TodoLabel[];
  subtasks: Todo[];
  isSubtask?: boolean;
  isExpanded: boolean;
  isEditing: boolean;
  editingText: string;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  onStartEdit: (todo: Todo) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
  onToggleExpand: (id: number) => void;
  onUpdatePriority: (id: number, priority: number) => void;
  onOpenModal: (todo: Todo) => void;
}

const TodoItem = memo(function TodoItem({
  todo, labels, subtasks, isSubtask = false, isExpanded, isEditing,
  editingText, onToggle, onDelete, onStartEdit, onSaveEdit, onCancelEdit,
  onEditTextChange, onToggleExpand, onUpdatePriority, onOpenModal
}: TodoItemProps) {
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const priority = PRIORITY_STYLE[todo.priority] || PRIORITY_STYLE[4];

  return (
    <div className={cn("group", isSubtask && "ml-5 mt-1")}>
      <div 
        className={cn(
          "flex items-start gap-2 px-2.5 py-2 rounded-lg transition-all",
          todo.completed 
            ? "bg-slate-50/80" 
            : "bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200"
        )}
      >
        {subtasks.length > 0 && !isSubtask && (
          <button
            onClick={() => onToggleExpand(todo.id)}
            className="mt-1 p-0.5 hover:bg-slate-200 rounded"
            data-testid={`btn-expand-${todo.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        )}
        
        <button
          onClick={() => onToggle(todo.id, todo.completed)}
          className={cn(
            "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all hover:scale-110",
            todo.completed 
              ? "border-green-500 bg-green-500" 
              : cn(priority.border, "hover:bg-slate-50")
          )}
          data-testid={`btn-toggle-${todo.id}`}
          title={todo.completed ? "Als unerledigt markieren" : "Als erledigt markieren"}
        >
          {todo.completed && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </button>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editingText}
              onChange={(e) => onEditTextChange(e.target.value)}
              onBlur={onSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
              className="w-full text-sm bg-transparent border-b border-blue-400 outline-none py-0.5"
              autoFocus
              data-testid={`input-edit-${todo.id}`}
            />
          ) : (
            <span 
              className={cn(
                "text-sm block cursor-pointer leading-snug",
                todo.completed ? "text-slate-400 line-through" : "text-slate-700 hover:text-slate-900"
              )}
              onClick={() => onOpenModal(todo)}
              data-testid={`todo-text-${todo.id}`}
            >
              {todo.text}
            </span>
          )}
          
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {todo.dueDate && (
              <span className={cn(
                "text-[11px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-medium",
                isOverdue(todo.dueDate) && !todo.completed 
                  ? "text-red-600 bg-red-50" 
                  : "text-slate-500 bg-slate-100"
              )}>
                <CalendarIcon className="h-2.5 w-2.5" />
                {formatDueDate(todo.dueDate)}
                {todo.dueTime && ` ${todo.dueTime}`}
              </span>
            )}
            
            {subtasks.length > 0 && (
              <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {completedSubtasks}/{subtasks.length}
              </span>
            )}
            
            {todo.labelIds && todo.labelIds.length > 0 && (
              <>
                {todo.labelIds.slice(0, 2).map(labelId => {
                  const label = labels.find(l => l.id === labelId);
                  if (!label) return null;
                  return (
                    <span 
                      key={labelId}
                      className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                      style={{ backgroundColor: label.color + '18', color: label.color }}
                    >
                      {label.name}
                    </span>
                  );
                })}
                {todo.labelIds.length > 2 && (
                  <span className="text-[10px] text-slate-400">+{todo.labelIds.length - 2}</span>
                )}
              </>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1 rounded hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`btn-menu-${todo.id}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onStartEdit(todo)}>
              <Edit2 className="h-3.5 w-3.5 mr-2" />
              Bearbeiten
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {[1, 2, 3, 4].map(p => (
              <DropdownMenuItem 
                key={p}
                onClick={() => onUpdatePriority(todo.id, p)}
                className="text-xs"
              >
                <div className={cn("w-2.5 h-2.5 rounded-full mr-2", PRIORITY_STYLE[p].dot)} />
                {PRIORITY_LABELS[p]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(todo.id)}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {isExpanded && subtasks.length > 0 && (
        <div className="mt-1">
          {subtasks.map(subtask => (
            <TodoItem
              key={subtask.id}
              todo={subtask}
              labels={labels}
              subtasks={[]}
              isSubtask
              isExpanded={false}
              isEditing={false}
              editingText=""
              onToggle={onToggle}
              onDelete={onDelete}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onEditTextChange={onEditTextChange}
              onToggleExpand={onToggleExpand}
              onUpdatePriority={onUpdatePriority}
              onOpenModal={onOpenModal}
            />
          ))}
        </div>
      )}
    </div>
  );
});

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
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const [selectedPriority, setSelectedPriority] = useState<number>(4);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);

  const handleVoiceResult = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setNewTodo(prev => prev + text);
    }
  }, []);

  const {
    isListening,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    interimTranscript,
  } = useSpeechRecognition({
    language: "de-DE",
    continuous: false,
    onResult: handleVoiceResult,
  });

  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedTodoForModal, setSelectedTodoForModal] = useState<Todo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const cancelEdit = useCallback(() => {
    setEditingTodoId(null);
    setEditingText("");
  }, []);

  const toggleExpanded = useCallback((id: number) => {
    setExpandedTodos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleUpdatePriority = useCallback((id: number, priority: number) => {
    updateTodo.mutate({ id, priority });
  }, [updateTodo]);

  const openModal = useCallback((todo: Todo) => {
    setSelectedTodoForModal(todo);
    setIsModalOpen(true);
  }, []);

  const subtasksMap = useMemo(() => {
    const map = new Map<number, Todo[]>();
    todos.forEach(t => {
      if (t.parentTodoId) {
        const existing = map.get(t.parentTodoId) || [];
        existing.push(t);
        map.set(t.parentTodoId, existing);
      }
    });
    return map;
  }, [todos]);

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

  const openTodos = useMemo(() => filteredTodos.filter(t => !t.completed), [filteredTodos]);
  const completedTodos = useMemo(() => filteredTodos.filter(t => t.completed), [filteredTodos]);

  const VIEW_TABS = [
    { mode: 'inbox' as const, icon: Inbox, label: 'Eingang', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { mode: 'today' as const, icon: Sun, label: 'Heute', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { mode: 'upcoming' as const, icon: CalendarDays, label: 'Demnächst', color: 'text-violet-600 bg-violet-50 border-violet-200' },
  ];

  const activeTab = VIEW_TABS.find(t => t.mode === viewMode) || VIEW_TABS[0];

  return (
    <div className="h-full bg-white rounded-xl overflow-hidden flex flex-col shadow-sm border border-slate-100">
      <div className="px-3 py-2 flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/50">
        {VIEW_TABS.map(({ mode, icon: Icon, label, color }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
              viewMode === mode 
                ? color
                : "text-slate-500 bg-white border-transparent hover:bg-slate-100"
            )}
            data-testid={`btn-view-${mode}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        
        <div className="ml-auto">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              showCompleted ? "bg-slate-200 text-slate-600" : "text-slate-400 hover:bg-slate-100"
            )}
            data-testid="btn-toggle-completed"
            title={showCompleted ? "Erledigte ausblenden" : "Erledigte anzeigen"}
          >
            {showCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      
      <div className="px-3 py-2.5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <activeTab.icon className={cn("h-4 w-4", activeTab.color.split(' ')[0])} />
            <span className="text-sm font-semibold text-slate-700">{activeTab.label}</span>
          </div>
          <span className="text-xs text-slate-400 tabular-nums">{openTodos.length} offen</span>
        </div>
        
        <form onSubmit={handleAddTodo}>
          {isListening && interimTranscript && (
            <div className="mb-1.5 text-[11px] text-blue-500 italic flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {interimTranscript}...
            </div>
          )}
          
          <div className="flex gap-1.5">
            <div className="flex-1 relative">
              <Input 
                placeholder={isListening ? "Ich höre zu..." : "Aufgabe hinzufügen..."} 
                className="h-8 text-sm bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-200"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                data-testid="input-new-todo"
                disabled={createTodo.isPending}
              />
            </div>
            
            <div className="flex items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-7 h-8 rounded flex items-center justify-center transition-colors",
                      selectedPriority < 4 ? "text-current" : "text-slate-400 hover:bg-slate-100"
                    )}
                    data-testid="btn-priority"
                  >
                    <div className={cn("w-2 h-2 rounded-full", PRIORITY_STYLE[selectedPriority].dot)} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="end">
                  {[1, 2, 3, 4].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPriority(p)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-slate-100 rounded",
                        selectedPriority === p && "bg-slate-100"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", PRIORITY_STYLE[p].dot)} />
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
                      "w-7 h-8 rounded flex items-center justify-center transition-colors",
                      selectedDate ? "text-blue-500" : "text-slate-400 hover:bg-slate-100"
                    )}
                    data-testid="btn-due-date"
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-2 border-b space-y-1">
                    <button
                      type="button"
                      onClick={() => { setSelectedDate(new Date()); setCalendarOpen(false); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-slate-100 rounded"
                    >
                      <Sun className="h-3.5 w-3.5 text-amber-500" /> Heute
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedDate(addDays(new Date(), 1)); setCalendarOpen(false); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-slate-100 rounded"
                    >
                      <CalendarDays className="h-3.5 w-3.5 text-orange-500" /> Morgen
                    </button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => { setSelectedDate(date); setCalendarOpen(false); }}
                    locale={de}
                    className="p-3 [--cell-size:2.25rem]"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-7 h-8 rounded flex items-center justify-center transition-colors",
                      selectedLabelIds.length > 0 ? "text-violet-500" : "text-slate-400 hover:bg-slate-100"
                    )}
                    data-testid="btn-labels"
                  >
                    <Tag className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <div className="max-h-36 overflow-y-auto">
                    {labels.map(label => (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => {
                          setSelectedLabelIds(prev => 
                            prev.includes(label.id) ? prev.filter(id => id !== label.id) : [...prev, label.id]
                          );
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-slate-100 rounded",
                          selectedLabelIds.includes(label.id) && "bg-slate-100"
                        )}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                        <span className="flex-1 text-left">{label.name}</span>
                        {selectedLabelIds.includes(label.id) && <Check className="h-3 w-3 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                  <div className="border-t mt-1 pt-1">
                    <div className="flex gap-1 px-1">
                      <input
                        type="text"
                        placeholder="Neues Label..."
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-blue-300"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newLabelName.trim()) {
                            e.preventDefault();
                            createLabel.mutate({ 
                              name: newLabelName.trim(), 
                              color: DEFAULT_LABEL_COLORS[labels.length % DEFAULT_LABEL_COLORS.length] 
                            });
                            setNewLabelName("");
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newLabelName.trim()) {
                            createLabel.mutate({ 
                              name: newLabelName.trim(), 
                              color: DEFAULT_LABEL_COLORS[labels.length % DEFAULT_LABEL_COLORS.length] 
                            });
                            setNewLabelName("");
                          }
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {voiceSupported && (
              <button
                type="button"
                onClick={() => isListening ? stopListening() : startListening()}
                className={cn(
                  "w-8 h-8 rounded flex items-center justify-center transition-all",
                  isListening ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
                disabled={createTodo.isPending}
                data-testid="btn-voice-todo"
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
            )}
            
            <button 
              type="submit"
              className="px-2.5 h-8 rounded bg-blue-500 hover:bg-blue-600 flex items-center gap-1 text-white text-xs font-medium disabled:opacity-50 transition-colors"
              disabled={createTodo.isPending || !newTodo.trim()}
              data-testid="btn-add-todo"
            >
              {createTodo.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Hinzufügen
                </>
              )}
            </button>
          </div>
          
          {(selectedDate || selectedLabelIds.length > 0) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {selectedDate && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                  <CalendarIcon className="h-2.5 w-2.5" />
                  {format(selectedDate, "dd. MMM", { locale: de })}
                  <button type="button" onClick={() => setSelectedDate(undefined)} className="hover:bg-blue-100 rounded-full p-0.5" data-testid="btn-clear-due-date">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              {selectedLabelIds.map(labelId => {
                const label = labels.find(l => l.id === labelId);
                if (!label) return null;
                return (
                  <span key={labelId} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: label.color + '15', color: label.color }}>
                    {label.name}
                    <button type="button" onClick={() => setSelectedLabelIds(prev => prev.filter(id => id !== labelId))} className="hover:opacity-70 p-0.5">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </form>
      </div>
      
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        ) : openTodos.length === 0 && completedTodos.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">
              {viewMode === 'today' && "Keine Aufgaben für heute"}
              {viewMode === 'upcoming' && "Keine anstehenden Aufgaben"}
              {viewMode === 'inbox' && "Dein Eingang ist leer"}
              {viewMode === 'all' && "Noch keine Aufgaben"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {openTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                labels={labels}
                subtasks={subtasksMap.get(todo.id) || []}
                isExpanded={expandedTodos.has(todo.id)}
                isEditing={editingTodoId === todo.id}
                editingText={editingText}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onStartEdit={startEditing}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onEditTextChange={setEditingText}
                onToggleExpand={toggleExpanded}
                onUpdatePriority={handleUpdatePriority}
                onOpenModal={openModal}
              />
            ))}
            
            {showCompleted && completedTodos.length > 0 && (
              <>
                <div className="text-[11px] text-slate-400 pt-3 pb-1 font-medium flex items-center gap-1.5">
                  <Check className="h-3 w-3" />
                  Erledigt ({completedTodos.length})
                </div>
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    labels={labels}
                    subtasks={subtasksMap.get(todo.id) || []}
                    isExpanded={expandedTodos.has(todo.id)}
                    isEditing={editingTodoId === todo.id}
                    editingText={editingText}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onStartEdit={startEditing}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    onEditTextChange={setEditingText}
                    onToggleExpand={toggleExpanded}
                    onUpdatePriority={handleUpdatePriority}
                    onOpenModal={openModal}
                  />
                ))}
              </>
            )}
            
            {!showCompleted && completedTodos.length > 0 && (
              <button
                onClick={() => setShowCompleted(true)}
                className="w-full text-[11px] text-slate-400 text-center py-2 hover:text-slate-600 transition-colors flex items-center justify-center gap-1.5 border-t border-slate-100 mt-2"
                data-testid="btn-show-completed"
              >
                <Check className="h-3 w-3" />
                {completedTodos.length} erledigt anzeigen
              </button>
            )}
          </div>
        )}
      </div>

      <TaskEditModal
        todo={selectedTodoForModal}
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setSelectedTodoForModal(null);
        }}
      />
    </div>
  );
}
