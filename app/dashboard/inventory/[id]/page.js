'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  FileText,
  Home,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ListChecks
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


const STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    color: 'bg-warning-100 text-warning-800',
    icon: Clock
  },
  in_progress: {
    label: 'En cours',
    color: 'bg-primary-100 text-primary-800',
    icon: ListChecks
  },
  completed: {
    label: 'Terminé',
    color: 'bg-success-100 text-success-800',
    icon: CheckCircle
  },
  archived: {
    label: 'Archivé',
    color: 'bg-gray-100 text-gray-800',
    icon: FileText
  }
};

const TYPE_CONFIG = {
  checkin: {
    label: "État d'entrée",
    color: 'text-success-600'
  },
  checkout: {
    label: 'État de sortie',
    color: 'text-danger-600'
  }
};

const formatDate = (date, withTime = false) => {
  if (!date) return '—';

  try {
    return format(new Date(date), withTime ? 'd MMM yyyy HH:mm' : 'd MMM yyyy', {
      locale: fr
    });
  } catch (error) {
    console.error('Error formatting date', error);
    return '—';
  }
};

export default function InventoryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const inventoryId = params?.id;

  const [inventory, setInventory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    if (!inventoryId) {
      setError("Identifiant d'inventaire manquant");
      setIsLoading(false);
      return;
    }

    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await fetch(`/api/inventories/${inventoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401) {
          router.replace('/auth/login');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData?.message || "Impossible de récupérer l'inventaire"
          );
        }

        const data = await response.json();
        setInventory(data);
      } catch (fetchError) {
        console.error('Error fetching inventory', fetchError);
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [inventoryId, router]);

  const statusConfig = useMemo(() => {
    if (!inventory?.status) {
      return {
        label: 'Statut inconnu',
        color: 'bg-gray-100 text-gray-800',
        icon: AlertCircle
      };
    }

    return STATUS_CONFIG[inventory.status] ?? {
      label: inventory.status,
      color: 'bg-gray-100 text-gray-800',
      icon: AlertCircle
    };
  }, [inventory?.status]);

  const typeConfig = TYPE_CONFIG[inventory?.type] ?? {
    label: 'Général',
    color: 'text-gray-600'
  };

  const StatusIcon = statusConfig.icon;

  return (
  
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Inventaire #{inventoryId}
              </h1>
              <p className="text-gray-600">
                Consultez les détails complets de cet inventaire
              </p>
            </div>
          </div>

          {inventory && (
            <button
              onClick={() => router.push(`/dashboard/inventory/${inventoryId}/edit`)}
              className="btn-primary inline-flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="card flex items-center justify-center h-64">
            <div className="loading-spinner" aria-label="Chargement" />
          </div>
        ) : error ? (
          <div className="card bg-danger-50 border border-danger-200 text-danger-700">
            {error}
          </div>
        ) : !inventory ? (
          <div className="card text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Inventaire introuvable
            </h2>
              <p className="text-gray-600 mb-6">
                Vérifiez l&apos;identifiant ou retournez à la liste des inventaires.
              </p>
            <button
              onClick={() => router.push('/dashboard/inventory')}
              className="btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Home className="h-5 w-5 text-primary-600" />
                    <span className="text-lg font-semibold text-gray-900">
                      {inventory.propertyName || 'Propriété inconnue'}
                    </span>
                  </div>
                  {inventory.propertyAddress && (
                    <p className="text-sm text-gray-600">
                      {inventory.propertyAddress}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`badge ${statusConfig.color} flex items-center`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </span>
                  <span className={`text-sm font-medium ${typeConfig.color}`}>
                    {typeConfig.label}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Créé le
                  <span className="ml-auto font-medium text-gray-900">
                    {formatDate(inventory.createdAt)}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Dernière mise à jour
                  <span className="ml-auto font-medium text-gray-900">
                    {formatDate(inventory.updatedAt, true)}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Échéance
                  <span
                    className={`ml-auto font-medium ${
                      inventory.dueDate && new Date(inventory.dueDate) < new Date()
                        ? 'text-danger-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {formatDate(inventory.dueDate, true)}
                  </span>
                </div>
              </div>

              {inventory.description && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Description
                  </h3>
                  <p className="mt-2 text-gray-700 leading-relaxed">
                    {inventory.description}
                  </p>
                </div>
              )}

              {inventory.guest && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Guest associé
                  </h3>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-gray-700">
                      <User className="h-5 w-5 mr-3 text-primary-600" />
                      <div>
                        <p className="font-medium">
                          {inventory.guest.firstName} {inventory.guest.lastName}
                        </p>
                        {inventory.guest.email && (
                          <p className="text-sm text-gray-500">{inventory.guest.email}</p>
                        )}
                      </div>
                    </div>
                    {inventory.guest.phone && (
                      <p className="mt-2 sm:mt-0 text-sm text-gray-600">
                        Tél : {inventory.guest.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pièces et éléments vérifiés
                </h2>
                <span className="text-sm text-gray-600">
                  {inventory.rooms?.length || 0} pièce(s)
                </span>
              </div>

              {(!inventory.rooms || inventory.rooms.length === 0) && (
                <div className="text-center py-10 text-gray-600">
                  Aucune pièce enregistrée pour cet inventaire.
                </div>
              )}

              <div className="space-y-6">
                {inventory.rooms?.map((room) => (
                  <div key={room.id} className="border border-gray-100 rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-md font-semibold text-gray-900">
                          {room.name || 'Pièce sans nom'}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {room.type || 'type inconnu'}
                        </p>
                      </div>
                      <span className="text-sm text-gray-600">
                        {room.items?.length || 0} élément(s)
                      </span>
                    </div>

                    {room.items && room.items.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {room.items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <p className="font-medium text-gray-900">
                                {item.name || 'Élément sans nom'}
                              </p>
                              <span className="text-gray-600">
                                Condition : {item.condition ?? '—'}/5
                              </span>
                            </div>
                            {item.description && (
                              <p className="mt-2 text-gray-600">{item.description}</p>
                            )}
                            {item.comments && (
                              <p className="mt-2 text-gray-500 italic">
                                Commentaires : {item.comments}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
   
  );
}
