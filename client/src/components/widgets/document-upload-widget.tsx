import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileText, Download, Loader2, AlertCircle, Check, X, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fallback for environments where crypto.randomUUID is not supported
  }
  const timestamp = Date.now().toString(36);
  const randomPart1 = Math.random().toString(36).slice(2, 11);
  const randomPart2 = Math.random().toString(36).slice(2, 11);
  return `${timestamp}-${randomPart1}-${randomPart2}`;
}

interface ProcessedDocument {
  id: string;
  originalName: string;
  suggestedName: string;
  companyName: string;
  documentType: string;
  date: string;
  status: "processing" | "ready" | "error";
  error?: string;
  downloadUrl?: string;
  file?: File;
}

export function DocumentUploadWidget() {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/documents/analyze", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analyse fehlgeschlagen");
      }
      
      return res.json();
    },
    onSuccess: (data, file) => {
      setDocuments(prev => prev.map(doc => 
        doc.originalName === file.name && doc.status === "processing"
          ? {
              ...doc,
              status: "ready" as const,
              suggestedName: data.suggestedName,
              companyName: data.companyName,
              documentType: data.documentType,
              date: data.date,
              downloadUrl: data.downloadUrl,
            }
          : doc
      ));
    },
    onError: (error: Error, file) => {
      setDocuments(prev => prev.map(doc => 
        doc.originalName === file.name && doc.status === "processing"
          ? { ...doc, status: "error" as const, error: error.message }
          : doc
      ));
    },
  });

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newDocs: ProcessedDocument[] = [];
    
    Array.from(files).forEach(file => {
      const doc: ProcessedDocument = {
        id: generateId(),
        originalName: file.name,
        suggestedName: "",
        companyName: "",
        documentType: "",
        date: new Date().toISOString().split("T")[0],
        status: "processing",
        file: file,
      };
      newDocs.push(doc);
      uploadMutation.mutate(file);
    });
    
    setDocuments(prev => [...prev, ...newDocs]);
  }, [uploadMutation]);

  const retryUpload = useCallback((doc: ProcessedDocument) => {
    if (!doc.file) return;
    
    setDocuments(prev => prev.map(d => 
      d.id === doc.id ? { ...d, status: "processing" as const, error: undefined } : d
    ));
    uploadMutation.mutate(doc.file);
  }, [uploadMutation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDownload = (doc: ProcessedDocument) => {
    if (!doc.downloadUrl) return;
    
    const link = document.createElement("a");
    link.href = doc.downloadUrl;
    link.download = doc.suggestedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const clearAll = () => {
    setDocuments([]);
  };

  return (
    <div className="h-full flex flex-col" data-testid="document-upload-widget">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          <h3 className="font-semibold text-sm">Dokument Umbenenner</h3>
        </div>
        {documents.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
            data-testid="button-clear-all"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Alle löschen
          </Button>
        )}
      </div>

      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer",
            "flex flex-col items-center justify-center gap-2 min-h-[100px]",
            isDragging 
              ? "border-emerald-500 bg-emerald-50" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
          )}
          data-testid="dropzone"
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              isDragging ? "bg-emerald-500 text-white" : "bg-muted"
            )}>
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragging ? "Hier ablegen" : "Dokumente hochladen"}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, Word oder Text-Dateien
              </p>
            </div>
          </label>
        </div>

        {documents.length > 0 && (
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    doc.status === "ready" && "bg-emerald-50 border-emerald-200",
                    doc.status === "processing" && "bg-blue-50 border-blue-200",
                    doc.status === "error" && "bg-red-50 border-red-200"
                  )}
                  data-testid={`document-${doc.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {doc.status === "processing" && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                        {doc.status === "ready" && (
                          <Check className="h-4 w-4 text-emerald-600" />
                        )}
                        {doc.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-xs text-muted-foreground truncate">
                          {doc.originalName}
                        </span>
                      </div>
                      
                      {doc.status === "processing" && (
                        <div className="mt-2">
                          <p className="text-xs text-blue-600 mb-1">Analysiere Inhalt...</p>
                          <Progress value={66} className="h-1" />
                        </div>
                      )}
                      
                      {doc.status === "ready" && (
                        <div className="mt-1">
                          <p className="text-sm font-medium text-emerald-800 truncate">
                            {doc.suggestedName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{doc.companyName}</span>
                            <span>•</span>
                            <span>{doc.documentType}</span>
                          </div>
                        </div>
                      )}
                      
                      {doc.status === "error" && (
                        <p className="text-xs text-red-600 mt-1">{doc.error}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {doc.status === "ready" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                          className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                          data-testid={`download-${doc.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {doc.status === "error" && doc.file && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => retryUpload(doc)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          data-testid={`retry-${doc.id}`}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeDocument(doc.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        data-testid={`remove-${doc.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {documents.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-xs text-center">
              Laden Sie ein Dokument hoch um es automatisch<br />
              umzubenennen im Format:<br />
              <span className="font-mono text-emerald-600">YYYY-MM-DD_Firma_Dokument</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
