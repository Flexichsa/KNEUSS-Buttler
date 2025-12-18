import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Mail, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export function SettingsView() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate API delay
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      toast({
        title: "Outlook Connected",
        description: "Your emails and calendar are now syncing.",
      });
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "Outlook Disconnected",
      description: "Synchronization has been paused.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your integrations and preferences</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connect your external accounts to enable AI features.</CardDescription>
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
                    {isConnected && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
                        <Check className="h-3 w-3" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Sync emails, calendar events, and contacts</p>
                </div>
              </div>
              
              <div>
                {isConnected ? (
                  <Button variant="outline" onClick={handleDisconnect} className="text-destructive hover:text-destructive hover:bg-destructive/5">
                    Disconnect
                  </Button>
                ) : (
                  <Button onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Outlook"
                    )}
                  </Button>
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
                  <p className="text-sm text-muted-foreground">Access your files and documents</p>
                </div>
              </div>
              <Button variant="outline" disabled>Coming Soon</Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        {isConnected && (
          <Card className="animate-in fade-in slide-in-from-top-2">
            <CardHeader>
              <CardTitle>Sync Preferences</CardTitle>
              <CardDescription>Choose what data you want to share with the Assistant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sync-emails">Sync Emails</Label>
                </div>
                <Switch id="sync-emails" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sync-calendar">Sync Calendar</Label>
                </div>
                <Switch id="sync-calendar" defaultChecked />
              </div>
              
              <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-xs flex gap-2 items-start mt-4">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Your data is processed securely. The AI Assistant only accesses emails and events when you explicitly ask about them or enable proactive summaries.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
