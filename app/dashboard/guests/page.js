'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  ShieldAlert,
  BookOpenCheck,
  BookOpen,
  KeyRound,
  Mail,
  Pencil,
  Trash2,
  Phone,
  Calendar,
  Home,
  MessageCircle,
  Search,
  X,
} from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ModalShell = ({ open, onClose, size = 'md', title, description, children }) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const sizeClass = size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${sizeClass} bg-white rounded-2xl shadow-2xl border border-gray-100`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Fermer la fenêtre"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="p-6 space-y-6">
          {(title || description) && (
            <div className="space-y-1">
              {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
              {description && <p className="text-sm text-gray-500">{description}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

const INITIAL_GUESTS = [
  {
    id: 'GST-001',
    firstName: 'Claire',
    lastName: 'Dubois',
    email: 'claire.dubois@email.com',
    phone: '+33 6 45 89 12 34',
    propertyName: 'Appartement Opéra',
    stayStart: '2024-08-12',
    stayEnd: '2024-08-18',
    depositStatus: 'paid',
    guidebookSent: true,
    lockboxCode: 'C7429',
    intranetMessages: 2,
    notes: 'Arrivée prévue à 19h, souhaite une bouteille de vin rouge.',
    travelers: 2,
  },
  {
    id: 'GST-002',
    firstName: 'Hugo',
    lastName: 'Martin',
    email: 'hugo.martin@email.com',
    phone: '+33 6 77 42 88 90',
    propertyName: 'Loft Belleville',
    stayStart: '2024-09-01',
    stayEnd: '2024-09-07',
    depositStatus: 'pending',
    guidebookSent: false,
    lockboxCode: 'B5931',
    intranetMessages: 0,
    notes: 'A besoin d’un lit parapluie. Dépôt en attente.',
    travelers: 3,
  },
  {
    id: 'GST-003',
    firstName: 'Sofia',
    lastName: 'Rodriguez',
    email: 'sofia.rodriguez@email.com',
    phone: '+34 612 889 742',
    propertyName: 'Villa Lumière',
    stayStart: '2024-07-22',
    stayEnd: '2024-07-29',
    depositStatus: 'paid',
    guidebookSent: true,
    lockboxCode: 'A1284',
    intranetMessages: 5,
    notes: 'Check-in autonome confirmé. Allergique aux fruits de mer.',
    travelers: 4,
  },
];

const EMPTY_FORM = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  propertyName: '',
  stayStart: '',
  stayEnd: '',
  depositStatus: 'pending',
  guidebookSent: false,
  lockboxCode: '',
  intranetMessages: 0,
  notes: '',
  travelers: 1,
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function DashboardGuestsPage() {
  const [guests, setGuests] = useState(INITIAL_GUESTS);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const total = guests.length;
    const depositPaid = guests.filter((guest) => guest.depositStatus === 'paid').length;
    const guidebookSent = guests.filter((guest) => guest.guidebookSent).length;
    const upcoming = guests.filter((guest) => new Date(guest.stayStart) >= new Date()).length;

    return { total, depositPaid, guidebookSent, upcoming };
  }, [guests]);

  const filteredGuests = useMemo(() => {
    if (!searchTerm) {
      return guests;
    }

    const lowerTerm = searchTerm.toLowerCase();
    return guests.filter((guest) =>
      [
        guest.firstName,
        guest.lastName,
        guest.email,
        guest.phone,
        guest.propertyName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(lowerTerm),
    );
  }, [guests, searchTerm]);

  const openDetails = (guest) => {
    setSelectedGuest(guest);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setSelectedGuest(null);
    setIsDetailsOpen(false);
  };

  const openForm = (guest) => {
    if (guest) {
      setFormData({ ...guest });
      setIsEditing(true);
    } else {
      setFormData({ ...EMPTY_FORM, id: `GST-${String(guests.length + 1).padStart(3, '0')}` });
      setIsEditing(false);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormData(EMPTY_FORM);
    setIsEditing(false);
  };

  const handleDelete = (guestId) => {
    const guest = guests.find((item) => item.id === guestId);
    if (!guest) {
      return;
    }

    const confirmation = window.confirm(
      `Supprimer ${guest.firstName} ${guest.lastName} de la liste des guests ?`,
    );

    if (confirmation) {
      setGuests((prev) => prev.filter((item) => item.id !== guestId));
      if (selectedGuest?.id === guestId) {
        closeDetails();
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isEditing) {
      setGuests((prev) =>
        prev.map((guest) => (guest.id === formData.id ? { ...formData } : guest)),
      );
      if (selectedGuest?.id === formData.id) {
        setSelectedGuest({ ...formData });
      }
    } else {
      const newGuest = {
        ...formData,
        id:
          formData.id || `GST-${String(guests.length + 1).padStart(3, '0')}`,
      };
      setGuests((prev) => [newGuest, ...prev]);
    }

    closeForm();
  };

  const renderDepositBadge = (guest) => {
    if (guest.depositStatus === 'paid') {
      return (
        <Badge className="bg-success-100 text-success-700 border-success-200">
          <ShieldCheck className="h-4 w-4 mr-1" /> Caution payée
        </Badge>
      );
    }

    return (
      <Badge className="bg-warning-100 text-warning-800 border-warning-200">
        <ShieldAlert className="h-4 w-4 mr-1" /> Caution en attente
      </Badge>
    );
  };

  const renderGuidebookBadge = (guest) => {
    if (guest.guidebookSent) {
      return (
        <Badge className="bg-primary-100 text-primary-700 border-primary-200">
          <BookOpenCheck className="h-4 w-4 mr-1" /> Guide envoyé
        </Badge>
      );
    }

    return (
      <Badge className="bg-gray-100 text-gray-700 border-gray-200">
        <BookOpen className="h-4 w-4 mr-1" /> Guide à envoyer
      </Badge>
    );
  };

  const stayLabel = (guest) => `${formatDate(guest.stayStart)} → ${formatDate(guest.stayEnd)}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Guests</h1>
            <p className="mt-1 text-gray-600">
              Suivez tous vos voyageurs, leurs séjours et les actions à réaliser avant leur arrivée.
            </p>
          </div>
          <button onClick={() => openForm()} className="btn-primary inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Ajouter un guest
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Guests actifs</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cautions payées</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{stats.depositPaid}</p>
              </div>
              <div className="w-10 h-10 bg-success-100 text-success-600 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Guides envoyés</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{stats.guidebookSent}</p>
              </div>
              <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center">
                <BookOpenCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Séjours à venir</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{stats.upcoming}</p>
              </div>
              <div className="w-10 h-10 bg-warning-50 text-warning-700 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Réservations en cours</h2>
              <p className="text-sm text-gray-500">
                Liste synchronisée prochainement avec vos plateformes (Airbnb, Booking...).
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher un guest"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-gray-200">
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">Guest</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">Contact</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">Location</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">Séjour</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">Statuts</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">Boîte à clés</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500 text-center">Messages</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-sm text-gray-500">
                    Aucun guest ne correspond à votre recherche pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuests.map((guest) => (
                  <TableRow
                    key={guest.id}
                    className="border-gray-200 cursor-pointer"
                    onClick={() => openDetails(guest)}
                  >
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {guest.firstName} {guest.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{guest.travelers} voyageurs</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {guest.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {guest.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-700">
                        <Home className="h-4 w-4 mr-2 text-gray-400" />
                        {guest.propertyName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {stayLabel(guest)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {renderDepositBadge(guest)}
                        {renderGuidebookBadge(guest)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-700">
                        <KeyRound className="h-4 w-4 mr-2 text-gray-400" />
                        {guest.lockboxCode}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white">
                        <Mail
                          className={`h-5 w-5 ${
                            guest.intranetMessages > 0
                              ? 'text-primary-600'
                              : 'text-gray-400'
                          }`}
                        />
                        {guest.intranetMessages > 0 && (
                          <span className="ml-1 text-xs font-medium text-primary-600">
                            {guest.intranetMessages}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end space-x-3" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openForm(guest)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(guest.id)}
                          className="text-sm text-danger-600 hover:text-danger-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ModalShell
        open={isDetailsOpen}
        onClose={closeDetails}
        title={selectedGuest ? `${selectedGuest.firstName} ${selectedGuest.lastName}` : ''}
        description="Vue détaillée du séjour et des informations partagées avec le guest."
      >
        <div className="space-y-5">
          {selectedGuest && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 p-4">
                  <p className="text-xs uppercase text-gray-400">Contact</p>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedGuest.email}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedGuest.phone}
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 p-4">
                  <p className="text-xs uppercase text-gray-400">Séjour</p>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedGuest.propertyName}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {stayLabel(selectedGuest)}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedGuest.travelers} voyageurs
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {renderDepositBadge(selectedGuest)}
                {renderGuidebookBadge(selectedGuest)}
                <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                  <KeyRound className="h-4 w-4 mr-1" /> Code {selectedGuest.lockboxCode}
                </Badge>
                <Badge className="bg-primary-50 text-primary-700 border-primary-200">
                  <MessageCircle className="h-4 w-4 mr-1" /> {selectedGuest.intranetMessages} message(s)
                </Badge>
              </div>

              {selectedGuest.notes && (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
                  <p className="text-xs uppercase text-gray-500 mb-2">Notes internes</p>
                  {selectedGuest.notes}
                </div>
              )}
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <button type="button" className="btn-secondary" onClick={closeDetails}>
              Fermer
            </button>
            {selectedGuest && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    openForm(selectedGuest);
                    setIsDetailsOpen(false);
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleDelete(selectedGuest.id)}
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={isFormOpen}
        onClose={closeForm}
        size="lg"
        title={isEditing ? 'Modifier le guest' : 'Ajouter un nouveau guest'}
        description="Renseignez les informations qui seront partagées avec vos voyageurs et vos équipes."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénom</label>
              <input
                type="text"
                value={formData.firstName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, firstName: event.target.value }))}
                  required
                  className="mt-1 form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, lastName: event.target.value }))}
                  required
                  className="mt-1 form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  required
                  className="mt-1 form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                  required
                  className="mt-1 form-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Nom de la location</label>
                <input
                  type="text"
                  value={formData.propertyName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, propertyName: event.target.value }))}
                  required
                  className="mt-1 form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Arrivée</label>
                <input
                  type="date"
                  value={formData.stayStart}
                  onChange={(event) => setFormData((prev) => ({ ...prev, stayStart: event.target.value }))}
                  required
                  className="mt-1 form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Départ</label>
                <input
                  type="date"
                  value={formData.stayEnd}
                  onChange={(event) => setFormData((prev) => ({ ...prev, stayEnd: event.target.value }))}
                  required
                  className="mt-1 form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre de voyageurs</label>
                <input
                  type="number"
                  min={1}
                  value={formData.travelers}
                  onChange={(event) => setFormData((prev) => ({ ...prev, travelers: Number(event.target.value) }))}
                  className="mt-1 form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code boîte à clés</label>
                <input
                  type="text"
                  value={formData.lockboxCode}
                  onChange={(event) => setFormData((prev) => ({ ...prev, lockboxCode: event.target.value }))}
                  className="mt-1 form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Statut de caution</label>
                <select
                  value={formData.depositStatus}
                  onChange={(event) => setFormData((prev) => ({ ...prev, depositStatus: event.target.value }))}
                  className="mt-1 form-input"
                >
                  <option value="paid">Caution payée</option>
                  <option value="pending">Caution en attente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Guide envoyé</label>
                <select
                  value={formData.guidebookSent ? 'yes' : 'no'}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, guidebookSent: event.target.value === 'yes' }))
                  }
                  className="mt-1 form-input"
                >
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Messages intranet</label>
                <input
                  type="number"
                  min={0}
                  value={formData.intranetMessages}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, intranetMessages: Number(event.target.value) }))
                  }
                  className="mt-1 form-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes internes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                className="mt-1 form-input"
                placeholder="Informations utiles pour vos équipes (arrivée tardive, demandes spéciales, etc.)"
              />
            </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" className="btn-secondary" onClick={closeForm}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Enregistrer les modifications' : 'Ajouter le guest'}
            </button>
          </div>
        </form>
      </ModalShell>
    </DashboardLayout>
  );
}
