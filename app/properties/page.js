'use client';

import { useState, useEffect } from 'react';
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
  Eye,
  Calendar,
  Key
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import PropertyCard from '@/components/PropertyCard';
import PropertyModal from '@/components/PropertyModal';

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filter, setFilter] = useState('all');
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

        {/* Properties Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEditProperty}
                onView={(property) => router.push(`/properties/${property.id}`)}
                onCalendar={(property) => router.push(`/calendar?property=${property.id}`)}
                onSettings={(property) => router.push(`/properties/${property.id}/settings`)}
              />
            ))}
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
      </div>
    </DashboardLayout>
  );
}