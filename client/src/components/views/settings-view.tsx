import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, Mail, Calendar, Loader2, AlertCircle, User, LogOut, HardDrive, ExternalLink, Save, Key } from "lucide-react";
import { useOutlookStatus, useOutlookUserInfo, useOAuthConfig, useUserOutlookStatus, useConnectOutlook, useDisconnectOutlook } from "@/hooks/use-outlook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
    }
  }, [user]);
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; email?: string }) => {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Profil aktualisieren fehlgeschlagen");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      toast({ title: "Erfolg", description: "Profil wurde aktualisiert" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });
  
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Passwort ändern fehlgeschlagen");
      }
      return res.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast({ title: "Erfolg", description: "Passwort wurde geändert" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });
  
  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({ firstName, lastName, email });
  };
  
  const handleChangePassword = () => {
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Fehler", description: "Passwörter stimmen nicht überein", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Fehler", description: "Passwort muss mindestens 6 Zeichen haben", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };
  
  const { data: oauthConfig } = useOAuthConfig();
  const { data: legacyStatus, isLoading: legacyLoading } = useOutlookStatus();
  const { data: userInfo, isLoading: userLoading } = useOutlookUserInfo();
  const { data: userOAuthStatus, isLoading: oauthLoading } = useUserOutlookStatus(sessionId);
  
  const { data: onedriveStatus, isLoading: onedriveLoading } = useQuery<{ connected: boolean }>({
    queryKey: ["onedrive-status"],
    queryFn: async () => {
      const res = await fetch("/api/onedrive/status");
      return res.json();
    },
    staleTime: 60000,
    retry: false,
  });
  
  const connectOutlook = useConnectOutlook();
  const disconnectOutlook = useDisconnectOutlook();
  
  const oauthConfigured = oauthConfig?.configured ?? false;
  const userConnected = userOAuthStatus?.connected ?? false;
  const legacyConnected = legacyStatus?.connected ?? false;
  const isConnected = userConnected || legacyConnected;
  const isLoading = legacyLoading || oauthLoading;
  const onedriveConnected = onedriveStatus?.connected ?? false;

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
  const outlookEmail = userConnected ? userOAuthStatus?.email : userInfo?.email;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Einstellungen</h2>
        <p className="text-muted-foreground">Integrationen und Einstellungen verwalten</p>
      </div>

      <div className="grid gap-6">
        {user && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Benutzerprofil
                </CardTitle>
                <CardDescription>Verwalten Sie Ihre persönlichen Daten</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      data-testid="input-profile-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      data-testid="input-profile-lastname"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-profile-email"
                  />
                </div>
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Profil speichern
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Passwort ändern
                </CardTitle>
                <CardDescription>Ändern Sie Ihr Anmeldepasswort</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nur erforderlich wenn bereits ein Passwort gesetzt ist"
                    data-testid="input-current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mindestens 6 Zeichen"
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Neues Passwort bestätigen</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    data-testid="input-confirm-new-password"
                  />
                </div>
                <Button 
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending || !newPassword}
                  data-testid="button-change-password"
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Passwort ändern
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        
        {!user && !authLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <User className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground mb-1">Nicht angemeldet</p>
                  <p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto" 
                      onClick={() => setLocation("/login")}
                    >
                      Melden Sie sich an
                    </Button>{" "}
                    um Ihre Einstellungen zu verwalten und Ihr Dashboard auf allen Geräten zu synchronisieren.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  {isConnected && (displayName || outlookEmail) ? (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground" data-testid="text-outlook-user">
                        {displayName} {outlookEmail && `(${outlookEmail})`}
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

            {/* OneDrive Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-[#0078D4] rounded-md flex items-center justify-center text-white">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Microsoft OneDrive</h3>
                    {onedriveLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : onedriveConnected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1" data-testid="badge-onedrive-connected">
                        <Check className="h-3 w-3" />
                        Verbunden
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200" data-testid="badge-onedrive-disconnected">
                        Nicht verbunden
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Zugriff auf Dateien und Dokumente</p>
                </div>
              </div>
              {!onedriveConnected && (
                <div className="text-xs text-muted-foreground text-right max-w-[200px]">
                  Aktiviere OneDrive über die Replit Connections
                </div>
              )}
              {onedriveConnected && (
                <a 
                  href="https://onedrive.live.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  data-testid="link-onedrive-open"
                >
                  OneDrive öffnen
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connected Account Info */}
        {isConnected && (displayName || outlookEmail || (userInfo && userInfo.calendars)) && (
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
                  <p className="font-medium" data-testid="text-account-email">{outlookEmail || 'Unbekannt'}</p>
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
