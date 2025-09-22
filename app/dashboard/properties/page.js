'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Plus, MapPin, Users, BarChart3, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import PropertyCard from '@/components/PropertyCard';
import PropertyModal from '@/components/PropertyModal';

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'Actives' },
  { key: 'inactive', label: 'Inactives' }
];

export default function DashboardPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/properties', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Impossible de récupérer les propriétés');
      }

      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err.message || 'Erreur inattendue lors du chargement des propriétés');
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

  const handlePropertySaved = async () => {
    await fetchProperties();
    setShowModal(false);
  };

  const handleDeleteProperty = async (property) => {
    if (!property || isDeleting) {
      return;
    }

    const shouldDelete = window.confirm(
      `Supprimer la propriété "${property.name}" ? Cette action est irréversible.`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de la suppression');
      }

      await fetchProperties();
    } catch (err) {
      console.error('Error deleting property:', err);
      setError(err.message || 'Erreur inattendue lors de la suppression de la propriété');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      if (filter === 'all') return true;
      return property.status === filter;
    });
  }, [properties, filter]);

  const stats = useMemo(() => {
    const total = properties.length;
    const active = properties.filter((property) => property.status === 'active').length;
    const inactive = properties.filter((property) => property.status === 'inactive').length;
    const totalCapacity = properties.reduce(
      (acc, property) => acc + (property.maxGuests || 0),
      0
    );

    return {
      total,
      active,
      inactive,
      totalCapacity
    };
  }, [properties]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Propriétés</h1>
            <p className="mt-1 text-gray-600">
              Centralisez vos logements, leurs liens de réservation et leurs photos.
            </p>
          </div>
          <button onClick={handleCreateProperty} className="btn-primary inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Ajouter une propriété
          </button>
        </div>

        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

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
              <Trash2 className="h-6 w-6 text-warning-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactives</div>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalCapacity}</div>
            <div className="text-sm text-gray-600">Capacité totale (invités)</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 bg-gray-100 rounded-lg p-1">
          {FILTERS.map((item) => (
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

        {filteredProperties.length === 0 ? (
          <div className="card text-center py-12">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all'
                ? 'Aucune propriété enregistrée'
                : `Aucune propriété ${filter === 'active' ? 'active' : 'inactive'}`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Ajoutez votre premier logement pour commencer la gestion.'
                : 'Aucune propriété ne correspond à ce filtre.'}
            </p>
            {filter === 'all' && (
              <button onClick={handleCreateProperty} className="btn-primary inline-flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Ajouter une propriété
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEditProperty}
                onView={(currentProperty) => router.push(`/properties/${currentProperty.id}`)}
                onCalendar={(currentProperty) =>
                  router.push(`/dashboard/calendrier?property=${currentProperty.id}`)
                }
                onSettings={(currentProperty) =>
                  router.push(`/properties/${currentProperty.id}/settings`)
                }
                onDelete={handleDeleteProperty}
              />
            ))}
          </div>
        )}

        {showModal && (
          <PropertyModal
            property={selectedProperty}
            onClose={() => setShowModal(false)}
            onSave={handlePropertySaved}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
