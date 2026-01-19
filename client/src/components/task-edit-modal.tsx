import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Flag,
  Paperclip,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  Sun,
  CalendarDays,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  useTodoAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  useUpdateTodo,
  useTodoLabels,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  type Todo,
  type TodoAttachment,
} from "@/hooks/use-todos";

interface TaskEditModalProps {
  todo: Todo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOFT_PRIORITY_COLORS: Record<number, string> = {
  1: '#dc2626',
  2: '#ea580c',
  3: '#2563eb',
  4: '#9ca3af'
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <FileText className="h-5 w-5 text-blue-600" />;
  }
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return <FileText className="h-5 w-5 text-green-600" />;
  }
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return <FileText className="h-5 w-5 text-orange-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function AttachmentPreview({ attachment, onDelete }: { attachment: TodoAttachment; onDelete: () => void }) {
  const isImage = attachment.mimeType.startsWith('image/');
  const [imageError, setImageError] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  return (
    <>
      <div className="group relative flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all">
        {isImage && !imageError ? (
          <div 
            className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 cursor-pointer"
            onClick={() => setShowFullPreview(true)}
          >
            <img
              src={`/api/attachments/${attachment.id}/preview`}
              alt={attachment.originalName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
            {getFileIcon(attachment.mimeType)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">
            {attachment.originalName}
          </p>
          <p className="text-xs text-slate-400">
            {formatFileSize(attachment.size)}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isImage && !imageError && (
            <button
              onClick={() => setShowFullPreview(true)}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              title="Vorschau"
              data-testid={`btn-preview-${attachment.id}`}
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
          <a
            href={`/api/attachments/${attachment.id}/download`}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            title="Herunterladen"
            data-testid={`btn-download-${attachment.id}`}
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"
            title="Löschen"
            data-testid={`btn-delete-attachment-${attachment.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showFullPreview && isImage && (
        <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{attachment.originalName}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              <img
                src={`/api/attachments/${attachment.id}/preview`}
                alt={attachment.originalName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function TaskEditModal({ todo, open, onOpenChange }: TaskEditModalProps) {
  const [text, setText] = useState(todo?.text || "");
  const [description, setDescription] = useState(todo?.description || "");
  const [priority, setPriority] = useState(todo?.priority || 4);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    todo?.dueDate ? new Date(todo.dueDate) : undefined
  );
  const [dueTime, setDueTime] = useState(todo?.dueTime || "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: attachments = [], isLoading: attachmentsLoading } = useTodoAttachments(todo?.id || null);
  const { data: labels = [] } = useTodoLabels();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();
  const updateTodo = useUpdateTodo();

  const handleSave = useCallback(() => {
    if (!todo || !text.trim()) return;

    updateTodo.mutate({
      id: todo.id,
      text: text.trim(),
      description: description.trim() || null,
      priority,
      dueDate: dueDate?.toISOString() || null,
      dueTime: dueTime || null,
    });

    onOpenChange(false);
  }, [todo, text, description, priority, dueDate, dueTime, updateTodo, onOpenChange]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || !todo) return;

    Array.from(files).forEach((file) => {
      uploadAttachment.mutate({ todoId: todo.id, file });
    });
  }, [todo, uploadAttachment]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const formatDueDateDisplay = () => {
    if (!dueDate) return "Fälligkeitsdatum";
    if (isToday(dueDate)) return "Heute";
    if (isTomorrow(dueDate)) return "Morgen";
    return format(dueDate, "dd. MMM yyyy", { locale: de });
  };

  if (!todo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-800">
            Aufgabe bearbeiten
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Aufgabe..."
              className="text-base font-medium border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500"
              data-testid="input-task-title"
            />
          </div>

          <div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung hinzufügen..."
              className="min-h-[80px] resize-none border-slate-200"
              data-testid="input-task-description"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "gap-2 text-sm",
                    dueDate ? "text-blue-600 border-blue-200 bg-blue-50" : ""
                  )}
                  data-testid="btn-select-date"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {formatDueDateDisplay()}
                  {dueDate && (
                    <X
                      className="h-3 w-3 ml-1 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDueDate(undefined);
                        setDueTime("");
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 border-b space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDueDate(new Date());
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
                      setDueDate(tomorrow);
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
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setCalendarOpen(false);
                  }}
                  locale={de}
                  initialFocus
                  className="rounded-b-md"
                />
              </PopoverContent>
            </Popover>

            {dueDate && (
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-28 text-sm"
                data-testid="input-task-time"
              />
            )}

            <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-sm"
                  style={{
                    color: priority < 4 ? SOFT_PRIORITY_COLORS[priority] : undefined,
                    borderColor: priority < 4 ? SOFT_PRIORITY_COLORS[priority] + '40' : undefined,
                    backgroundColor: priority < 4 ? SOFT_PRIORITY_COLORS[priority] + '10' : undefined,
                  }}
                  data-testid="btn-select-priority"
                >
                  <Flag className="h-4 w-4" fill={priority < 4 ? 'currentColor' : 'none'} />
                  {PRIORITY_LABELS[priority]}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1" align="start">
                {[1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPriority(p);
                      setPriorityOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 rounded-md",
                      priority === p && "bg-slate-100"
                    )}
                  >
                    <Flag
                      className="h-4 w-4"
                      style={{ color: SOFT_PRIORITY_COLORS[p] }}
                      fill={p < 4 ? SOFT_PRIORITY_COLORS[p] : 'none'}
                    />
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Anhänge
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                data-testid="btn-add-attachment"
              >
                <Upload className="h-4 w-4 mr-1" />
                Datei hinzufügen
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              />
            </div>

            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {uploadAttachment.isPending ? (
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Wird hochgeladen...
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Dateien hierher ziehen oder{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    durchsuchen
                  </button>
                </p>
              )}
            </div>

            {attachmentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <AttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    onDelete={() => deleteAttachment.mutate({ id: attachment.id, todoId: todo.id })}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {todo.labelIds && todo.labelIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {todo.labelIds.map((labelId) => {
                const label = labels.find((l) => l.id === labelId);
                if (!label) return null;
                return (
                  <span
                    key={labelId}
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: label.color + '20',
                      color: label.color,
                    }}
                  >
                    {label.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="btn-cancel-edit"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!text.trim() || updateTodo.isPending}
            data-testid="btn-save-task"
          >
            {updateTodo.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              "Speichern"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
