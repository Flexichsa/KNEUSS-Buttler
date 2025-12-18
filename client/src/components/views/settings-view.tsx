import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Mail, Calendar, Loader2, AlertCircle, ExternalLink, User } from "lucide-react";
import { useOutlookStatus, useOutlookUserInfo } from "@/hooks/use-outlook";

export function SettingsView() {
  const { data: status, isLoading } = useOutlookStatus();
  const { data: userInfo, isLoading: userLoading } = useOutlookUserInfo();
  const isConnected = status?.connected ?? false;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Einstellungen</h2>
        <p className="text-muted-foreground">Integrationen und Einstellungen verwalten</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Integrationen</CardTitle>
            <CardDescription>Verbinde deine externen Konten um KI-Funktionen zu aktivieren.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Microsoft Outlook Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-[#0078D4] rounded-md flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Microsoft Outlook</h3>
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : isConnected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
                        <Check className="h-3 w-3" />
                        Verbunden
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                        Nicht verbunden
                      </Badge>
                    )}
                  </div>
                  {isConnected && userInfo ? (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {userInfo.displayName} ({userInfo.email})
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">E-Mails, Kalendertermine und Kontakte synchronisieren</p>
                  )}
                </div>
              </div>
              
              <div>
                {!isConnected && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    Verbindung in Replit erforderlich
                  </Badge>
                )}
              </div>
            </div>

            {/* OneDrive Integration (Placeholder) */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white opacity-60">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-[#0078D4] rounded-md flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-1.7-1.3-3-3-3h-1.1c-.2-2.3-2.1-4-4.4-4-2.3 0-4.3 1.8-4.3 4H4c-2.2 0-4 1.8-4 4s1.8 4 4 4h13.5c2.5 0 4.5-2 4.5-4.5S20 19 17.5 19z"/></svg>
                </div>
                <div>
                  <h3 className="font-semibold">Microsoft OneDrive</h3>
                  <p className="text-sm text-muted-foreground">Zugriff auf Dateien und Dokumente</p>
                </div>
              </div>
              <Button variant="outline" disabled>Kommt bald</Button>
            </div>
          </CardContent>
        </Card>

        {/* Connected Account Info */}
        {isConnected && userInfo && (
          <Card className="animate-in fade-in slide-in-from-top-2">
            <CardHeader>
              <CardTitle>Verbundenes Konto</CardTitle>
              <CardDescription>Details zum verbundenen Microsoft-Konto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Name</p>
                  <p className="font-medium">{userInfo.displayName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">E-Mail</p>
                  <p className="font-medium">{userInfo.email}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Verfügbare Kalender</p>
                <div className="flex flex-wrap gap-2">
                  {userInfo.calendars.map((cal, i) => (
                    <Badge key={i} variant="secondary">{cal}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-xs flex gap-2 items-start mt-4">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Konto wechseln</p>
                  <p>
                    Um ein anderes Microsoft-Konto zu verbinden, musst du im Replit-Editor auf "Connections" 
                    im linken Panel klicken und dort die Outlook-Verbindung neu konfigurieren.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sync Settings */}
        {isConnected && (
          <Card className="animate-in fade-in slide-in-from-top-2">
            <CardHeader>
              <CardTitle>Synchronisierungs-Einstellungen</CardTitle>
              <CardDescription>Wähle welche Daten du mit dem Assistenten teilen möchtest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sync-emails">E-Mails synchronisieren</Label>
                </div>
                <Switch id="sync-emails" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sync-calendar">Kalender synchronisieren</Label>
                </div>
                <Switch id="sync-calendar" defaultChecked />
              </div>
              
              <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-xs flex gap-2 items-start mt-4">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Deine Daten werden sicher verarbeitet. Der KI-Assistent greift nur auf E-Mails und Termine zu, wenn du explizit danach fragst oder proaktive Zusammenfassungen aktivierst.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isConnected && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground mb-1">Verbinde Outlook um zu beginnen</p>
                  <p>
                    Nach der Verbindung sind deine Kalender- und E-Mail-Daten für den KI-Assistenten verfügbar. 
                    Du kannst dann Fragen zu deinem Zeitplan stellen, E-Mail-Zusammenfassungen erhalten und intelligente Vorschläge bekommen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
