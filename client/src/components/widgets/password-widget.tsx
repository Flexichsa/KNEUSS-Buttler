import { useState, useMemo } from "react";
import { Key, Plus, Search, Eye, EyeOff, Copy, Pencil, Trash2, Globe, User, ChevronRight, ChevronLeft, Loader2, Lock, RefreshCw, Check, Tag, Filter, CreditCard, Mail, Briefcase, Gamepad2, ShoppingBag, Wallet, Heart, Plane, Settings2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePasswords, useCreatePassword, useUpdatePassword, useDeletePassword, decryptPassword, usePasswordCategories, useCreatePasswordCategory, useUpdatePasswordCategory, useDeletePasswordCategory, PasswordCategory } from "@/hooks/use-passwords";
import { useToast } from "@/hooks/use-toast";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "key": Key,
  "user": User,
  "mail": Mail,
  "wallet": Wallet,
  "shopping-bag": ShoppingBag,
  "briefcase": Briefcase,
  "gamepad-2": Gamepad2,
  "heart": Heart,
  "plane": Plane,
  "tag": Tag,
  "globe": Globe,
  "lock": Lock,
  "credit-card": CreditCard,
};

const COLOR_MAP: Record<string, string> = {
  "gray": "bg-gray-100 text-gray-700",
  "blue": "bg-blue-100 text-blue-700",
  "red": "bg-red-100 text-red-700",
  "green": "bg-green-100 text-green-700",
  "orange": "bg-orange-100 text-orange-700",
  "purple": "bg-purple-100 text-purple-700",
  "indigo": "bg-indigo-100 text-indigo-700",
  "pink": "bg-pink-100 text-pink-700",
  "cyan": "bg-cyan-100 text-cyan-700",
  "yellow": "bg-yellow-100 text-yellow-700",
};

const COLOR_OPTIONS = ["gray", "blue", "red", "green", "orange", "purple", "indigo", "pink", "cyan", "yellow"];
const ICON_OPTIONS = ["key", "user", "mail", "wallet", "shopping-bag", "briefcase", "gamepad-2", "heart", "plane", "tag", "globe", "lock", "credit-card"];

const DEFAULT_CATEGORY = {
  name: "Allgemein",
  color: "gray",
  icon: "key",
};

// Legacy category mapping for backwards compatibility
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "general": "Allgemein",
  "social": "Social Media",
  "email": "E-Mail",
  "finance": "Finanzen",
  "shopping": "Shopping",
  "work": "Arbeit",
  "gaming": "Gaming",
  "streaming": "Streaming",
  "travel": "Reisen",
  "other": "Sonstiges",
};

interface CategoryInfo {
  name: string;
  color: string;
  icon: LucideIcon;
}

const getCategoryInfo = (categoryName: string | null, categories: PasswordCategory[]): CategoryInfo => {
  // First try direct match
  let category = categories.find(c => c.name === categoryName);
  
  // If not found, try legacy mapping
  if (!category && categoryName && LEGACY_CATEGORY_MAP[categoryName]) {
    const mappedName = LEGACY_CATEGORY_MAP[categoryName];
    category = categories.find(c => c.name === mappedName);
  }
  
  if (category) {
    return {
      name: category.name,
      color: COLOR_MAP[category.color] || COLOR_MAP.gray,
      icon: ICON_MAP[category.icon] || Key,
    };
  }
  
  // Return the original name if it exists, otherwise default
  return {
    name: categoryName || DEFAULT_CATEGORY.name,
    color: COLOR_MAP.gray,
    icon: Key,
  };
};

