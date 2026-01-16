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
        className="h-full rounded-2xl flex flex-col items-center justify-center p-4 text-center"
        style={{ backgroundColor }}
        data-testid="weblink-widget-empty"
      >
        <Globe className="h-10 w-10 text-white/60 mb-2" />
        <p className="text-white/80 text-sm font-medium">Webseiten-Link</p>
        <p className="text-white/60 text-xs mt-1">Klicke auf Einstellungen um eine URL hinzuzufügen</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="h-full w-full rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl group relative overflow-hidden"
      style={{ backgroundColor }}
      data-testid="weblink-widget"
    >
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 shadow-lg">
          {faviconUrl && !faviconError ? (
            <>
              {!faviconLoaded && (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              )}
              <img
                src={faviconUrl}
                alt={title}
                className={`w-10 h-10 object-contain ${faviconLoaded ? "block" : "hidden"}`}
                onLoad={() => setFaviconLoaded(true)}
                onError={() => setFaviconError(true)}
              />
            </>
          ) : (
            <Globe className="h-8 w-8 text-white" />
          )}
        </div>
        
        <h3 className="text-white font-bold text-base truncate max-w-full px-2">
          {title}
        </h3>
        <p className="text-white/70 text-xs truncate max-w-full px-2 mt-0.5">
          {extractDomain(url)}
        </p>
        
        <div className="mt-3 flex items-center gap-1 text-white/60 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="h-3 w-3" />
          <span>Öffnen</span>
        </div>
      </div>
    </button>
  );
}
