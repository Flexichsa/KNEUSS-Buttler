import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Mail, Calendar, Loader2, AlertCircle, User, LogOut } from "lucide-react";
import { useOutlookStatus, useOutlookUserInfo, useOAuthConfig, useUserOutlookStatus, useConnectOutlook, useDisconnectOutlook } from "@/hooks/use-outlook";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

function getSessionId(): string {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

export function SettingsView() {
  const [sessionId] = useState(() => getSessionId());
  const [, setLocation] = useLocation();
  
  const { data: oauthConfig } = useOAuthConfig();
  const { data: legacyStatus, isLoading: legacyLoading } = useOutlookStatus();
  const { data: userInfo, isLoading: userLoading } = useOutlookUserInfo();
  const { data: userOAuthStatus, isLoading: oauthLoading } = useUserOutlookStatus(sessionId);
  
  const connectOutlook = useConnectOutlook();
  const disconnectOutlook = useDisconnectOutlook();
  
  const oauthConfigured = oauthConfig?.configured ?? false;
  const userConnected = userOAuthStatus?.connected ?? false;
  const legacyConnected = legacyStatus?.connected ?? false;
  const isConnected = userConnected || legacyConnected;
  const isLoading = legacyLoading || oauthLoading;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'connected' || params.get('error')) {
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const handleConnect = () => {
    connectOutlook.mutate(sessionId);
  };

  const handleDisconnect = () => {
    disconnectOutlook.mutate(sessionId);
  };

  const displayName = userConnected ? userOAuthStatus?.displayName : userInfo?.displayName;
  const email = userConnected ? userOAuthStatus?.email : userInfo?.email;

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
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1" data-testid="badge-outlook-connected">
                        <Check className="h-3 w-3" />
                        Verbunden
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200" data-testid="badge-outlook-disconnected">
                        Nicht verbunden
                      </Badge>
                    )}
                  </div>
                  {isConnected && (displayName || email) ? (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground" data-testid="text-outlook-user">
                        {displayName} {email && `(${email})`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">E-Mails, Kalendertermine und Kontakte synchronisieren</p>
                  )}
                </div>
              </div>
              
              <div>
                {oauthConfigured && !userConnected && (
                  <Button 
                    onClick={handleConnect} 
                    disabled={connectOutlook.isPending}
                    data-testid="button-connect-outlook"
                  >
                    {connectOutlook.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Mit Microsoft anmelden
                  </Button>
                )}
                {userConnected && (
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnect}
                    disabled={disconnectOutlook.isPending}
                    data-testid="button-disconnect-outlook"
                  >
                    {disconnectOutlook.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    Trennen
                  </Button>
                )}
                {!oauthConfigured && !isConnected && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    Konfiguration ausstehend
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
        {isConnected && (displayName || email || (userInfo && userInfo.calendars)) && (
          <Card className="animate-in fade-in slide-in-from-top-2">
            <CardHeader>
              <CardTitle>Verbundenes Konto</CardTitle>
              <CardDescription>Details zum verbundenen Microsoft-Konto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Name</p>
                  <p className="font-medium" data-testid="text-account-name">{displayName || 'Unbekannt'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">E-Mail</p>
                  <p className="font-medium" data-testid="text-account-email">{email || 'Unbekannt'}</p>
                </div>
              </div>
              {userInfo?.calendars && userInfo.calendars.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Verfügbare Kalender</p>
                  <div className="flex flex-wrap gap-2">
                    {userInfo.calendars.map((cal, i) => (
                      <Badge key={i} variant="secondary">{cal}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {!userConnected && legacyConnected && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-xs flex gap-2 items-start mt-4">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Konto wechseln</p>
                    <p>
                      {oauthConfigured 
                        ? 'Klicke auf "Mit Microsoft anmelden" um dein eigenes Konto zu verbinden.'
                        : 'Um ein anderes Microsoft-Konto zu verbinden, musst du im Replit-Editor auf "Connections" im linken Panel klicken und dort die Outlook-Verbindung neu konfigurieren.'}
                    </p>
                  </div>
                </div>
              )}
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
                <Switch id="sync-emails" defaultChecked data-testid="switch-sync-emails" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sync-calendar">Kalender synchronisieren</Label>
                </div>
                <Switch id="sync-calendar" defaultChecked data-testid="switch-sync-calendar" />
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
                    {oauthConfigured 
                      ? 'Klicke auf "Mit Microsoft anmelden" um deine Kalender- und E-Mail-Daten für den KI-Assistenten verfügbar zu machen.'
                      : 'Nach der Verbindung sind deine Kalender- und E-Mail-Daten für den KI-Assistenten verfügbar. Du kannst dann Fragen zu deinem Zeitplan stellen, E-Mail-Zusammenfassungen erhalten und intelligente Vorschläge bekommen.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* OAuth Configuration Notice */}
        {!oauthConfigured && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-medium text-foreground mb-1">Benutzer-spezifische Anmeldung</p>
                  <p>
                    Um jedem Benutzer zu erlauben, sein eigenes Microsoft-Konto zu verbinden, wird eine Azure App-Registrierung benötigt. 
                    Sobald MICROSOFT_CLIENT_ID und MICROSOFT_CLIENT_SECRET konfiguriert sind, erscheint hier ein "Mit Microsoft anmelden" Button.
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
