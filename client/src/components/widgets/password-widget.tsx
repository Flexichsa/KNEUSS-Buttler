import { useState, useMemo } from "react";
import { Key, Plus, Search, Eye, EyeOff, Copy, Pencil, Trash2, Globe, User, ChevronRight, ChevronLeft, Loader2, Lock, RefreshCw, Check, Tag, Filter, CreditCard, Mail, Briefcase, Gamepad2, ShoppingBag, Wallet, Heart, Plane } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePasswords, useCreatePassword, useUpdatePassword, useDeletePassword, decryptPassword } from "@/hooks/use-passwords";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "general", label: "Allgemein", color: "bg-gray-100 text-gray-700", icon: Key },
  { value: "social", label: "Social Media", color: "bg-blue-100 text-blue-700", icon: User },
  { value: "email", label: "E-Mail", color: "bg-red-100 text-red-700", icon: Mail },
  { value: "finance", label: "Finanzen", color: "bg-green-100 text-green-700", icon: Wallet },
  { value: "shopping", label: "Shopping", color: "bg-orange-100 text-orange-700", icon: ShoppingBag },
  { value: "work", label: "Arbeit", color: "bg-purple-100 text-purple-700", icon: Briefcase },
  { value: "gaming", label: "Gaming", color: "bg-indigo-100 text-indigo-700", icon: Gamepad2 },
  { value: "streaming", label: "Streaming", color: "bg-pink-100 text-pink-700", icon: Heart },
  { value: "travel", label: "Reisen", color: "bg-cyan-100 text-cyan-700", icon: Plane },
  { value: "other", label: "Sonstiges", color: "bg-yellow-100 text-yellow-700", icon: Tag },
] as const;

const getCategoryInfo = (categoryValue: string | null) => {
  return CATEGORIES.find(c => c.value === categoryValue) || CATEGORIES[0];
};

interface Password {
  id: number;
  name: string;
  username: string | null;
  encryptedPassword: string;
  url: string | null;
  notes: string | null;
  category: string | null;
}

function generatePassword(length: number = 16): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  return password;
}