// Map legacy category name to current category name
const normalizeCategoryName = (categoryName: string | null, categories: PasswordCategory[]): string => {
  if (!categoryName) return DEFAULT_CATEGORY.name;
  
  // Check if it's a known legacy code
  if (LEGACY_CATEGORY_MAP[categoryName]) {
    const mappedName = LEGACY_CATEGORY_MAP[categoryName];
    // Only return mapped name if that category exists
    if (categories.find(c => c.name === mappedName)) {
      return mappedName;
    }
  }
  
  // If category exists in current categories, use it
  if (categories.find(c => c.name === categoryName)) {
    return categoryName;
  }
  
  // Return original name (will be shown as unknown category)
  return categoryName;
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
  const { data: categories = [], isLoading: categoriesLoading } = usePasswordCategories();
  const createPassword = useCreatePassword();
  const updatePassword = useUpdatePassword();
  const deletePasswordMutation = useDeletePassword();
  const createCategory = useCreatePasswordCategory();
  const updateCategory = useUpdatePasswordCategory();
  const deleteCategory = useDeletePasswordCategory();
  const { toast } = useToast();

  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
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
    category: ""
  });

  const [editingCategory, setEditingCategory] = useState<PasswordCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    color: "gray",
    icon: "key"
  });

  const defaultCategory = useMemo(() => {
    return categories.find(c => c.isDefault) || categories[0];
  }, [categories]);

  const filteredPasswords = useMemo(() => {
    let result = passwords;
    
    if (categoryFilter !== "all") {
      result = result.filter(p => (p.category || defaultCategory?.name || "Allgemein") === categoryFilter);
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
  }, [passwords, searchQuery, categoryFilter, defaultCategory]);

  const groupedPasswords = useMemo(() => {
    const groups: Record<string, Password[]> = {};
    
    filteredPasswords.forEach(password => {
      // Normalize category name with legacy mapping
      const categoryName = normalizeCategoryName(password.category, categories);
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(password);
    });
    
    // Start with known categories in their sort order
    const knownCategoryNames = categories.map(c => c.name);
    const sortedKnownCategories = knownCategoryNames.filter(cat => groups[cat]);
    
    // Find any unknown categories (passwords with categories not in the list)
    const allGroupNames = Object.keys(groups);
    const unknownCategories = allGroupNames.filter(cat => !knownCategoryNames.includes(cat));
    
    // Combine: known categories first, then unknown
    const allCategories = [...sortedKnownCategories, ...unknownCategories];
    
    return allCategories.map(cat => ({
      category: cat,
      info: getCategoryInfo(cat, categories),
      passwords: groups[cat]
    }));
  }, [filteredPasswords, categories]);

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
    setFormData({ 
      name: "", 
      username: "", 
      password: "", 
      url: "", 
      notes: "", 
      category: defaultCategory?.name || "" 
    });
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
      category: formData.category || defaultCategory?.name,
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
      category: formData.category || defaultCategory?.name,
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
        category: selectedPassword.category || defaultCategory?.name || ""
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

  const handleOpenCategoryDialog = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: "", color: "gray", icon: "key" });
    setShowCategoryDialog(true);
  };

  const handleEditCategory = (category: PasswordCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      color: category.color,
      icon: category.icon
    });
  };

  const handleSaveCategory = () => {
    if (!categoryFormData.name.trim()) return;

    if (editingCategory) {
      updateCategory.mutate({
        id: editingCategory.id,
        name: categoryFormData.name,
        color: categoryFormData.color,
        icon: categoryFormData.icon
      }, {
        onSuccess: () => {
          setEditingCategory(null);
          setCategoryFormData({ name: "", color: "gray", icon: "key" });
          toast({ title: "Aktualisiert", description: "Kategorie wurde aktualisiert." });
        },
        onError: (error: any) => {
          toast({ title: "Fehler", description: error?.message || "Kategorie konnte nicht aktualisiert werden.", variant: "destructive" });
        }
      });
    } else {
      createCategory.mutate({
        name: categoryFormData.name,
        color: categoryFormData.color,
        icon: categoryFormData.icon
      }, {
        onSuccess: () => {
          setCategoryFormData({ name: "", color: "gray", icon: "key" });
          toast({ title: "Erstellt", description: "Kategorie wurde erstellt." });
        },
        onError: (error: any) => {
          toast({ title: "Fehler", description: error?.message || "Kategorie konnte nicht erstellt werden.", variant: "destructive" });
        }
      });
    }
  };

  const handleDeleteCategory = (id: number) => {
    const category = categories.find(c => c.id === id);
    if (category?.isDefault) {
      toast({ title: "Nicht möglich", description: "Die Standardkategorie kann nicht gelöscht werden.", variant: "destructive" });
      return;
    }
    if (confirm("Kategorie wirklich löschen?")) {
      deleteCategory.mutate(id, {
        onSuccess: () => {
          toast({ title: "Gelöscht", description: "Kategorie wurde entfernt." });
        },
        onError: (error: any) => {
          toast({ title: "Fehler", description: error?.message || "Kategorie konnte nicht gelöscht werden.", variant: "destructive" });
        }
      });
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: "", color: "gray", icon: "key" });
  };

  if (isLoading || categoriesLoading) {
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
                        {categories.map(cat => {
                          const IconComponent = ICON_MAP[cat.icon] || Key;
                          return (
                            <SelectItem key={cat.id} value={cat.name}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4" />
                                {cat.name}
                              </div>
                            </SelectItem>
                          );
                        })}
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
                        const catInfo = getCategoryInfo(selectedPassword.category, categories);
                        const IconComponent = catInfo.icon;
                        return (
                          <span className={cn("px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2", catInfo.color)} data-testid="detail-category-badge">
                            <IconComponent className="w-4 h-4" />
                            {catInfo.name}
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
              <div className="flex items-center gap-1">
                <button
                  onClick={handleOpenCategoryDialog}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="btn-manage-categories"
                  title="Kategorien verwalten"
                >
                  <Settings2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={handleOpenAddDialog}
                  className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  data-testid="btn-add-password"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
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
                    {categories.map(cat => {
                      const IconComponent = ICON_MAP[cat.icon] || Key;
                      return (
                        <SelectItem key={cat.id} value={cat.name}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-3 h-3" />
                            {cat.name}
                          </div>
                        </SelectItem>
                      );
                    })}
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
                  {groupedPasswords.map((group) => {
                    const GroupIcon = group.info.icon;
                    return (
                      <div key={group.category}>
                        <div className="flex items-center gap-2 px-2 py-1.5 sticky top-0 bg-white/95 backdrop-blur-sm">
                          <GroupIcon className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {group.info.name}
                          </span>
                          <span className="text-xs text-gray-400">({group.passwords.length})</span>
                        </div>
                        <div className="space-y-1">
                          {group.passwords.map((password) => {
                            const catInfo = getCategoryInfo(password.category, categories);
                            const CatIcon = catInfo.icon;
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
                                    <CatIcon className={cn("w-4 h-4", catInfo.color.split(" ")[1])} />
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
                                  {catInfo.name}
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
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
                  {categories.map(cat => {
                    const IconComponent = ICON_MAP[cat.icon] || Key;
                    return (
                      <SelectItem key={cat.id} value={cat.name}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    );
                  })}
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

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-lg" onMouseDown={stopPropagation} onTouchStart={stopPropagation} onPointerDown={stopPropagation}>
          <DialogHeader>
            <DialogTitle>Kategorien verwalten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
            <div className="space-y-2">
              {categories.map(cat => {
                const IconComponent = ICON_MAP[cat.icon] || Key;
                const isEditing = editingCategory?.id === cat.id;
                
                if (isEditing) {
                  return (
                    <div key={cat.id} className="p-3 border rounded-lg space-y-3 bg-gray-50">
                      <Input
                        placeholder="Kategoriename"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        data-testid={`input-edit-category-name-${cat.id}`}
                      />
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Farbe</label>
                        <div className="flex flex-wrap gap-1">
                          {COLOR_OPTIONS.map(color => (
                            <button
                              key={color}
                              onClick={() => setCategoryFormData({ ...categoryFormData, color })}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all",
                                COLOR_MAP[color].split(" ")[0],
                                categoryFormData.color === color ? "border-gray-900 scale-110" : "border-transparent"
                              )}
                              data-testid={`color-option-${color}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Icon</label>
                        <div className="flex flex-wrap gap-1">
                          {ICON_OPTIONS.map(iconKey => {
                            const Icon = ICON_MAP[iconKey];
                            return (
                              <button
                                key={iconKey}
                                onClick={() => setCategoryFormData({ ...categoryFormData, icon: iconKey })}
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                  categoryFormData.icon === iconKey ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100 text-gray-500"
                                )}
                                data-testid={`icon-option-${iconKey}`}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveCategory} disabled={updateCategory.isPending} data-testid={`btn-save-category-${cat.id}`}>
                          {updateCategory.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Speichern"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEditCategory} data-testid={`btn-cancel-category-${cat.id}`}>
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={cat.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", COLOR_MAP[cat.color] || COLOR_MAP.gray)}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm">{cat.name}</span>
                      {cat.isDefault && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Standard</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditCategory(cat)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        data-testid={`btn-edit-category-${cat.id}`}
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      {!cat.isDefault && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          data-testid={`btn-delete-category-${cat.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!editingCategory && (
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-sm">Neue Kategorie</h4>
                <Input
                  placeholder="Kategoriename"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  data-testid="input-new-category-name"
                />
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Farbe</label>
                  <div className="flex flex-wrap gap-1">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        onClick={() => setCategoryFormData({ ...categoryFormData, color })}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all",
                          COLOR_MAP[color].split(" ")[0],
                          categoryFormData.color === color ? "border-gray-900 scale-110" : "border-transparent"
                        )}
                        data-testid={`new-color-option-${color}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Icon</label>
                  <div className="flex flex-wrap gap-1">
                    {ICON_OPTIONS.map(iconKey => {
                      const Icon = ICON_MAP[iconKey];
                      return (
                        <button
                          key={iconKey}
                          onClick={() => setCategoryFormData({ ...categoryFormData, icon: iconKey })}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            categoryFormData.icon === iconKey ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100 text-gray-500"
                          )}
                          data-testid={`new-icon-option-${iconKey}`}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button 
                  onClick={handleSaveCategory} 
                  disabled={createCategory.isPending || !categoryFormData.name.trim()}
                  className="w-full"
                  data-testid="btn-create-category"
                >
                  {createCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kategorie erstellen"}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)} data-testid="btn-close-category-dialog">
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
