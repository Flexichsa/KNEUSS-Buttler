import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HardDrive, File, Folder, FileText, FileImage, FileVideo, FileAudio, FileSpreadsheet, Presentation, Loader2, AlertCircle, ExternalLink, Clock, ChevronLeft, Home, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface OneDriveItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  webUrl: string;
  isFolder: boolean;
  mimeType?: string;
}

interface FolderPath {
  id: string | null;
  name: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(item: OneDriveItem) {
  if (item.isFolder) {
    return <Folder className="h-5 w-5 text-yellow-500" />;
  }
  
  const mimeType = item.mimeType || "";
  const name = item.name.toLowerCase();
  
  if (mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|svg|webp)$/.test(name)) {
    return <FileImage className="h-5 w-5 text-pink-500" />;
  }
  if (mimeType.startsWith("video/") || /\.(mp4|mov|avi|mkv)$/.test(name)) {
    return <FileVideo className="h-5 w-5 text-purple-500" />;
  }
  if (mimeType.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/.test(name)) {
    return <FileAudio className="h-5 w-5 text-green-500" />;
  }
  if (/\.(xlsx?|csv)$/.test(name) || mimeType.includes("spreadsheet")) {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
  }
  if (/\.(pptx?|ppt)$/.test(name) || mimeType.includes("presentation")) {
    return <Presentation className="h-5 w-5 text-orange-500" />;
  }
  if (/\.(docx?|pdf|txt|md)$/.test(name) || mimeType.includes("document") || mimeType.includes("text")) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  
  return <File className="h-5 w-5 text-gray-500" />;
}

export function OneDriveWidget() {
  const [folderPath, setFolderPath] = useState<FolderPath[]>([{ id: null, name: "OneDrive" }]);
  const currentFolderId = folderPath[folderPath.length - 1].id;

  const { data: files, isLoading, error } = useQuery<OneDriveItem[]>({
    queryKey: ["onedrive-files", currentFolderId],
    queryFn: async () => {
      const url = currentFolderId 
        ? `/api/onedrive/files?folderId=${currentFolderId}`
        : "/api/onedrive/files";
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch files");
      }
      const allFiles = await res.json() as OneDriveItem[];
      return allFiles.filter(item => {
        const name = item.name.toLowerCase();
        return !name.includes("onenote") && !name.endsWith(".one") && !name.endsWith(".onepkg");
      });
    },
    refetchInterval: 120000,
    staleTime: 60000,
    retry: false,
  });

  const sortedFiles = files ? [...files].sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  }) : [];

  const navigateToFolder = (item: OneDriveItem) => {
    if (item.isFolder) {
      setFolderPath([...folderPath, { id: item.id, name: item.name }]);
    }
  };

  const navigateBack = () => {
    if (folderPath.length > 1) {
      setFolderPath(folderPath.slice(0, -1));
    }
  };

  const navigateToPathIndex = (index: number) => {
    setFolderPath(folderPath.slice(0, index + 1));
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="onedrive-widget-loading">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground p-4" data-testid="onedrive-widget-error">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-center">OneDrive nicht verbunden</p>
        <p className="text-xs text-center opacity-70">Verbinde OneDrive in den Einstellungen</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="onedrive-widget">
      <a 
        href="https://onedrive.live.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-between px-4 py-3 border-b hover:bg-muted/50 transition-colors cursor-pointer group"
        data-testid="onedrive-widget-header"
      >
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">OneDrive</h3>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {sortedFiles.length} Dateien
        </Badge>
      </a>

      {folderPath.length > 1 && (
        <div className="flex items-center gap-1 px-2 py-2 border-b bg-muted/30 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateBack}
            className="h-7 px-2 flex-shrink-0"
            data-testid="onedrive-back-button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm overflow-x-auto">
            {folderPath.map((folder, index) => (
              <div key={index} className="flex items-center flex-shrink-0">
                {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />}
                <button
                  onClick={() => navigateToPathIndex(index)}
                  className={cn(
                    "hover:text-primary transition-colors px-1 py-0.5 rounded",
                    index === folderPath.length - 1 
                      ? "font-medium text-foreground" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  data-testid={`breadcrumb-${index}`}
                >
                  {index === 0 ? <Home className="h-4 w-4" /> : folder.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Folder className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm">Keine Dateien gefunden</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sortedFiles.map((item) => (
              item.isFolder ? (
                <button
                  key={item.id}
                  onClick={() => navigateToFolder(item)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group text-left"
                  data-testid={`folder-${item.id}`}
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(item)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>Ordner</span>
                      <span>
                        {formatDistanceToNow(parseISO(item.lastModifiedDateTime), { 
                          addSuffix: true, 
                          locale: de 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ) : (
                <a
                  key={item.id}
                  href={item.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  data-testid={`file-${item.id}`}
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(item)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{formatFileSize(item.size)}</span>
                      <span>
                        {formatDistanceToNow(parseISO(item.lastModifiedDateTime), { 
                          addSuffix: true, 
                          locale: de 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              )
            ))}
          </div>
        </ScrollArea>
      )}
      
      <a
        href="https://onedrive.live.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-2 border-t text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
        data-testid="onedrive-open-all"
      >
        <span>Alle Dateien in OneDrive anzeigen</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
