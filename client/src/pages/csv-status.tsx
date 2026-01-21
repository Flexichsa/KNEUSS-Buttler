import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileSpreadsheet, AlertCircle } from "lucide-react";

interface CsvUpload {
  id: number;
  filename: string | null;
  rowCount: number | null;
  uploadedAt: string;
}

interface CsvStatusData {
  latestUpload: CsvUpload | null;
  recentUploads: CsvUpload[];
}

export default function CsvStatusPage() {
  const { data, isLoading, error, refetch } = useQuery<CsvStatusData>({
    queryKey: ["/api/csv-status"],
    refetchInterval: 30000,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTimeSince = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return "gerade eben";
    if (diffMinutes < 60) return `vor ${diffMinutes} Minuten`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `vor ${diffHours} Stunden`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `vor ${diffDays} Tagen`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-container">
        <div className="text-muted-foreground">Lade Status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="error-container">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span>Fehler beim Laden des Status</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" data-testid="csv-status-page">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-title">CSV Upload Status</h1>
          <p className="text-muted-foreground">Umsatzkennzahlen-Synchronisation</p>
        </div>

        <Card data-testid="card-latest-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Letzter Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.latestUpload ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-lg font-medium" data-testid="text-filename">
                      {data.latestUpload.filename || "Unbenannt"}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid="text-time-since">
                      {getTimeSince(data.latestUpload.uploadedAt)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-2xl font-bold" data-testid="text-row-count">
                      {data.latestUpload.rowCount ?? "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">Zeilen</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm font-medium" data-testid="text-upload-time">
                      {formatDate(data.latestUpload.uploadedAt)}
                    </div>
                    <div className="text-sm text-muted-foreground">Hochgeladen am</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground" data-testid="text-no-uploads">
                <Clock className="h-8 w-8" />
                <span>Noch keine Daten empfangen</span>
              </div>
            )}
          </CardContent>
        </Card>

        {data?.recentUploads && data.recentUploads.length > 1 && (
          <Card data-testid="card-recent-uploads">
            <CardHeader>
              <CardTitle>Letzte Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentUploads.map((upload, index) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    data-testid={`row-upload-${upload.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {index === 0 && <Badge variant="default">Aktuell</Badge>}
                      <span className="text-sm">{upload.filename || "Unbenannt"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{upload.rowCount ?? "-"} Zeilen</span>
                      <span>{formatDate(upload.uploadedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Seite aktualisiert sich automatisch alle 30 Sekunden</p>
          <button 
            onClick={() => refetch()} 
            className="mt-2 text-primary hover:underline"
            data-testid="button-refresh"
          >
            Jetzt aktualisieren
          </button>
        </div>
      </div>
    </div>
  );
}
