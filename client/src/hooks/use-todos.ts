import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export interface Todo {
  id: number;
  text: string;
  description: string | null;
  completed: boolean;
  priority: number;
  dueDate: string | null;
  dueTime: string | null;
  projectId: number | null;
  sectionId: number | null;
  parentTodoId: number | null;
  orderIndex: number;
  labelIds: number[] | null;
  recurringPattern: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface TodoLabel {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface TodoSection {
  id: number;
  projectId: number | null;
  name: string;
  orderIndex: number;
  createdAt: string;
}

export interface TodoWithSubtasks extends Todo {
  subtasks: Todo[];
}

export function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch todos');
      return res.json() as Promise<Todo[]>;
    },
  });
}

export function useTodosWithSubtasks() {
  return useQuery({
    queryKey: ['todos', 'with-subtasks'],
    queryFn: async () => {
      const res = await fetch('/api/todos/with-subtasks');
      if (!res.ok) throw new Error('Failed to fetch todos');
      return res.json() as Promise<TodoWithSubtasks[]>;
    },
  });
}

export function useTodosForToday() {
  return useQuery({
    queryKey: ['todos', 'today'],
    queryFn: async () => {
      const res = await fetch('/api/todos/today');
      if (!res.ok) throw new Error('Failed to fetch todos');
      return res.json() as Promise<Todo[]>;
    },
  });
}

export function useUpcomingTodos(days: number = 7) {
  return useQuery({
    queryKey: ['todos', 'upcoming', days],
    queryFn: async () => {
      const res = await fetch(`/api/todos/upcoming?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch todos');
      return res.json() as Promise<Todo[]>;
    },
  });
}

export function useTodoLabels() {
  return useQuery({
    queryKey: ['todo-labels'],
    queryFn: async () => {
      const res = await fetch('/api/todo-labels');
      if (!res.ok) throw new Error('Failed to fetch labels');
      return res.json() as Promise<TodoLabel[]>;
    },
  });
}

export function useTodoSections(projectId?: number | null) {
  return useQuery({
    queryKey: ['todo-sections', projectId],
    queryFn: async () => {
      const url = projectId !== undefined 
        ? `/api/todo-sections?projectId=${projectId === null ? 'null' : projectId}`
        : '/api/todo-sections';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch sections');
      return res.json() as Promise<TodoSection[]>;
    },
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Todo> & { text: string }) => {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: data.text,
          description: data.description || null,
          completed: false,
          priority: data.priority || 4,
          dueDate: data.dueDate || null,
          dueTime: data.dueTime || null,
          projectId: data.projectId || null,
          sectionId: data.sectionId || null,
          parentTodoId: data.parentTodoId || null,
          labelIds: data.labelIds || null,
          recurringPattern: data.recurringPattern || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create todo');
      return res.json() as Promise<Todo>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<Todo>) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      return res.json() as Promise<Todo>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });
}

export function useToggleTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      return res.json() as Promise<Todo>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete todo');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });
}

export function useCreateTodoLabel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await fetch('/api/todo-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create label');
      return res.json() as Promise<TodoLabel>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-labels'] });
    },
  });
}

export function useDeleteTodoLabel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/todo-labels/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete label');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-labels'] });
    },
  });
}

export function useCreateTodoSection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; projectId?: number | null }) => {
      const res = await fetch('/api/todo-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create section');
      return res.json() as Promise<TodoSection>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-sections'] });
    },
  });
}

export function useDeleteTodoSection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/todo-sections/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete section');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-sections'] });
    },
  });
}

export function parseNaturalLanguageTask(input: string): {
  text: string;
  priority?: number;
  dueDate?: Date;
  dueTime?: string;
  labels?: string[];
} {
  let text = input;
  let priority: number | undefined;
  let dueDate: Date | undefined;
  let dueTime: string | undefined;
  const labels: string[] = [];

  const priorityMatch = text.match(/\s*[!pP]([1-4])\s*/);
  if (priorityMatch) {
    priority = parseInt(priorityMatch[1]);
    text = text.replace(priorityMatch[0], ' ');
  }

  let labelMatch;
  const labelRegex = /@(\w+)/g;
  while ((labelMatch = labelRegex.exec(input)) !== null) {
    labels.push(labelMatch[1]);
  }
  text = text.replace(/@\w+/g, '');

  const todayMatch = text.match(/\s+(heute|today)\s*/i);
  if (todayMatch) {
    dueDate = new Date();
    text = text.replace(todayMatch[0], ' ');
  }

  const tomorrowMatch = text.match(/\s+(morgen|tomorrow)\s*/i);
  if (tomorrowMatch) {
    dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    text = text.replace(tomorrowMatch[0], ' ');
  }

  const weekdayMap: Record<string, number> = {
    'montag': 1, 'monday': 1,
    'dienstag': 2, 'tuesday': 2,
    'mittwoch': 3, 'wednesday': 3,
    'donnerstag': 4, 'thursday': 4,
    'freitag': 5, 'friday': 5,
    'samstag': 6, 'saturday': 6,
    'sonntag': 0, 'sunday': 0,
  };

  const weekdayPattern = Object.keys(weekdayMap).join('|');
  const weekdayMatch = text.match(new RegExp(`\\s+(${weekdayPattern})\\s*`, 'i'));
  if (weekdayMatch) {
    const targetDay = weekdayMap[weekdayMatch[1].toLowerCase()];
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    dueDate = new Date();
    dueDate.setDate(today.getDate() + daysUntil);
    text = text.replace(weekdayMatch[0], ' ');
  }

  const timeMatch = text.match(/\s+(?:um\s+)?(\d{1,2}):(\d{2})\s*/i);
  if (timeMatch) {
    dueTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    text = text.replace(timeMatch[0], ' ');
    if (!dueDate) dueDate = new Date();
  }

  return {
    text: text.trim(),
    priority,
    dueDate,
    dueTime,
    labels: labels.length > 0 ? labels : undefined,
  };
}

export const PRIORITY_COLORS: Record<number, string> = {
  1: '#dc2626',
  2: '#f97316',
  3: '#3b82f6',
  4: '#6b7280',
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Priorität 1',
  2: 'Priorität 2',
  3: 'Priorität 3',
  4: 'Priorität 4',
};
