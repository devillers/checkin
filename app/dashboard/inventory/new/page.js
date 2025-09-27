'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Home, 
  User, 
  Calendar,
  FileText,
  Clock,
  Plus,
  Minus,
  Camera
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function NewInventoryPage() {
  const [formData, setFormData] = useState({
    propertyId: '',
    guestId: '',
    type: 'checkin',
    description: '',
    dueDate: '',
    rooms: []
  });
  const [properties, setProperties] = useState([]);
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [draggingItemId, setDraggingItemId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      
      const [propertiesRes, guestsRes] = await Promise.all([
        fetch('/api/properties', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/guests', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setProperties(propertiesData);
      }

      if (guestsRes.ok) {
        const guestsData = await guestsRes.json();
        setGuests(guestsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addRoom = () => {
    const newRoom = {
      id: Date.now().toString(),
      name: '',
      type: 'bedroom',
      items: []
    };
    
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, newRoom]
    }));
  };

  const removeRoom = (roomId) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter(room => room.id !== roomId)
    }));
  };

  const updateRoom = (roomId, field, value) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map(room =>
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
    
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map(room =>
        room.id === roomId 
          ? { ...room, items: [...room.items, newItem] }
          : room
      )
    }));
  };

  const removeItemFromRoom = (roomId, itemId) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map(room =>
        room.id === roomId 
          ? { ...room, items: room.items.filter(item => item.id !== itemId) }
          : room
      )
    }));
  };

  const updateRoomItem = (roomId, itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map(room =>
        room.id === roomId
          ? {
              ...room,
              items: room.items.map(item =>
                item.id === itemId ? { ...item, [field]: value } : item
              )
            }
          : room
      )
    }));
  };

  const handleItemPhotoUpload = (roomId, itemId, files) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;

      if (typeof result === 'string') {
        updateRoomItem(roomId, itemId, 'photos', [result]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeItemPhoto = (roomId, itemId) => {
    updateRoomItem(roomId, itemId, 'photos', []);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.propertyId) {
      newErrors.propertyId = 'Propriété requise';
    }
    if (!formData.type) {
      newErrors.type = 'Type requis';
    }
    if (formData.rooms.length === 0) {
      newErrors.rooms = 'Au moins une pièce est requise';
    }

    // Validate rooms
    formData.rooms.forEach((room, index) => {
      if (!room.name.trim()) {
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

    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/inventories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const inventory = await response.json();
        router.push(`/dashboard/inventory/${inventory.id}`);
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Erreur lors de la création' });
      }
    } catch (error) {
      console.error('Error creating inventory:', error);
      setErrors({ submit: 'Erreur de connexion au serveur' });
    } finally {
      setIsLoading(false);
    }
  };

  const roomTypes = [
    { value: 'bedroom', label: 'Chambre' },
    { value: 'living_room', label: 'Salon' },
    { value: 'kitchen', label: 'Cuisine' },
    { value: 'bathroom', label: 'Salle de bain' },
    { value: 'balcony', label: 'Balcon/Terrasse' },
    { value: 'other', label: 'Autre' }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Nouvel Inventaire
            </h1>
            <p className="text-gray-600">
              Créez un nouvel état des lieux
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {errors.submit && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <p className="text-danger-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* General Information */}
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
                  required
                  className={`form-input ${errors.propertyId ? 'border-danger-500' : ''}`}
                  value={formData.propertyId}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="">Sélectionnez une propriété</option>
                  {properties.map(property => (
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
                  disabled={isLoading}
                >
                  <option value="">Aucun guest sélectionné</option>
                  {guests.map(guest => (
                    <option key={guest.id} value={guest.id}>
                      {guest.firstName} {guest.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" className="form-label">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Type d'inventaire *
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  className={`form-input ${errors.type ? 'border-danger-500' : ''}`}
                  value={formData.type}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="checkin">État d'entrée</option>
                  <option value="checkout">État de sortie</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-danger-600">{errors.type}</p>
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
                  disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Rooms Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Pièces de l'inventaire
              </h2>
              <button
                type="button"
                onClick={addRoom}
                className="btn-primary flex items-center text-sm"
                disabled={isLoading}
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
                  Commencez par ajouter les pièces à inventorier
                </p>
                <button
                  type="button"
                  onClick={addRoom}
                  className="btn-primary inline-flex items-center"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter ma première pièce
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.rooms.map((room, index) => (
                  <div key={room.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-semibold text-gray-900">
                        Pièce {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeRoom(room.id)}
                        className="text-danger-600 hover:text-danger-700"
                        disabled={isLoading}
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="form-label">
                          Nom de la pièce *
                        </label>
                        <input
                          type="text"
                          className={`form-input ${errors[`room_${index}_name`] ? 'border-danger-500' : ''}`}
                          placeholder="Ex: Salon, Cuisine..."
                          value={room.name}
                          onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                          disabled={isLoading}
                        />
                        {errors[`room_${index}_name`] && (
                          <p className="mt-1 text-sm text-danger-600">{errors[`room_${index}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">
                          Type de pièce
                        </label>
                        <select
                          className="form-input"
                          value={room.type}
                          onChange={(e) => updateRoom(room.id, 'type', e.target.value)}
                          disabled={isLoading}
                        >
                          {roomTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Items in room */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Éléments à vérifier ({room.items.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => addItemToRoom(room.id)}
                          className="btn-secondary text-xs py-1 px-3 flex items-center"
                          disabled={isLoading}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Élément
                        </button>
                      </div>

                      {room.items.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Aucun élément ajouté pour cette pièce
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {room.items.map((item, itemIndex) => (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700">
                                  Élément {itemIndex + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeItemFromRoom(room.id, item.id)}
                                  className="text-danger-600 hover:text-danger-700"
                                  disabled={isLoading}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="flex flex-col md:flex-row md:space-x-4">
                                <div className="md:w-48 mb-4 md:mb-0">
                                  <label className="form-label block">Photo</label>
                                  <div
                                    className={`relative border-2 border-dashed rounded-lg p-4 text-center text-xs transition-colors ${
                                      draggingItemId === `${room.id}-${item.id}`
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={() =>
                                      setDraggingItemId(`${room.id}-${item.id}`)
                                    }
                                    onDragLeave={() => setDraggingItemId(null)}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      setDraggingItemId(null);
                                      handleItemPhotoUpload(
                                        room.id,
                                        item.id,
                                        e.dataTransfer.files
                                      );
                                    }}
                                  >
                                    {item.photos?.[0] ? (
                                      <div className="space-y-2">
                                        <Image
                                          src={item.photos[0]}
                                          alt={`Photo de ${item.name || 'l\'élément'}`}
                                          width={192}
                                          height={128}
                                          unoptimized
                                          className="w-full h-32 object-cover rounded-md"
                                        />
                                        <button
                                          type="button"
                                          className="text-[11px] text-danger-600 hover:text-danger-700"
                                          onClick={() => removeItemPhoto(room.id, item.id)}
                                          disabled={isLoading}
                                        >
                                          Supprimer la photo
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <Camera className="mx-auto h-6 w-6 text-gray-400" />
                                        <p className="text-[11px] text-gray-500">
                                          Glissez-déposez ou cliquez pour ajouter
                                        </p>
                                      </div>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                      onChange={(e) =>
                                        handleItemPhotoUpload(
                                          room.id,
                                          item.id,
                                          e.target.files
                                        )
                                      }
                                      disabled={isLoading}
                                    />
                                  </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      className="form-input text-sm"
                                      placeholder="Nom de l'élément"
                                      value={item.name}
                                      onChange={(e) =>
                                        updateRoomItem(
                                          room.id,
                                          item.id,
                                          'name',
                                          e.target.value
                                        )
                                      }
                                      disabled={isLoading}
                                    />
                                    <input
                                      type="text"
                                      className="form-input text-sm"
                                      placeholder="Description (optionnel)"
                                      value={item.description}
                                      onChange={(e) =>
                                        updateRoomItem(
                                          room.id,
                                          item.id,
                                          'description',
                                          e.target.value
                                        )
                                      }
                                      disabled={isLoading}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                      type="number"
                                      min={1}
                                      max={5}
                                      className="form-input text-sm"
                                      placeholder="Condition (1 à 5)"
                                      value={item.condition ?? 5}
                                      onChange={(e) =>
                                        updateRoomItem(
                                          room.id,
                                          item.id,
                                          'condition',
                                          Number(e.target.value)
                                        )
                                      }
                                      disabled={isLoading}
                                    />
                                    <textarea
                                      className="form-input text-sm"
                                      rows={2}
                                      placeholder="Commentaires"
                                      value={item.comments}
                                      onChange={(e) =>
                                        updateRoomItem(
                                          room.id,
                                          item.id,
                                          'comments',
                                          e.target.value
                                        )
                                      }
                                      disabled={isLoading}
                                    />
                                  </div>
                                </div>
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

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Création en cours...
                </div>
              ) : (
                'Créer l\'inventaire'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}