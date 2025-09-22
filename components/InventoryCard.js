'use client';

import { 
  FileText, 
  Calendar, 
  Home,
  User,
  Eye,
  Edit,
  Copy,
  Download,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function InventoryCard({ inventory, onView, onEdit, onDuplicate }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-warning-100 text-warning-800',
          icon: Clock,
          text: 'En attente'
        };
      case 'in_progress':
        return {
          color: 'bg-primary-100 text-primary-800',
          icon: FileText,
          text: 'En cours'
        };
      case 'completed':
        return {
          color: 'bg-success-100 text-success-800',
          icon: CheckCircle,
          text: 'Terminé'
        };
      case 'archived':
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: FileText,
          text: 'Archivé'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
          text: 'Inconnu'
        };
    }
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'checkin':
        return {
          color: 'text-success-600',
          text: 'État d\'entrée'
        };
      case 'checkout':
        return {
          color: 'text-danger-600',
          text: 'État de sortie'
        };
      default:
        return {
          color: 'text-gray-600',
          text: 'Général'
        };
    }
  };

  const statusConfig = getStatusConfig(inventory.status);
  const typeConfig = getTypeConfig(inventory.type);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="card hover-lift group relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {inventory.propertyName || 'Propriété inconnue'}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <span className={`badge ${statusConfig.color} flex items-center`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.text}
            </span>
            <span className={`text-sm font-medium ${typeConfig.color}`}>
              {typeConfig.text}
            </span>
          </div>
        </div>
        
        {/* Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </button>
          
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => {
                    onView(inventory);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </button>
                <button
                  onClick={() => {
                    onEdit(inventory);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </button>
                <button
                  onClick={() => {
                    onDuplicate(inventory);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </button>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Guest Info */}
      {inventory.guestName && (
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <User className="h-4 w-4 mr-2" />
          <span>{inventory.guestName}</span>
        </div>
      )}

      {/* Dates */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Créé le:</span>
          <span className="font-medium text-gray-900">
            {format(new Date(inventory.createdAt), 'd MMM yyyy', { locale: fr })}
          </span>
        </div>
        
        {inventory.dueDate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Échéance:</span>
            <span className={`font-medium ${
              new Date(inventory.dueDate) < new Date() ? 'text-danger-600' : 'text-gray-900'
            }`}>
              {format(new Date(inventory.dueDate), 'd MMM yyyy HH:mm', { locale: fr })}
            </span>
          </div>
        )}

        {inventory.completedAt && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Terminé le:</span>
            <span className="font-medium text-success-600">
              {format(new Date(inventory.completedAt), 'd MMM yyyy HH:mm', { locale: fr })}
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      {inventory.progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progression</span>
            <span className="font-medium text-gray-900">{inventory.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${inventory.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {inventory.roomsCount || 0}
          </div>
          <div className="text-xs text-gray-600">Pièces</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {inventory.itemsCount || 0}
          </div>
          <div className="text-xs text-gray-600">Éléments</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2 mt-4">
        <button
          onClick={() => onView(inventory)}
          className="flex-1 btn-secondary text-sm py-2"
        >
          <Eye className="h-4 w-4 mr-1" />
          Voir
        </button>
        <button
          onClick={() => onEdit(inventory)}
          className="flex-1 btn-primary text-sm py-2"
        >
          <Edit className="h-4 w-4 mr-1" />
          Éditer
        </button>
      </div>

      {/* Issues indicator */}
      {inventory.issuesCount && inventory.issuesCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-warning-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>{inventory.issuesCount} problème{inventory.issuesCount > 1 ? 's' : ''} détecté{inventory.issuesCount > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Description preview */}
      {inventory.description && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">
            {inventory.description}
          </p>
        </div>
      )}
    </div>
  );
}