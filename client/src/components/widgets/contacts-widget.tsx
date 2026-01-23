import { useState, useMemo, useRef } from "react";
import { Building2, User, Plus, Phone, Mail, MapPin, ChevronRight, ChevronLeft, Loader2, Pencil, Trash2, UserPlus, X, Search, Upload, Image as ImageIcon, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, useCreateContactPerson, useUpdateContactPerson, useDeleteContactPerson, useCreateContactDetail, useDeleteContactDetail } from "@/hooks/use-contacts";

interface ContactDetail {
  id: number;
  contactId: number | null;
  contactPersonId: number | null;
  type: string;
  label: string | null;
  value: string;
}

interface ContactPerson {
  id: number;
  contactId: number;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  details: ContactDetail[];
}

interface Contact {
  id: number;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  logoUrl: string | null;
  persons: ContactPerson[];
  details: ContactDetail[];
}

export function ContactsWidget() {
  const { data: contacts = [], isLoading } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const createContactPerson = useCreateContactPerson();
  const updateContactPerson = useUpdateContactPerson();
  const deleteContactPerson = useDeleteContactPerson();
  const createContactDetail = useCreateContactDetail();
  const deleteContactDetail = useDeleteContactDetail();

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [showEditPersonDialog, setShowEditPersonDialog] = useState(false);
  const [showAddDetailDialog, setShowAddDetailDialog] = useState(false);
  const [editingPerson, setEditingPerson] = useState<ContactPerson | null>(null);
  const [detailContext, setDetailContext] = useState<{ contactId?: number; personId?: number } | null>(null);
  const [detailFormData, setDetailFormData] = useState({ type: "phone", label: "", value: "" });
  const [contactType, setContactType] = useState<"company" | "person">("company");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", notes: "", logoUrl: "" });
  const [personFormData, setPersonFormData] = useState({ name: "", role: "", email: "", phone: "" });
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const editLogoInputRef = useRef<HTMLInputElement>(null);

  const sortedAndFilteredContacts = useMemo(() => {
    let filtered = [...contacts];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query)
      );
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [contacts, searchQuery]);

  const companies = sortedAndFilteredContacts.filter(c => c.type === "company");
  const persons = sortedAndFilteredContacts.filter(c => c.type === "person");

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setFormData(prev => ({ ...prev, logoUrl: url }));
    } catch (err) {
      console.error('Logo upload failed:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddContact = () => {
    if (!formData.name.trim()) return;
    createContact.mutate({
      type: contactType,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
      logoUrl: formData.logoUrl || undefined,
    }, {
      onSuccess: () => {
        setShowAddDialog(false);
        setFormData({ name: "", email: "", phone: "", address: "", notes: "", logoUrl: "" });
      }
    });
  };

  const handleUpdateContact = () => {
    if (!selectedContact || !formData.name.trim()) return;
    updateContact.mutate({
      id: selectedContact.id,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
      logoUrl: formData.logoUrl || undefined,
    }, {
      onSuccess: (updatedContact) => {
        setEditMode(false);
        setSelectedContact(updatedContact);
      }
    });
  };

  const handleDeleteContact = (id: number) => {
    if (confirm("Kontakt wirklich löschen?")) {
      deleteContact.mutate(id, {
        onSuccess: () => setSelectedContact(null)
      });
    }
  };

  const handleAddPerson = () => {
    if (!selectedContact || !personFormData.name.trim()) return;
    createContactPerson.mutate({
      contactId: selectedContact.id,
      name: personFormData.name,
      role: personFormData.role || undefined,
      email: personFormData.email || undefined,
      phone: personFormData.phone || undefined,
    }, {
      onSuccess: () => {
        setShowAddPersonDialog(false);
        setPersonFormData({ name: "", role: "", email: "", phone: "" });
      }
    });
  };

  const handleDeletePerson = (personId: number) => {
    if (confirm("Ansprechpartner wirklich löschen?")) {
      deleteContactPerson.mutate(personId);
    }
  };

  const openEditPersonDialog = (person: ContactPerson) => {
    setEditingPerson(person);
    setPersonFormData({
      name: person.name,
      role: person.role || "",
      email: person.email || "",
      phone: person.phone || "",
    });
    setShowEditPersonDialog(true);
  };

  const handleUpdatePerson = () => {
    if (!editingPerson || !personFormData.name.trim()) return;
    updateContactPerson.mutate({
      id: editingPerson.id,
      name: personFormData.name,
      role: personFormData.role || undefined,
      email: personFormData.email || undefined,
      phone: personFormData.phone || undefined,
    }, {
      onSuccess: () => {
        setShowEditPersonDialog(false);
        setEditingPerson(null);
        setPersonFormData({ name: "", role: "", email: "", phone: "" });
      }
    });
  };

  const openEditMode = () => {
    if (selectedContact) {
      setFormData({
        name: selectedContact.name,
        email: selectedContact.email || "",
        phone: selectedContact.phone || "",
        address: selectedContact.address || "",
        notes: selectedContact.notes || "",
        logoUrl: selectedContact.logoUrl || "",
      });
      setEditMode(true);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-2xl overflow-hidden flex flex-col" data-testid="contacts-widget">
      <AnimatePresence mode="wait">
        {selectedContact ? (
          <motion.div
            key="detail"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <button
                onClick={() => { setSelectedContact(null); setEditMode(false); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="btn-back-contacts"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              {selectedContact.logoUrl && selectedContact.type === "company" && (
                <img 
                  src={selectedContact.logoUrl} 
                  alt={selectedContact.name} 
                  className="w-10 h-10 rounded-lg object-contain bg-gray-50 border border-gray-200 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{selectedContact.name}</h3>
                <span className="text-xs text-gray-500">{selectedContact.type === "company" ? "Firma" : "Person"}</span>
              </div>
              <button
                onClick={openEditMode}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="btn-edit-contact"
              >
                <Pencil className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDeleteContact(selectedContact.id)}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                data-testid="btn-delete-contact"
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
                    data-testid="input-edit-name"
                  />
                  <Input
                    placeholder="E-Mail"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="input-edit-email"
                  />
                  <PhoneInput
                    placeholder="Telefon"
                    value={formData.phone}
                    onChange={(phone) => setFormData({ ...formData, phone })}
                    data-testid="input-edit-phone"
                  />
                  <Input
                    placeholder="Adresse"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    data-testid="input-edit-address"
                  />
                  {selectedContact.type === "company" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Firmenlogo</label>
                      <div className="flex items-center gap-3">
                        {formData.logoUrl ? (
                          <div className="relative">
                            <img 
                              src={formData.logoUrl} 
                              alt="Logo" 
                              className="w-12 h-12 rounded-lg object-contain bg-gray-50 border border-gray-200"
                            />
                            <button
                              onClick={() => setFormData({ ...formData, logoUrl: "" })}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              type="button"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <input
                          type="file"
                          ref={editLogoInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoUpload(e, true)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => editLogoInputRef.current?.click()}
                          disabled={uploadingLogo}
                          data-testid="btn-edit-upload-logo"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {formData.logoUrl ? "Ändern" : "Hochladen"}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateContact} disabled={updateContact.isPending} className="flex-1" data-testid="btn-save-contact">
                      {updateContact.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)} data-testid="btn-cancel-edit">
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Kontaktdaten</div>
                      <button
                        onClick={() => {
                          setDetailContext({ contactId: selectedContact.id });
                          setDetailFormData({ type: "phone", label: "", value: "" });
                          setShowAddDetailDialog(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        data-testid="btn-add-contact-detail"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Hinzufügen
                      </button>
                    </div>
                    {selectedContact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${selectedContact.email}`} className="text-blue-600 hover:underline">{selectedContact.email}</a>
                        <span className="text-gray-400 text-xs">(Haupt)</span>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${selectedContact.phone}`} className="text-blue-600 hover:underline">{selectedContact.phone}</a>
                        <span className="text-gray-400 text-xs">(Haupt)</span>
                      </div>
                    )}
                    {selectedContact.details?.filter(d => d.type === "email").map(detail => (
                      <div key={detail.id} className="flex items-center gap-2 text-sm group">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${detail.value}`} className="text-blue-600 hover:underline">{detail.value}</a>
                        {detail.label && <span className="text-gray-400 text-xs">({detail.label})</span>}
                        <button 
                          onClick={() => deleteContactDetail.mutate(detail.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded"
                          data-testid={`btn-delete-detail-${detail.id}`}
                        >
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    ))}
                    {selectedContact.details?.filter(d => d.type === "phone").map(detail => (
                      <div key={detail.id} className="flex items-center gap-2 text-sm group">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${detail.value}`} className="text-blue-600 hover:underline">{detail.value}</a>
                        {detail.label && <span className="text-gray-400 text-xs">({detail.label})</span>}
                        <button 
                          onClick={() => deleteContactDetail.mutate(detail.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded"
                          data-testid={`btn-delete-detail-${detail.id}`}
                        >
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    ))}
                    {selectedContact.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{selectedContact.address}</span>
                      </div>
                    )}
                    {!selectedContact.email && !selectedContact.phone && !selectedContact.address && (!selectedContact.details || selectedContact.details.length === 0) && (
                      <div className="text-sm text-gray-400">Keine Kontaktdaten</div>
                    )}
                  </div>

                  {selectedContact.type === "company" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ansprechpartner</div>
                        <button
                          onClick={() => setShowAddPersonDialog(true)}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          data-testid="btn-add-person"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Hinzufügen
                        </button>
                      </div>
                      {(!selectedContact.persons || selectedContact.persons.length === 0) ? (
                        <div className="text-sm text-gray-400 py-2">Keine Ansprechpartner</div>
                      ) : (
                        <div className="space-y-2">
                          {selectedContact.persons.map((person) => (
                            <div key={person.id} className="bg-gray-50 rounded-lg p-2.5 group" data-testid={`person-${person.id}`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-sm text-gray-900">{person.name}</div>
                                  {person.role && <div className="text-xs text-gray-500">{person.role}</div>}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEditPersonDialog(person)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                    data-testid={`btn-edit-person-${person.id}`}
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePerson(person.id)}
                                    className="p-1 hover:bg-red-50 rounded"
                                    data-testid={`btn-delete-person-${person.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </button>
                                </div>
                              </div>
                              <div className="mt-1 space-y-0.5">
                                {person.email && (
                                  <div className="text-xs flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    <a href={`mailto:${person.email}`} className="text-blue-600 hover:underline">{person.email}</a>
                                    <span className="text-gray-400">(Haupt)</span>
                                  </div>
                                )}
                                {person.details?.filter(d => d.type === "email").map(detail => (
                                  <div key={detail.id} className="text-xs flex items-center gap-1 group/detail">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    <a href={`mailto:${detail.value}`} className="text-blue-600 hover:underline">{detail.value}</a>
                                    {detail.label && <span className="text-gray-400">({detail.label})</span>}
                                    <button 
                                      onClick={() => deleteContactDetail.mutate(detail.id)}
                                      className="opacity-0 group-hover/detail:opacity-100 p-0.5"
                                      data-testid={`btn-delete-person-email-${detail.id}`}
                                    >
                                      <X className="w-2.5 h-2.5 text-red-500" />
                                    </button>
                                  </div>
                                ))}
                                {person.phone && (
                                  <div className="text-xs flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-gray-400" />
                                    <a href={`tel:${person.phone}`} className="text-blue-600 hover:underline">{person.phone}</a>
                                    <span className="text-gray-400">(Haupt)</span>
                                  </div>
                                )}
                                {person.details?.filter(d => d.type === "phone").map(detail => (
                                  <div key={detail.id} className="text-xs flex items-center gap-1 group/detail">
                                    <Phone className="w-3 h-3 text-gray-400" />
                                    <a href={`tel:${detail.value}`} className="text-blue-600 hover:underline">{detail.value}</a>
                                    {detail.label && <span className="text-gray-400">({detail.label})</span>}
                                    <button 
                                      onClick={() => deleteContactDetail.mutate(detail.id)}
                                      className="opacity-0 group-hover/detail:opacity-100 p-0.5"
                                      data-testid={`btn-delete-person-phone-${detail.id}`}
                                    >
                                      <X className="w-2.5 h-2.5 text-red-500" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    setDetailContext({ contactId: selectedContact.id, personId: person.id });
                                    setDetailFormData({ type: "phone", label: "", value: "" });
                                    setShowAddDetailDialog(true);
                                  }}
                                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5 mt-1"
                                  data-testid={`btn-add-person-detail-${person.id}`}
                                >
                                  <PlusCircle className="w-3 h-3" />
                                  Kontaktdaten
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
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
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Kontakte</h3>
                  <span className="text-xs text-gray-500">{contacts.length} Einträge</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddDialog(true)}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                data-testid="btn-add-contact"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="px-3 py-2 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  data-testid="input-search-contacts"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <Building2 className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Noch keine Kontakte</p>
                  <button
                    onClick={() => setShowAddDialog(true)}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                    data-testid="btn-add-first-contact"
                  >
                    Ersten Kontakt hinzufügen
                  </button>
                </div>
              ) : sortedAndFilteredContacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <Search className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">Keine Kontakte gefunden</p>
                  <p className="text-xs mt-1">Versuche einen anderen Suchbegriff</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {companies.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Firmen</div>
                      {companies.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                          data-testid={`contact-${contact.id}`}
                        >
                          {contact.logoUrl ? (
                            <img 
                              src={contact.logoUrl} 
                              alt={contact.name} 
                              className="w-8 h-8 rounded-lg object-contain bg-gray-50 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{contact.name}</div>
                            {contact.phone && <div className="text-xs text-gray-500 truncate">{contact.phone}</div>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>
                      ))}
                    </>
                  )}
                  {persons.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider mt-2">Personen</div>
                      {persons.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                          data-testid={`contact-${contact.id}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{contact.name}</div>
                            {contact.email && <div className="text-xs text-gray-500 truncate">{contact.email}</div>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neuer Kontakt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setContactType("company")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2",
                  contactType === "company" ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
                data-testid="btn-type-company"
              >
                <Building2 className="w-4 h-4" />
                Firma
              </button>
              <button
                onClick={() => setContactType("person")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2",
                  contactType === "person" ? "bg-green-50 border-green-200 text-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
                data-testid="btn-type-person"
              >
                <User className="w-4 h-4" />
                Person
              </button>
            </div>
            <Input
              placeholder={contactType === "company" ? "Firmenname" : "Name"}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              data-testid="input-contact-name"
            />
            <Input
              placeholder="E-Mail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="input-contact-email"
            />
            <PhoneInput
              placeholder="Telefon"
              value={formData.phone}
              onChange={(phone) => setFormData({ ...formData, phone })}
              data-testid="input-contact-phone"
            />
            <Input
              placeholder="Adresse"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              data-testid="input-contact-address"
            />
            {contactType === "company" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Firmenlogo</label>
                <div className="flex items-center gap-3">
                  {formData.logoUrl ? (
                    <div className="relative">
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo Vorschau" 
                        className="w-12 h-12 rounded-lg object-contain bg-gray-50 border border-gray-200"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, logoUrl: "" })}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    data-testid="btn-upload-logo"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Logo hochladen
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} data-testid="btn-cancel-add">
              Abbrechen
            </Button>
            <Button onClick={handleAddContact} disabled={createContact.isPending || !formData.name.trim()} data-testid="btn-confirm-add">
              {createContact.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPersonDialog} onOpenChange={setShowAddPersonDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ansprechpartner hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Name"
              value={personFormData.name}
              onChange={(e) => setPersonFormData({ ...personFormData, name: e.target.value })}
              data-testid="input-person-name"
            />
            <Input
              placeholder="Rolle (z.B. System Engineer)"
              value={personFormData.role}
              onChange={(e) => setPersonFormData({ ...personFormData, role: e.target.value })}
              data-testid="input-person-role"
            />
            <Input
              placeholder="E-Mail"
              type="email"
              value={personFormData.email}
              onChange={(e) => setPersonFormData({ ...personFormData, email: e.target.value })}
              data-testid="input-person-email"
            />
            <PhoneInput
              placeholder="Telefon"
              value={personFormData.phone}
              onChange={(phone) => setPersonFormData({ ...personFormData, phone })}
              data-testid="input-person-phone"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPersonDialog(false)} data-testid="btn-cancel-add-person">
              Abbrechen
            </Button>
            <Button onClick={handleAddPerson} disabled={createContactPerson.isPending || !personFormData.name.trim()} data-testid="btn-confirm-add-person">
              {createContactPerson.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditPersonDialog} onOpenChange={setShowEditPersonDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ansprechpartner bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Name"
              value={personFormData.name}
              onChange={(e) => setPersonFormData({ ...personFormData, name: e.target.value })}
              data-testid="input-edit-person-name"
            />
            <Input
              placeholder="Rolle (z.B. Geschäftsführer)"
              value={personFormData.role}
              onChange={(e) => setPersonFormData({ ...personFormData, role: e.target.value })}
              data-testid="input-edit-person-role"
            />
            <Input
              placeholder="E-Mail"
              type="email"
              value={personFormData.email}
              onChange={(e) => setPersonFormData({ ...personFormData, email: e.target.value })}
              data-testid="input-edit-person-email"
            />
            <PhoneInput
              placeholder="Telefon"
              value={personFormData.phone}
              onChange={(phone) => setPersonFormData({ ...personFormData, phone })}
              data-testid="input-edit-person-phone"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditPersonDialog(false); setEditingPerson(null); }} data-testid="btn-cancel-edit-person">
              Abbrechen
            </Button>
            <Button onClick={handleUpdatePerson} disabled={updateContactPerson.isPending || !personFormData.name.trim()} data-testid="btn-confirm-edit-person">
              {updateContactPerson.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDetailDialog} onOpenChange={setShowAddDetailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kontaktdaten hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Typ</label>
              <Select value={detailFormData.type} onValueChange={(value) => setDetailFormData({ ...detailFormData, type: value })}>
                <SelectTrigger data-testid="select-detail-type">
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Telefon</SelectItem>
                  <SelectItem value="email">E-Mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Bezeichnung (z.B. Mobil, Fax, Privat)"
              value={detailFormData.label}
              onChange={(e) => setDetailFormData({ ...detailFormData, label: e.target.value })}
              data-testid="input-detail-label"
            />
            {detailFormData.type === "phone" ? (
              <PhoneInput
                placeholder="Telefonnummer"
                value={detailFormData.value}
                onChange={(phone) => setDetailFormData({ ...detailFormData, value: phone })}
                data-testid="input-detail-value"
              />
            ) : (
              <Input
                placeholder="E-Mail-Adresse"
                type="email"
                value={detailFormData.value}
                onChange={(e) => setDetailFormData({ ...detailFormData, value: e.target.value })}
                data-testid="input-detail-value"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDetailDialog(false); setDetailContext(null); }} data-testid="btn-cancel-add-detail">
              Abbrechen
            </Button>
            <Button 
              onClick={() => {
                if (detailContext && detailFormData.value.trim()) {
                  createContactDetail.mutate({
                    contactId: detailContext.contactId,
                    contactPersonId: detailContext.personId,
                    type: detailFormData.type,
                    label: detailFormData.label || undefined,
                    value: detailFormData.value.trim(),
                  }, {
                    onSuccess: () => {
                      setShowAddDetailDialog(false);
                      setDetailContext(null);
                      setDetailFormData({ type: "phone", label: "", value: "" });
                    }
                  });
                }
              }} 
              disabled={createContactDetail.isPending || !detailFormData.value.trim()} 
              data-testid="btn-confirm-add-detail"
            >
              {createContactDetail.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
