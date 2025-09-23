'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  X,
  Home,
  MapPin,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Tv,
  Waves,
  Link2,
  ImageIcon,
  Upload,
  Trash2,
  Loader2
} from 'lucide-react';

const DEFAULT_FORM_DATA = {
  name: '',
  address: '',
  description: '',
  type: 'apartment',
  maxGuests: 2,
  bedrooms: 1,
  bathrooms: 1,
  amenities: [],
  airbnbUrl: '',
  bookingUrl: '',
  profilePhoto: null,
  descriptionPhotos: []
};

const normalizePhotoValue = (photo) => {
  if (!photo) {
    return null;
  }

  if (typeof photo === 'string') {
    return { url: photo, publicId: '' };
  }

  if (typeof photo === 'object') {
    const url = typeof photo.url === 'string' ? photo.url : '';
    if (!url) {
      return null;
    }

    const normalized = {
      url,
      publicId: typeof photo.publicId === 'string' ? photo.publicId : ''
    };

    if (photo.thumbnailUrl && typeof photo.thumbnailUrl === 'string') {
      normalized.thumbnailUrl = photo.thumbnailUrl;
    }

    return normalized;
  }

  return null;
};

const normalizePhotoArray = (photos) => {
  if (!Array.isArray(photos)) {
    return [];
  }

  return photos
    .map((photo) => normalizePhotoValue(photo))
    .filter((photo) => photo && photo.url);
};

