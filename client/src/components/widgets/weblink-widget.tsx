import { ExternalLink, Globe, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { WeblinkSettings } from "@shared/schema";

interface WeblinkWidgetProps {
  settings?: WeblinkSettings;
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
  } catch {
    return "";
  }
}

export function WeblinkWidget({ settings }: WeblinkWidgetProps) {
  const [faviconLoaded, setFaviconLoaded] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  
  const url = settings?.url || "";
  const title = settings?.title || extractDomain(url);
  const backgroundColor = settings?.backgroundColor || "#3b82f6";
  
  const faviconUrl = getFaviconUrl(url);
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;
  
  useEffect(() => {
    setFaviconLoaded(false);
    setFaviconError(false);
  }, [url]);

  const handleClick = () => {
    if (url) {
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!url) {
    return (
      <div 
        className="h-full w-full rounded-xl flex items-center justify-center p-2"
        style={{ backgroundColor }}
        data-testid="weblink-widget-empty"
      >
        <div className="flex flex-col items-center text-center">
          <Globe className="h-6 w-6 text-white/60 mb-1" />
          <p className="text-white/70 text-[10px] leading-tight">Einstellungen öffnen</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="h-full w-full rounded-xl flex items-center justify-center p-2 cursor-pointer transition-all hover:scale-[1.02] hover:brightness-110 group relative overflow-hidden"
      style={{ backgroundColor }}
      data-testid="weblink-widget"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md">
          {faviconUrl && !faviconError ? (
            <>
              {!faviconLoaded && (
                <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
              )}
              <img
                src={faviconUrl}
                alt={title}
                className={`w-6 h-6 object-contain ${faviconLoaded ? "block" : "hidden"}`}
                onLoad={() => setFaviconLoaded(true)}
                onError={() => setFaviconError(true)}
              />
            </>
          ) : (
            <Globe className="h-5 w-5 text-gray-600" />
          )}
        </div>
        
        <div className="text-center max-w-full px-1">
          <p className="text-white font-semibold text-xs truncate leading-tight drop-shadow-sm">
            {title}
          </p>
          <p className="text-white/60 text-[9px] truncate leading-tight">
            {extractDomain(url)}
          </p>
        </div>
      </div>
      
      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-3 w-3 text-white/50" />
      </div>
    </button>
  );
}
