import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { File, Folder, FileText, FileImage, FileVideo, FileAudio, FileSpreadsheet, Presentation, Loader2, AlertCircle, ExternalLink, ChevronLeft, Home, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

function OneDriveLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="none"
    >
      <path 
        d="M12.5 6c2.5 0 4.6 1.8 5 4.2.3-.1.6-.2 1-.2 2.2 0 4 1.8 4 4s-1.8 4-4 4H6c-2.8 0-5-2.2-5-5 0-2.5 1.8-4.5 4.2-4.9C6.2 5.3 9.1 3.5 12.5 6z" 
        fill="#0364B8"
      />
      <path 
        d="M10 8.5c1.8 0 3.4 1.1 4.1 2.7.4-.1.8-.2 1.2-.2 2.1 0 3.7 1.7 3.7 3.7 0 .5-.1 1-.3 1.4h-13c-.3-.4-.5-.9-.5-1.4 0-1.5 1.2-2.8 2.7-2.8.3 0 .5 0 .8.1C9.3 10 10.5 8.5 10 8.5z" 
        fill="#0078D4"
      />
      <path 
        d="M6 14c0-1.3.8-2.4 2-2.7-.5-.5-.8-1.2-.8-2C7.2 8 8.5 7 10 7c.9 0 1.7.3 2.3.9.7-.6 1.5-.9 2.5-.9 2 0 3.6 1.4 4 3.2.2 0 .4-.1.7-.1 1.9 0 3.5 1.6 3.5 3.5s-1.6 3.5-3.5 3.5H6.5C4.6 17 3 15.4 3 13.5c0-1.6 1.1-2.9 2.5-3.3.3.5.5 1 .5 1.5V14z" 
        fill="#1490DF"
      />
      <path 
        d="M19.5 11c-.2 0-.4 0-.5.1-.4-1.8-2-3.1-3.9-3.1-.9 0-1.8.3-2.5.9-.6-.6-1.4-.9-2.3-.9-1.5 0-2.8 1-3.2 2.3-.3 0-.5-.1-.8-.1-1.5 0-2.7 1.2-2.7 2.7 0 .5.2 1 .4 1.4h13.2c.2-.4.3-.9.3-1.4 0-1.9-1.5-3.5-3.5-3.5-.2-.2-.3-.4-.5-.4z" 
        fill="#28A8EA"
      />
    </svg>
  );
}

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
        className="flex items-center gap-3 px-4 pr-14 py-3 border-b hover:bg-muted/50 transition-colors cursor-pointer group"
        data-testid="onedrive-widget-header"
      >
        <OneDriveLogo className="h-6 w-6" />
        <h3 className="font-semibold text-base text-[#0078D4] group-hover:text-[#0364B8] transition-colors">OneDrive</h3>
        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>

      <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/20 overflow-x-auto">
        {folderPath.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateBack}
            className="h-7 px-2 flex-shrink-0"
            data-testid="onedrive-back-button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
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

      {sortedFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Folder className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm">Keine Dateien gefunden</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="border-b bg-muted/30 px-3 py-2 flex items-center text-xs font-medium text-muted-foreground">
            <div className="flex-1">Name</div>
            <div className="w-32 text-right">Geändert</div>
          </div>
          <div className="divide-y">
            {sortedFiles.map((item) => (
              item.isFolder ? (
                <button
                  key={item.id}
                  onClick={() => navigateToFolder(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#E5F1FB] transition-colors group text-left"
                  data-testid={`folder-${item.id}`}
                >
                  <Folder className="h-5 w-5 text-[#FFB900] flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate group-hover:text-[#0078D4] transition-colors">
                      {item.name}
                    </p>
                  </div>
                  
                  <div className="w-32 text-right text-xs text-muted-foreground flex-shrink-0">
                    {format(parseISO(item.lastModifiedDateTime), "dd.MM.yyyy", { locale: de })}
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ) : (
                <a
                  key={item.id}
                  href={item.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#E5F1FB] transition-colors group"
                  data-testid={`file-${item.id}`}
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(item)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate group-hover:text-[#0078D4] transition-colors">
                      {item.name}
                    </p>
                  </div>
                  
                  <div className="w-32 text-right text-xs text-muted-foreground flex-shrink-0">
                    {format(parseISO(item.lastModifiedDateTime), "dd.MM.yyyy", { locale: de })}
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
