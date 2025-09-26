'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Filter,
  Search,
  Download,
  Copy,
  Archive,
  Eye,
  Edit,
  Calendar,
  Home,
  User
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import InventoryCard from '@/components/InventoryCard';

export default function InventoryPage() {
  const [inventories, setInventories] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [duplicateError, setDuplicateError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      
      const [inventoriesRes, propertiesRes] = await Promise.all([
        fetch('/api/inventories', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/properties', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (inventoriesRes.ok) {
        const inventoriesData = await inventoriesRes.json();
        setInventories(inventoriesData);
      }

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setProperties(propertiesData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInventories = inventories.filter(inventory => {
    const matchesSearch = inventory.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inventory.guestName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inventory.status === statusFilter;
    const matchesProperty = propertyFilter === 'all' || inventory.propertyId === propertyFilter;
    const matchesType = typeFilter === 'all' || inventory.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesProperty && matchesType;
  });

  const stats = {
    total: inventories.length,
    pending: inventories.filter(i => i.status === 'pending').length,
    completed: inventories.filter(i => i.status === 'completed').length,
    archived: inventories.filter(i => i.status === 'archived').length
  };

  const handleCreateInventory = () => {
    router.push('/inventory/new');
  };

  const handleViewInventory = (inventory) => {
    router.push(`/inventory/${inventory.id}`);
  };

  const handleEditInventory = (inventory) => {
    router.push(`/inventory/${inventory.id}/edit`);
  };

  const handleDuplicateInventory = async (inventory) => {
    try {
      const token = localStorage.getItem('auth-token');
      setDuplicateError(null);
      const response = await fetch(`/api/inventories/${inventory.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDuplicateError(null);
        await fetchData();
      } else {
        let errorMessage = "Erreur lors de la duplication de l'inventaire";
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error parsing duplicate inventory error response:', parseError);
        }
        setDuplicateError(errorMessage);
      }
    } catch (error) {
      console.error('Error duplicating inventory:', error);
      setDuplicateError("Impossible de dupliquer l'inventaire. Veuillez réessayer.");
    }
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
   
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Inventaires
            </h1>
            <p className="mt-1 text-gray-600">
              Gérez vos états des lieux d'entrée et de sortie
            </p>
          </div>
          <button
            onClick={handleCreateInventory}
            className="mt-4 sm:mt-0 btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvel inventaire
          </button>
        </div>

        {duplicateError && (
          <div className="rounded-lg border border-danger-200 bg-danger-50 text-danger-700 p-4">
            {duplicateError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total inventaires</div>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-warning-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-warning-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-success-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-success-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
            <div className="text-sm text-gray-600">Terminés</div>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <Archive className="h-6 w-6 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.archived}</div>
            <div className="text-sm text-gray-600">Archivés</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminés</option>
              <option value="archived">Archivés</option>
            </select>

            {/* Property Filter */}
            <select
              className="form-input"
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
            >
              <option value="all">Toutes les propriétés</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              className="form-input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="checkin">État d'entrée</option>
              <option value="checkout">État de sortie</option>
            </select>
          </div>
        </div>

        {/* Inventories Grid */}
        {filteredInventories.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {inventories.length === 0 
                ? 'Aucun inventaire créé'
                : 'Aucun résultat pour ces filtres'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {inventories.length === 0
                ? 'Créez votre premier inventaire pour commencer à gérer vos états des lieux'
                : 'Essayez de modifier vos critères de recherche'
              }
            </p>
            {inventories.length === 0 && (
              <button
                onClick={handleCreateInventory}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Créer mon premier inventaire
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInventories.map((inventory) => (
              <InventoryCard
                key={inventory.id}
                inventory={inventory}
                onView={handleViewInventory}
                onEdit={handleEditInventory}
                onDuplicate={handleDuplicateInventory}
              />
            ))}
          </div>
        )}
      </div>
   
  );
}