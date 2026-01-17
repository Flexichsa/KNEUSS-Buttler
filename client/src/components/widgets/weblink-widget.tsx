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
        className="h-full w-full rounded-2xl flex flex-col items-center justify-center bg-white border border-gray-100 shadow-sm"
        data-testid="weblink-widget-empty"
      >
        <Globe className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-gray-400 text-xs">Einstellungen öffnen</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="h-full w-full rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg group relative bg-white border border-gray-100 shadow-sm overflow-hidden"
      data-testid="weblink-widget"
    >
      <div className="flex-1 flex items-center justify-center w-full p-4">
        {faviconUrl && !faviconError ? (
          <>
            {!faviconLoaded && (
              <Loader2 className="h-12 w-12 text-gray-300 animate-spin" />
            )}
            <img
              src={faviconUrl}
              alt={title}
              className={`w-12 h-12 object-contain ${faviconLoaded ? "block" : "hidden"}`}
              onLoad={() => setFaviconLoaded(true)}
              onError={() => setFaviconError(true)}
            />
          </>
        ) : (
          <Globe className="h-12 w-12 text-gray-400" />
        )}
      </div>
      
      <div className="w-full px-2 pb-2 text-center">
        <p className="text-gray-800 font-medium text-xs truncate">
          {title}
        </p>
        <p className="text-gray-400 text-[10px] truncate">
          {extractDomain(url)}
        </p>
      </div>
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-3 w-3 text-gray-400" />
      </div>
    </button>
  );
}