export default function PropertyModal({ property, onClose, onSave }) {
  const [formData, setFormData] = useState(() => ({ ...DEFAULT_FORM_DATA }));
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadErrors, setUploadErrors] = useState({ profilePhoto: '', descriptionPhotos: '' });
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [isUploadingDescriptionPhotos, setIsUploadingDescriptionPhotos] = useState(false);
  const [isRemovingProfilePhoto, setIsRemovingProfilePhoto] = useState(false);
  const [removingPhotoIds, setRemovingPhotoIds] = useState({});

  const availableAmenities = [
    { id: 'wifi', name: 'WiFi', icon: Wifi },
    { id: 'parking', name: 'Parking', icon: Car },
    { id: 'tv', name: 'Télévision', icon: Tv },
    { id: 'pool', name: 'Piscine', icon: Waves },
    { id: 'kitchen', name: 'Cuisine équipée', icon: Home },
    { id: 'balcony', name: 'Balcon/Terrasse', icon: Home },
    { id: 'garden', name: 'Jardin', icon: Home },
    { id: 'ac', name: 'Climatisation', icon: Home }
  ];

  const propertyTypes = [
    { value: 'apartment', label: 'Appartement' },
    { value: 'house', label: 'Maison' },
    { value: 'studio', label: 'Studio' },
    { value: 'villa', label: 'Villa' },
    { value: 'loft', label: 'Loft' },
    { value: 'room', label: 'Chambre' }
  ];

  useEffect(() => {
    if (property) {
      setFormData({
        ...DEFAULT_FORM_DATA,
        name: property.name || '',
        address: property.address || '',
        description: property.description || '',
        type: property.type || 'apartment',
        maxGuests: property.maxGuests || 2,
        bedrooms: property.bedrooms ?? 1,
        bathrooms: property.bathrooms || 1,
        amenities: property.amenities || [],
        airbnbUrl: property.airbnbUrl || '',
        bookingUrl: property.bookingUrl || '',
        profilePhoto: normalizePhotoValue(property.profilePhoto),
        descriptionPhotos: normalizePhotoArray(property.descriptionPhotos)
      });
    } else {
      setFormData({ ...DEFAULT_FORM_DATA });
    }

    setUploadErrors({ profilePhoto: '', descriptionPhotos: '' });
    setRemovingPhotoIds({});
    setIsRemovingProfilePhoto(false);
  }, [property]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const uploadImages = async (files, folder) => {
    const token = localStorage.getItem('auth-token');

    if (!token) {
      throw new Error('Authentification requise pour téléverser des images');
    }

    const uploads = [];

    for (const file of files) {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      });

      let result = null;

      try {
        result = await response.json();
      } catch (error) {
        // ignore parsing error, will handle via response.ok
      }

      if (!response.ok || !result) {
        const message = result?.message || 'Erreur lors du téléchargement de la photo';
        throw new Error(message);
      }

      uploads.push(result);
    }

    return uploads;
  };

  const deleteImage = async (publicId) => {
    if (!publicId) {
      return;
    }

    const token = localStorage.getItem('auth-token');

    if (!token) {
      throw new Error('Authentification requise pour supprimer des images');
    }

    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ publicId })
    });

    let result = null;

    try {
      result = await response.json();
    } catch (error) {
      // ignore parse errors
    }

    if (!response.ok) {
      const message = result?.message || "Erreur lors de la suppression de l'image";
      throw new Error(message);
    }
  };

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadErrors((prev) => ({ ...prev, profilePhoto: '' }));
    setIsUploadingProfilePhoto(true);

    try {
      const [upload] = await uploadImages([file], 'profile');
      setFormData((prev) => ({
        ...prev,
        profilePhoto: upload
      }));
    } catch (error) {
      setUploadErrors((prev) => ({ ...prev, profilePhoto: error.message }));
    } finally {
      setIsUploadingProfilePhoto(false);
      event.target.value = '';
    }
  };

  const handleDescriptionPhotosUpload = async (event) => {
    const files = event.target.files ? Array.from(event.target.files) : [];

    if (!files.length) {
      return;
    }

    setUploadErrors((prev) => ({ ...prev, descriptionPhotos: '' }));
    setIsUploadingDescriptionPhotos(true);

    try {
      const uploads = await uploadImages(files, 'gallery');
      setFormData((prev) => ({
        ...prev,
        descriptionPhotos: [...prev.descriptionPhotos, ...uploads]
      }));
    } catch (error) {
      setUploadErrors((prev) => ({ ...prev, descriptionPhotos: error.message }));
    } finally {
      setIsUploadingDescriptionPhotos(false);
      event.target.value = '';
    }
  };

  const handleRemoveProfilePhoto = async () => {
    if (!formData.profilePhoto) {
      return;
    }

    setUploadErrors((prev) => ({ ...prev, profilePhoto: '' }));
    setIsRemovingProfilePhoto(true);

    try {
      if (formData.profilePhoto.publicId) {
        await deleteImage(formData.profilePhoto.publicId);
      }

      setFormData((prev) => ({
        ...prev,
        profilePhoto: null
      }));
    } catch (error) {
      setUploadErrors((prev) => ({ ...prev, profilePhoto: error.message }));
    } finally {
      setIsRemovingProfilePhoto(false);
    }
  };

  const handleRemoveDescriptionPhoto = async (photo, index) => {
    if (!photo) {
      return;
    }

    const photoUrl = photo.url || '';
    const photoKey = photo.publicId || `${photoUrl}-${index}`;

    setRemovingPhotoIds((prev) => ({
      ...prev,
      [photoKey]: true
    }));
    setUploadErrors((prev) => ({ ...prev, descriptionPhotos: '' }));

    try {
      if (photo.publicId) {
        await deleteImage(photo.publicId);
      }

      setFormData((prev) => {
        const updatedPhotos = prev.descriptionPhotos.filter((_, idx) => idx !== index);
        return {
          ...prev,
          descriptionPhotos: updatedPhotos
        };
      });
    } catch (error) {
      setUploadErrors((prev) => ({ ...prev, descriptionPhotos: error.message }));
    } finally {
      setRemovingPhotoIds((prev) => {
        const updated = { ...prev };
        delete updated[photoKey];
        return updated;
      });
    }
  };

  const handleAmenityToggle = (amenityId) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nom requis';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Adresse requise';
    }
    if (formData.maxGuests < 1) {
      newErrors.maxGuests = 'Au moins 1 invité';
    }
    if (formData.bedrooms < 0) {
      newErrors.bedrooms = 'Nombre de chambres invalide';
    }
    if (formData.bathrooms < 1) {
      newErrors.bathrooms = 'Au moins 1 salle de bain';
    }

    const validateUrl = (value, field) => {
      if (!value) return;
      try {
        const url = new URL(value);
        if (!url.protocol.startsWith('http')) {
          throw new Error('Invalid protocol');
        }
      } catch (error) {
        newErrors[field] = 'URL invalide';
      }
    };

    validateUrl(formData.airbnbUrl, 'airbnbUrl');
    validateUrl(formData.bookingUrl, 'bookingUrl');

    if (formData.profilePhoto?.url) {
      validateUrl(formData.profilePhoto.url, 'profilePhoto');
    }

    formData.descriptionPhotos.forEach((photo) => {
      const photoUrl = typeof photo === 'string' ? photo : photo?.url;

      if (!photoUrl) {
        return;
      }

      try {
        const url = new URL(photoUrl);
        if (!url.protocol.startsWith('http')) {
          throw new Error('Invalid protocol');
        }
      } catch (error) {
        newErrors.descriptionPhotos = 'Une ou plusieurs URLs de photos sont invalides';
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
      const url = property ? `/api/properties/${property.id}` : '/api/properties';
      const method = property ? 'PUT' : 'POST';

      const profilePhotoPayload = formData.profilePhoto
        ? {
            url: formData.profilePhoto.url,
            publicId: formData.profilePhoto.publicId || '',
            ...(formData.profilePhoto.thumbnailUrl ? { thumbnailUrl: formData.profilePhoto.thumbnailUrl } : {})
          }
        : null;

      const descriptionPhotosPayload = formData.descriptionPhotos
        .map((photo) => {
          if (!photo) {
            return null;
          }

          if (typeof photo === 'string') {
            return { url: photo, publicId: '' };
          }

          if (!photo.url) {
            return null;
          }

          return {
            url: photo.url,
            publicId: photo.publicId || '',
            ...(photo.thumbnailUrl ? { thumbnailUrl: photo.thumbnailUrl } : {})
          };
        })
        .filter((photo) => photo && photo.url);

      const payload = {
        ...formData,
        profilePhoto: profilePhotoPayload,
        descriptionPhotos: descriptionPhotosPayload
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const savedProperty = await response.json();
        onSave(savedProperty);
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      console.error('Error saving property:', error);
      setErrors({ submit: 'Erreur de connexion au serveur' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {property ? 'Modifier la propriété' : 'Nouvelle propriété'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <p className="text-danger-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations générales</h3>

            <div>
              <label htmlFor="name" className="form-label">
                <Home className="h-4 w-4 inline mr-2" />
                Nom de la propriété *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={`form-input ${errors.name ? 'border-danger-500' : ''}`}
                placeholder="Ex: Appartement Centre-ville"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-danger-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="form-label">
                <MapPin className="h-4 w-4 inline mr-2" />
                Adresse complète *
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                className={`form-input ${errors.address ? 'border-danger-500' : ''}`}
                placeholder="123 Rue de la Paix, 75001 Paris"
                value={formData.address}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-danger-600">{errors.address}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="form-input"
                placeholder="Décrivez votre propriété..."
                value={formData.description}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="type" className="form-label">
                Type de logement *
              </label>
              <select
                id="type"
                name="type"
                className="form-input"
                value={formData.type}
                onChange={handleChange}
                disabled={isLoading}
              >
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Online Presence */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Présence en ligne</h3>

            <div>
              <label htmlFor="airbnbUrl" className="form-label">
                <Link2 className="h-4 w-4 inline mr-2" />
                Lien Airbnb
              </label>
              <input
                id="airbnbUrl"
                name="airbnbUrl"
                type="url"
                className={`form-input ${errors.airbnbUrl ? 'border-danger-500' : ''}`}
                placeholder="https://www.airbnb.fr/..."
                value={formData.airbnbUrl}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.airbnbUrl && (
                <p className="mt-1 text-sm text-danger-600">{errors.airbnbUrl}</p>
              )}
            </div>

            <div>
              <label htmlFor="bookingUrl" className="form-label">
                <Link2 className="h-4 w-4 inline mr-2" />
                Lien Booking
              </label>
              <input
                id="bookingUrl"
                name="bookingUrl"
                type="url"
                className={`form-input ${errors.bookingUrl ? 'border-danger-500' : ''}`}
                placeholder="https://www.booking.com/..."
                value={formData.bookingUrl}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.bookingUrl && (
                <p className="mt-1 text-sm text-danger-600">{errors.bookingUrl}</p>
              )}
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Photos</h3>

            <div className="space-y-2">
              <label htmlFor="profilePhotoUpload" className="form-label">
                <ImageIcon className="h-4 w-4 inline mr-2" />
                Photo de profil
              </label>

              {formData.profilePhoto ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={formData.profilePhoto.thumbnailUrl || formData.profilePhoto.url}
                    alt={`Photo de profil de ${formData.name || 'la propriété'}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 384px"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={handleRemoveProfilePhoto}
                    className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors p-2"
                    disabled={isRemovingProfilePhoto || isLoading}
                  >
                    {isRemovingProfilePhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="profilePhotoUpload"
                  className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors ${
                    isUploadingProfilePhoto
                      ? 'border-primary-400 bg-primary-50 text-primary-600'
                      : 'border-gray-300 hover:border-primary-400 text-gray-600'
                  } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isUploadingProfilePhoto ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      <span className="text-sm font-medium">Téléversement en cours...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Cliquez pour téléverser</span>
                      <span className="text-xs text-gray-500 mt-1">Formats JPG, PNG, WEBP (10 Mo max)</span>
                    </>
                  )}
                </label>
              )}

              <input
                id="profilePhotoUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoUpload}
                disabled={isLoading || isUploadingProfilePhoto}
              />

              {uploadErrors.profilePhoto && (
                <p className="text-sm text-danger-600">{uploadErrors.profilePhoto}</p>
              )}
            </div>

            <div className="space-y-3">
              <label htmlFor="descriptionPhotosUpload" className="form-label">
                <ImageIcon className="h-4 w-4 inline mr-2" />
                Photos de description
              </label>

              <label
                htmlFor="descriptionPhotosUpload"
                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  isUploadingDescriptionPhotos
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-dashed border-gray-300 hover:border-primary-400 text-gray-700'
                } ${isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isUploadingDescriptionPhotos ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Téléversement...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter des photos
                  </>
                )}
              </label>

              <input
                id="descriptionPhotosUpload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleDescriptionPhotosUpload}
                disabled={isLoading || isUploadingDescriptionPhotos}
              />

              {uploadErrors.descriptionPhotos && (
                <p className="text-sm text-danger-600">{uploadErrors.descriptionPhotos}</p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {formData.descriptionPhotos.length === 0 && (
                  <p className="col-span-full text-sm text-gray-500">
                    Ajoutez plusieurs photos pour présenter votre logement.
                  </p>
                )}

                {formData.descriptionPhotos.map((photo, index) => {
                  if (!photo?.url) {
                    return null;
                  }

                  const photoKey = photo.publicId || `${photo.url}-${index}`;
                  const isRemoving = Boolean(removingPhotoIds[photoKey]);

                  return (
                    <div
                      key={photoKey}
                      className="relative h-28 w-full overflow-hidden rounded-lg bg-gray-100"
                    >
                      <Image
                        src={photo.thumbnailUrl || photo.url}
                        alt={`Photo ${index + 1} de ${formData.name || 'la propriété'}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 192px"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDescriptionPhoto(photo, index)}
                        className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors p-1.5"
                        disabled={isRemoving || isLoading}
                      >
                        {isRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {errors.descriptionPhotos && (
                <p className="text-sm text-danger-600">{errors.descriptionPhotos}</p>
              )}
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Capacité</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="maxGuests" className="form-label">
                  <Users className="h-4 w-4 inline mr-2" />
                  Invités max *
                </label>
                <input
                  id="maxGuests"
                  name="maxGuests"
                  type="number"
                  min="1"
                  max="20"
                  required
                  className={`form-input ${errors.maxGuests ? 'border-danger-500' : ''}`}
                  value={formData.maxGuests}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.maxGuests && (
                  <p className="mt-1 text-sm text-danger-600">{errors.maxGuests}</p>
                )}
              </div>

              <div>
                <label htmlFor="bedrooms" className="form-label">
                  <Bed className="h-4 w-4 inline mr-2" />
                  Chambres
                </label>
                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  max="10"
                  className={`form-input ${errors.bedrooms ? 'border-danger-500' : ''}`}
                  value={formData.bedrooms}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.bedrooms && (
                  <p className="mt-1 text-sm text-danger-600">{errors.bedrooms}</p>
                )}
              </div>

              <div>
                <label htmlFor="bathrooms" className="form-label">
                  <Bath className="h-4 w-4 inline mr-2" />
                  Salles de bain *
                </label>
                <input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="1"
                  max="10"
                  required
                  className={`form-input ${errors.bathrooms ? 'border-danger-500' : ''}`}
                  value={formData.bathrooms}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.bathrooms && (
                  <p className="mt-1 text-sm text-danger-600">{errors.bathrooms}</p>
                )}
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Équipements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableAmenities.map(amenity => {
                const Icon = amenity.icon;
                const isSelected = formData.amenities.includes(amenity.id);
                
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity.id)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                    disabled={isLoading}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    {amenity.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Sauvegarde...
                </div>
              ) : (
                property ? 'Mettre à jour' : 'Créer la propriété'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}