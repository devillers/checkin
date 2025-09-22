'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Home,
  User,
  FileText,
  Clock,
  Plus,
  Minus,
  CheckCircle
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'archived', label: 'Archivé' }
];

const ROOM_TYPES = [
  { value: 'bedroom', label: 'Chambre' },
  { value: 'living_room', label: 'Salon' },
  { value: 'kitchen', label: 'Cuisine' },
  { value: 'bathroom', label: 'Salle de bain' },
  { value: 'balcony', label: 'Balcon/Terrasse' },
  { value: 'other', label: 'Autre' }
];

const formatDateTimeLocal = (value) => {
  if (!value) return '';

  try {
    const date = new Date(value);
    const tzOffset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - tzOffset * 60000);
    return localDate.toISOString().slice(0, 16);
  } catch (error) {
    console.error('Error formatting datetime for input', error);
    return '';
  }
};

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params?.id;

  const [formData, setFormData] = useState({
    propertyId: '',
    guestId: '',
    type: 'checkin',
    description: '',
    dueDate: '',
    rooms: [],
    status: 'pending'
  });
  const [properties, setProperties] = useState([]);
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    if (!inventoryId) {
      setErrors({ submit: "Identifiant d'inventaire manquant" });
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setErrors({});
        setSubmitMessage('');

        const [inventoryRes, propertiesRes, guestsRes] = await Promise.all([
          fetch(`/api/inventories/${inventoryId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/properties', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/guests', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (inventoryRes.status === 401 || propertiesRes.status === 401 || guestsRes.status === 401) {
          router.replace('/auth/login');
          return;
        }

        if (!inventoryRes.ok) {
          const errorData = await inventoryRes.json().catch(() => ({}));
          throw new Error(
            errorData?.message || "Impossible de charger l'inventaire"
          );
        }

        const [inventoryData, propertiesData, guestsData] = await Promise.all([
          inventoryRes.json(),
          propertiesRes.ok ? propertiesRes.json() : Promise.resolve([]),
          guestsRes.ok ? guestsRes.json() : Promise.resolve([])
        ]);

        setProperties(propertiesData);
        setGuests(guestsData);

        setFormData({
          propertyId: inventoryData.propertyId || '',
          guestId: inventoryData.guestId || '',
          type: inventoryData.type || 'checkin',
          description: inventoryData.description || '',
          dueDate: formatDateTimeLocal(inventoryData.dueDate),
          rooms: Array.isArray(inventoryData.rooms) ? inventoryData.rooms : [],
          status: inventoryData.status || 'pending'
        });
      } catch (error) {
        console.error('Error loading inventory data', error);
        setErrors({ submit: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [inventoryId, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const addRoom = () => {
    const newRoom = {
      id: Date.now().toString(),
      name: '',
      type: 'bedroom',
      items: []
    };

    setFormData((prev) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom]
    }));
  };

  const removeRoom = (roomId) => {
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((room) => room.id !== roomId)
    }));
  };

  const updateRoom = (roomId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId ? { ...room, [field]: value } : room
      )
    }));
  };

  const addItemToRoom = (roomId) => {
    const newItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      condition: 5,
      photos: [],
      comments: ''
    };

    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId
          ? { ...room, items: [...(room.items || []), newItem] }
          : room
      )
    }));
  };

  const removeItemFromRoom = (roomId, itemId) => {
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              items: (room.items || []).filter((item) => item.id !== itemId)
            }
          : room
      )
    }));
  };

  const updateRoomItem = (roomId, itemId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              items: (room.items || []).map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
              )
            }
          : room
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.propertyId) {
      newErrors.propertyId = 'Propriété requise';
    }

    if (!formData.type) {
      newErrors.type = 'Type requis';
    }

    if (!formData.status) {
      newErrors.status = 'Statut requis';
    }

    if (!formData.rooms || formData.rooms.length === 0) {
      newErrors.rooms = 'Au moins une pièce est requise';
    }

    formData.rooms.forEach((room, index) => {
      if (!room.name?.trim()) {
        newErrors[`room_${index}_name`] = 'Nom de pièce requis';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const token = localStorage.getItem('auth-token');

      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`/api/inventories/${inventoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null
        })
      });

      if (response.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Erreur lors de la mise à jour');
      }

      setSubmitMessage('Inventaire mis à jour avec succès');
      router.push(`/inventory/${inventoryId}`);
    } catch (error) {
      console.error('Error updating inventory', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Modifier l&apos;inventaire
              </h1>
            <p className="text-gray-600">
              Mettez à jour les informations et pièces de cet inventaire
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="card flex items-center justify-center h-64">
            <div className="loading-spinner" aria-label="Chargement" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {errors.submit && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <p className="text-danger-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {submitMessage && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4 flex items-center text-success-700 text-sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                {submitMessage}
              </div>
            )}

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Informations générales
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="propertyId" className="form-label">
                    <Home className="h-4 w-4 inline mr-2" />
                    Propriété *
                  </label>
                  <select
                    id="propertyId"
                    name="propertyId"
                    className={`form-input ${errors.propertyId ? 'border-danger-500' : ''}`}
                    value={formData.propertyId}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Sélectionnez une propriété</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                  {errors.propertyId && (
                    <p className="mt-1 text-sm text-danger-600">{errors.propertyId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="guestId" className="form-label">
                    <User className="h-4 w-4 inline mr-2" />
                    Guest (optionnel)
                  </label>
                  <select
                    id="guestId"
                    name="guestId"
                    className="form-input"
                    value={formData.guestId}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="">Aucun guest sélectionné</option>
                    {guests.map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.firstName} {guest.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="type" className="form-label">
                    <FileText className="h-4 w-4 inline mr-2" />
                    Type d&apos;inventaire *
                  </label>
                  <select
                    id="type"
                    name="type"
                    className={`form-input ${errors.type ? 'border-danger-500' : ''}`}
                    value={formData.type}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  >
                      <option value="checkin">État d&apos;entrée</option>
                    <option value="checkout">État de sortie</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-danger-600">{errors.type}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="form-label">
                    Statut *
                  </label>
                  <select
                    id="status"
                    name="status"
                    className={`form-input ${errors.status ? 'border-danger-500' : ''}`}
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-danger-600">{errors.status}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dueDate" className="form-label">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Échéance (optionnel)
                  </label>
                  <input
                    id="dueDate"
                    name="dueDate"
                    type="datetime-local"
                    className="form-input"
                    value={formData.dueDate}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="form-input"
                  placeholder="Description ou notes sur cet inventaire..."
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pièces de l&apos;inventaire
                </h2>
                <button
                  type="button"
                  onClick={addRoom}
                  className="btn-primary flex items-center text-sm"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une pièce
                </button>
              </div>

              {errors.rooms && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
                  <p className="text-danger-700 text-sm">{errors.rooms}</p>
                </div>
              )}

              {formData.rooms.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Home className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune pièce ajoutée
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Ajoutez les pièces pour organiser votre inventaire
                  </p>
                  <button
                    type="button"
                    onClick={addRoom}
                    className="btn-primary inline-flex items-center"
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une pièce
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.rooms.map((room, index) => (
                    <div key={room.id} className="border border-gray-100 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="form-label">Nom de la pièce *</label>
                            <input
                              type="text"
                              className={`form-input ${errors[`room_${index}_name`] ? 'border-danger-500' : ''}`}
                              value={room.name}
                              onChange={(e) =>
                                updateRoom(room.id, 'name', e.target.value)
                              }
                              disabled={isSubmitting}
                            />
                            {errors[`room_${index}_name`] && (
                              <p className="mt-1 text-sm text-danger-600">
                                {errors[`room_${index}_name`]}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="form-label">Type de pièce</label>
                            <select
                              className="form-input"
                              value={room.type || 'other'}
                              onChange={(e) =>
                                updateRoom(room.id, 'type', e.target.value)
                              }
                              disabled={isSubmitting}
                            >
                              {ROOM_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRoom(room.id)}
                          className="ml-4 p-2 text-danger-600 hover:bg-danger-50 rounded-lg"
                          disabled={isSubmitting}
                          aria-label="Supprimer la pièce"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium text-gray-900">
                            Éléments de la pièce
                          </h4>
                          <button
                            type="button"
                            onClick={() => addItemToRoom(room.id)}
                            className="btn-secondary text-sm"
                            disabled={isSubmitting}
                          >
                            Ajouter un élément
                          </button>
                        </div>

                        {(room.items || []).length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Aucun élément ajouté pour cette pièce.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {room.items.map((item) => (
                              <div
                                key={item.id}
                                className="bg-gray-50 rounded-lg p-4 space-y-3"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="form-label">Nom</label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={item.name}
                                      onChange={(e) =>
                                        updateRoomItem(
                                          room.id,
                                          item.id,
                                          'name',
                                          e.target.value
                                        )
                                      }
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                  <div>
                                    <label className="form-label">
                                      Condition (1 à 5)
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={5}
                                      className="form-input"
                                      value={item.condition ?? 5}
                                      onChange={(e) =>
                                        updateRoomItem(
                                          room.id,
                                          item.id,
                                          'condition',
                                          Number(e.target.value)
                                        )
                                      }
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="form-label">
                                      Description
                                    </label>
                                    <textarea
                                      className="form-input"
                                      rows={2}
                                      value={item.description}
                                      onChange={(e) =>
                                        updateRoomItem(
                                          room.id,
                                          item.id,
                                          'description',
                                          e.target.value
                                        )
                                      }
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                  <div>
                                    <label className="form-label">
                                      Commentaires
                                    </label>
                                    <textarea
                                      className="form-input"
                                      rows={2}
                                      value={item.comments}
                                      onChange={(e) =>
                                        updateRoomItem(
                                          room.id,
                                          item.id,
                                          'comments',
                                          e.target.value
                                        )
                                      }
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                </div>

                                <div className="text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItemFromRoom(room.id, item.id)
                                    }
                                    className="text-sm text-danger-600 hover:text-danger-700"
                                    disabled={isSubmitting}
                                  >
                                    Supprimer cet élément
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push(`/inventory/${inventoryId}`)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
