'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  Plus,
  MapPin,
  Users,
  Bed,
  Bath,
  Settings,
  BarChart3,
  Edit,
  Trash2
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import PropertyModal from '@/components/PropertyModal';

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filter, setFilter] = useState('all');
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/properties', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      } else {
        console.error('Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProperty = () => {
    setSelectedProperty(null);
    setShowModal(true);
  };

  const handleEditProperty = (property) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const handleRequestDeleteProperty = (property) => {
    setDeleteError('');
    setPropertyToDelete(property);
  };

  const handleCancelDeleteProperty = () => {
    setPropertyToDelete(null);
    setDeleteError('');
  };

  const handleConfirmDeleteProperty = async () => {
    if (!propertyToDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError('');
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/properties/${propertyToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur lors de la suppression de la propriété.');
      }

      await fetchProperties();
      setPropertyToDelete(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      setDeleteError(error.message || 'Erreur inattendue lors de la suppression de la propriété.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePropertySaved = async (property) => {
    await fetchProperties();
    setShowModal(false);
  };

  const filteredProperties = properties.filter(property => {
    if (filter === 'all') return true;
    if (filter === 'active') return property.status === 'active';
    if (filter === 'inactive') return property.status === 'inactive';
    return true;
  });

  const getStatusStyles = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Inconnue';
    }
  };

  const getPhotoUrl = (photo) => {
    if (!photo) {
      return '';
    }

    if (typeof photo === 'string') {
      return photo;
    }

    if (typeof photo === 'object') {
      return photo.thumbnailUrl || photo.url || '';
    }

    return '';
  };

  const getFormattedAddress = (property) => {
    if (!property) {
      return '';
    }

    if (typeof property.address === 'string') {
      return property.address;
    }

    if (property.formattedAddress) {
      return property.formattedAddress;
    }

    if (property.address?.formatted) {
      return property.address.formatted;
    }

    if (property.address && typeof property.address === 'object') {
      const { streetNumber, street, complement, postalCode, city, country } = property.address;
      return [
        [streetNumber, street].filter(Boolean).join(' '),
        complement,
        [postalCode, city].filter(Boolean).join(' '),
        country
      ]
        .filter(Boolean)
        .join(', ');
    }

    return '';
  };

  const stats = {
    total: properties.length,
    active: properties.filter(p => p.status === 'active').length,
    inactive: properties.filter(p => p.status === 'inactive').length,
    totalRevenue: properties.reduce((sum, p) => sum + (p.stats?.totalRevenue || 0), 0)
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Mes Propriétés
            </h1>
            <p className="mt-1 text-gray-600">
              Gérez vos locations et leurs paramètres
            </p>
          </div>
          <button
            onClick={handleCreateProperty}
            className="mt-4 sm:mt-0 btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ajouter une propriété
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
              <Home className="h-6 w-6 text-primary-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total propriétés</div>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-success-100 rounded-full flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-success-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
            <div className="text-sm text-gray-600">Actives</div>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-warning-100 rounded-full flex items-center justify-center">
              <Settings className="h-6 w-6 text-warning-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactives</div>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalRevenue}€</div>
            <div className="text-sm text-gray-600">CA total</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'active', label: 'Actives' },
            { key: 'inactive', label: 'Inactives' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === item.key
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Properties Table */}
        {filteredProperties.length === 0 ? (
          <div className="card text-center py-12">
            <Home className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'Aucune propriété' : `Aucune propriété ${filter === 'active' ? 'active' : 'inactive'}`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Commencez par ajouter votre première propriété à gérer'
                : 'Aucune propriété ne correspond à ce filtre'
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={handleCreateProperty}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Ajouter ma première propriété
              </button>
            )}
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Propriété
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Localisation
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Capacité
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredProperties.map((property) => {
                    const photoUrl = getPhotoUrl(property.profilePhoto);
                    const formattedAddress = getFormattedAddress(property);

                    return (
                      <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                              {photoUrl ? (
                                <Image
                                  src={photoUrl}
                                  alt={`Photo de ${property.name}`}
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 rounded-full object-cover"
                                  sizes="48px"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-sm font-semibold text-gray-500">
                                  {property.name?.[0] || '?'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => router.push(`/properties/${property.id}`)}
                                  className="text-left text-sm font-semibold text-gray-900 hover:text-primary-600 focus:outline-none"
                                >
                                  {property.name || 'Sans titre'}
                                </button>
                                <span className={`badge ${getStatusStyles(property.status)}`}>
                                  {getStatusLabel(property.status)}
                                </span>
                              </div>
                              {property.reference && (
                                <p className="text-xs text-gray-500 mt-1">Réf. {property.reference}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{formattedAddress || 'Adresse non renseignée'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4 text-sm text-gray-700">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="ml-2">{property.maxGuests ?? '-'}</span>
                            </div>
                            <div className="flex items-center">
                              <Bed className="h-4 w-4 text-gray-400" />
                              <span className="ml-2">{property.bedrooms ?? '-'}</span>
                            </div>
                            <div className="flex items-center">
                              <Bath className="h-4 w-4 text-gray-400" />
                              <span className="ml-2">{property.bathrooms ?? '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">CA total</span>
                              <span className="font-semibold text-gray-900">{property.stats?.totalRevenue || 0}€</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Note</span>
                              <span className="font-semibold text-gray-900">
                                {property.stats?.averageRating ? `${property.stats.averageRating}/5` : '-'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditProperty(property)}
                              className="btn-primary inline-flex items-center px-3 py-2 text-sm"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </button>
                            <button
                              onClick={() => handleRequestDeleteProperty(property)}
                              className="btn-danger inline-flex items-center px-3 py-2 text-sm"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Effacer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Property Modal */}
        {showModal && (
          <PropertyModal
            property={selectedProperty}
            onClose={() => setShowModal(false)}
            onSave={handlePropertySaved}
          />
        )}

        {propertyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmer la suppression
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Êtes-vous sûr de vouloir supprimer la propriété «&nbsp;
                <span className="font-semibold">{propertyToDelete.name || 'Sans titre'}</span>
                &nbsp;» ? Cette action est irréversible.
              </p>
              {deleteError && (
                <div className="mt-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg p-3 text-sm">
                  {deleteError}
                </div>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelDeleteProperty}
                  disabled={isDeleting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleConfirmDeleteProperty}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Suppression...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}