export function PasswordWidget() {
  const { data: passwords = [], isLoading } = usePasswords();
  const createPassword = useCreatePassword();
  const updatePassword = useUpdatePassword();
  const deletePasswordMutation = useDeletePassword();
  const { toast } = useToast();

  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showPassword, setShowPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [decryptedPassword, setDecryptedPassword] = useState<string>("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    category: "general"
  });

  const filteredPasswords = useMemo(() => {
    let result = passwords;
    
    if (categoryFilter !== "all") {
      result = result.filter(p => (p.category || "general") === categoryFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.username?.toLowerCase().includes(query) ||
        p.url?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [passwords, searchQuery, categoryFilter]);

  const groupedPasswords = useMemo(() => {
    const groups: Record<string, Password[]> = {};
    
    filteredPasswords.forEach(password => {
      const category = password.category || "general";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(password);
    });
    
    const sortedCategories = CATEGORIES.map(c => c.value).filter(cat => groups[cat]);
    
    return sortedCategories.map(cat => ({
      category: cat,
      info: getCategoryInfo(cat),
      passwords: groups[cat]
    }));
  }, [filteredPasswords]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({ title: "Kopiert", description: `${field} wurde in die Zwischenablage kopiert.` });
    } catch {
      toast({ title: "Fehler", description: "Konnte nicht kopieren.", variant: "destructive" });
    }
  };

  const resetFormData = () => {
    setFormData({ name: "", username: "", password: "", url: "", notes: "", category: "general" });
  };

  const handleOpenAddDialog = () => {
    resetFormData();
    setShowPassword(false);
    setShowAddDialog(true);
  };

  const handleAddPassword = () => {
    if (!formData.name.trim() || !formData.password.trim()) return;
    
    createPassword.mutate({
      name: formData.name,
      username: formData.username || undefined,
      password: formData.password,
      url: formData.url || undefined,
      notes: formData.notes || undefined,
      category: formData.category,
    }, {
      onSuccess: () => {
        setShowAddDialog(false);
        resetFormData();
        toast({ title: "Gespeichert", description: "Passwort wurde hinzugefügt." });
      },
      onError: (error: any) => {
        toast({ 
          title: "Fehler", 
          description: error?.message || "Passwort konnte nicht gespeichert werden.", 
          variant: "destructive" 
        });
      }
    });
  };

  const handleUpdatePassword = () => {
    if (!selectedPassword || !formData.name.trim()) return;
    
    updatePassword.mutate({
      id: selectedPassword.id,
      name: formData.name,
      username: formData.username || undefined,
      password: formData.password || undefined,
      url: formData.url || undefined,
      notes: formData.notes || undefined,
      category: formData.category,
    }, {
      onSuccess: () => {
        setEditMode(false);
        toast({ title: "Aktualisiert", description: "Passwort wurde aktualisiert." });
      }
    });
  };

  const handleDeletePassword = (id: number) => {
    if (confirm("Passwort wirklich löschen?")) {
      deletePasswordMutation.mutate(id, {
        onSuccess: () => {
          setSelectedPassword(null);
          setDecryptedPassword("");
          toast({ title: "Gelöscht", description: "Passwort wurde entfernt." });
        }
      });
    }
  };

  const handleShowPassword = async () => {
    if (!selectedPassword) return;
    
    if (showPassword) {
      setShowPassword(false);
      return;
    }
    
    setIsDecrypting(true);
    try {
      const pwd = await decryptPassword(selectedPassword.id);
      setDecryptedPassword(pwd);
      setShowPassword(true);
    } catch {
      toast({ title: "Fehler", description: "Passwort konnte nicht entschlüsselt werden.", variant: "destructive" });
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!selectedPassword) return;
    
    try {
      const pwd = await decryptPassword(selectedPassword.id);
      await navigator.clipboard.writeText(pwd);
      setCopiedField("Passwort");
      setTimeout(() => setCopiedField(null), 2000);
      toast({ title: "Kopiert", description: "Passwort wurde in die Zwischenablage kopiert." });
    } catch {
      toast({ title: "Fehler", description: "Passwort konnte nicht kopiert werden.", variant: "destructive" });
    }
  };

  const handleSelectPassword = (password: Password) => {
    setSelectedPassword(password);
    setShowPassword(false);
    setDecryptedPassword("");
    setEditMode(false);
  };

  const openEditMode = () => {
    if (selectedPassword) {
      setFormData({
        name: selectedPassword.name,
        username: selectedPassword.username || "",
        password: "",
        url: selectedPassword.url || "",
        notes: selectedPassword.notes || "",
        category: selectedPassword.category || "general"
      });
      setEditMode(true);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(20);
    setFormData({ ...formData, password: newPassword });
  };

  const stopPropagation = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-2xl overflow-hidden flex flex-col" data-testid="password-widget">
      <AnimatePresence mode="wait">
        {selectedPassword ? (
          <motion.div
            key="detail"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <button
                onClick={() => { setSelectedPassword(null); setEditMode(false); setShowPassword(false); setDecryptedPassword(""); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="btn-back-passwords"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{selectedPassword.name}</h3>
                {selectedPassword.username && (
                  <span className="text-xs text-gray-500">{selectedPassword.username}</span>
                )}
              </div>
              <button
                onClick={openEditMode}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="btn-edit-password"
              >
                <Pencil className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDeletePassword(selectedPassword.id)}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                data-testid="btn-delete-password"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {editMode ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    autoComplete="off"
                    data-testid="input-edit-name"
                  />
                  <Input
                    placeholder="Benutzername"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    autoComplete="off"
                    data-testid="input-edit-username"
                  />
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Neues Passwort (leer lassen für unverändert)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pr-20"
                      autoComplete="new-password"
                      data-testid="input-edit-password"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Passwort generieren"
                      >
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <Input
                    placeholder="URL"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    autoComplete="off"
                    data-testid="input-edit-url"
                  />
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Kategorie</label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger data-testid="select-edit-category">
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="w-4 h-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdatePassword} disabled={updatePassword.isPending} className="flex-1" data-testid="btn-save-password">
                      {updatePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)} data-testid="btn-cancel-edit">
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPassword.username && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Benutzername</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 font-mono">{selectedPassword.username}</span>
                        <button
                          onClick={() => handleCopy(selectedPassword.username!, "Benutzername")}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          data-testid="btn-copy-username"
                        >
                          {copiedField === "Benutzername" ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Passwort</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 font-mono">
                        {isDecrypting ? (
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        ) : showPassword ? (
                          decryptedPassword || "••••••••••••"
                        ) : (
                          "••••••••••••"
                        )}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={handleShowPassword}
                          disabled={isDecrypting}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                          data-testid="btn-toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                        <button
                          onClick={handleCopyPassword}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          data-testid="btn-copy-password"
                        >
                          {copiedField === "Passwort" ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedPassword.url && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Webseite</div>
                      <div className="flex items-center justify-between">
                        <a 
                          href={selectedPassword.url.startsWith("http") ? selectedPassword.url : `https://${selectedPassword.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate flex-1"
                        >
                          {selectedPassword.url}
                        </a>
                        <button
                          onClick={() => handleCopy(selectedPassword.url!, "URL")}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors ml-2"
                          data-testid="btn-copy-url"
                        >
                          {copiedField === "URL" ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Kategorie</div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const catInfo = getCategoryInfo(selectedPassword.category);
                        return (
                          <span className={cn("px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", catInfo.color)} data-testid="detail-category-badge">
                            <catInfo.icon className="w-4 h-4" />
                            {catInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {selectedPassword.notes && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notizen</div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPassword.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Key className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Passwörter</h3>
                  <span className="text-xs text-gray-500">{passwords.length} Einträge</span>
                </div>
              </div>
              <button
                onClick={handleOpenAddDialog}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                data-testid="btn-add-password"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                  data-testid="input-search-passwords"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-7 text-xs flex-1" data-testid="select-category-filter">
                    <SelectValue placeholder="Kategorie filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-3 h-3" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredPasswords.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <Lock className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">{passwords.length === 0 ? "Noch keine Passwörter" : "Keine Treffer"}</p>
                  {passwords.length === 0 && (
                    <button
                      onClick={handleOpenAddDialog}
                      className="mt-2 text-sm text-purple-600 hover:underline"
                      data-testid="btn-add-first-password"
                    >
                      Erstes Passwort hinzufügen
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {groupedPasswords.map((group) => (
                    <div key={group.category}>
                      <div className="flex items-center gap-2 px-2 py-1.5 sticky top-0 bg-white/95 backdrop-blur-sm">
                        <group.info.icon className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {group.info.label}
                        </span>
                        <span className="text-xs text-gray-400">({group.passwords.length})</span>
                      </div>
                      <div className="space-y-1">
                        {group.passwords.map((password) => {
                          const catInfo = getCategoryInfo(password.category);
                          return (
                            <button
                              key={password.id}
                              onClick={() => handleSelectPassword(password)}
                              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                              data-testid={`password-${password.id}`}
                            >
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", catInfo.color.split(" ")[0])}>
                                {password.url ? (
                                  <Globe className={cn("w-4 h-4", catInfo.color.split(" ")[1])} />
                                ) : (
                                  <catInfo.icon className={cn("w-4 h-4", catInfo.color.split(" ")[1])} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-900 truncate">{password.name}</div>
                                {password.username && (
                                  <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {password.username}
                                  </div>
                                )}
                              </div>
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0", catInfo.color)} data-testid={`badge-category-${password.id}`}>
                                {catInfo.label}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md" onMouseDown={stopPropagation} onTouchStart={stopPropagation} onPointerDown={stopPropagation}>
          <DialogHeader>
            <DialogTitle>Neues Passwort</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
            <Input
              placeholder="Name (z.B. Google, Netflix)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoComplete="off"
              data-testid="input-password-name"
            />
            <Input
              placeholder="Benutzername / E-Mail"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              autoComplete="off"
              data-testid="input-password-username"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Passwort"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-20"
                autoComplete="new-password"
                data-testid="input-password-password"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Passwort generieren"
                  data-testid="btn-generate-password"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <Input
              placeholder="URL (optional)"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              autoComplete="off"
              data-testid="input-password-url"
            />
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Kategorie</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger data-testid="select-password-category">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Notizen (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              autoComplete="off"
              data-testid="input-password-notes"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} data-testid="btn-cancel-add">
              Abbrechen
            </Button>
            <Button 
              onClick={handleAddPassword} 
              disabled={createPassword.isPending || !formData.name.trim() || !formData.password.trim()} 
              data-testid="btn-confirm-add"
            >
              {createPassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
