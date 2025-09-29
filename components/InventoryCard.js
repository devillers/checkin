'use client';

import { 
  FileText, 
  Calendar, 
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
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * InventoryRow – UX refactor
 * -------------------------------------------------
 * • Pure TailwindCSS (no UI lib)
 * • Row/table-like layout on desktop, stacked on mobile
 * • Minimalist badges, compact metrics, inline progress
 * • Hover-revealed actions + accessible dropdown menu
 * • Precise spacing, subtle separators, strong contrast
 */
export default function InventoryRow({ inventory, onView, onEdit, onDuplicate }) {
  const [open, setOpen] = useState(false);

  const status = useMemo(() => getStatusConfig(inventory?.status), [inventory?.status]);
  const type   = useMemo(() => getTypeConfig(inventory?.type), [inventory?.type]);

  const createdAt   = useMemo(() => safeDate(inventory?.createdAt), [inventory?.createdAt]);
  const dueDate     = useMemo(() => safeDate(inventory?.dueDate), [inventory?.dueDate]);
  const completedAt = useMemo(() => safeDate(inventory?.completedAt), [inventory?.completedAt]);

  const late = useMemo(() => (dueDate ? dueDate < new Date() : false), [dueDate]);

  return (
    <div
      className="group relative w-full rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-5 py-3 sm:py-4 aminate-in fade-in-0 duration-300 shadow-md hover:shadow-sm"
      role="row"
    >
      {/* Top line – Property / Status / Type */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex items-center gap-2 sm:gap-3">
          <FileText className="h-4 w-4 shrink-0 text-slate-500" />
          <h3 className="truncate text-base sm:text-[15px] font-semibold text-slate-900">
            {inventory?.propertyName || 'Propriété inconnue'}
          </h3>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Badge tone={status.tone} icon={status.icon} label={status.text} />
          <Badge tone={type.tone} label={type.text} subtle />
        </div>
      </div>

      {/* Middle – Guest / Dates / Progress / Metrics */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2">
        {/* Guest */}
        <div className="sm:col-span-3 flex items-center gap-2 text-sm text-slate-600 min-w-0">
          <User className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{inventory?.guestName || '—'}</span>
        </div>

        {/* Dates */}
        <div className="sm:col-span-5 grid grid-cols-3 gap-3 sm:gap-4 text-sm">
          <DateCell label="Créé" value={createdAt} />
          <DateCell label="Échéance" value={dueDate} danger={late} time />
          <DateCell label="Terminé" value={completedAt} good time />
        </div>

        {/* Metrics */}
        <div className="sm:col-span-2 sm:invisible md:invisible lg:invisible xl:visible grid grid-cols-2 divide-x divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
          <MetricCell label="Pièces" value={inventory?.roomsCount ?? 0} />
          <MetricCell label="Éléments" value={inventory?.itemsCount ?? 0} />
        </div>

        {/* Actions – always last col on desktop */}
        <div className="sm:col-span-2 flex items-center justify-end gap-2">
          <button
            onClick={() => onView?.(inventory)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" /> Voir
          </button>
          <button
            onClick={() => onEdit?.(inventory)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" /> Éditer
          </button>

          {/* Kebab menu */}
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              <MoreVertical className="h-4 w-4 text-slate-600" />
            </button>
            {open && (
              <>
                <button className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-label="Fermer le menu" />
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                >
                  <MenuItem icon={Eye} label="Voir détails" onClick={() => { onView?.(inventory); setOpen(false); }} />
                  <MenuItem icon={Edit} label="Modifier" onClick={() => { onEdit?.(inventory); setOpen(false); }} />
                  <MenuItem icon={Copy} label="Dupliquer" onClick={() => { onDuplicate?.(inventory); setOpen(false); }} />
                  <MenuItem icon={Download} label="Exporter PDF" onClick={() => setOpen(false)} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress – full width rail */}
      {typeof inventory?.progress === 'number' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Progression</span>
            <span className="font-medium text-slate-700">{inventory.progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-slate-900 transition-[width] duration-300"
              style={{ width: `${Math.min(Math.max(inventory.progress, 0), 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Issues & description – subtle bottom strip */}
      {(!!inventory?.issuesCount || !!inventory?.description) && (
        <div className="mt-3 border-t border-slate-100 pt-3 flex flex-col gap-2">
          {!!inventory?.issuesCount && (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-700">
              <AlertCircle className="h-4 w-4" />
              {inventory.issuesCount} problème{inventory.issuesCount > 1 ? 's' : ''} détecté{inventory.issuesCount > 1 ? 's' : ''}
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}

// ——————————————— Helpers
function safeDate(value) {
  try {
    return value ? new Date(value) : null;
  } catch {
    return null;
  }
}

function DateCell({ label, value, time = false, danger = false, good = false }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={[
        'mt-0.5 truncate text-sm font-medium',
        danger ? 'text-rose-600' : good ? 'text-emerald-600' : 'text-slate-800'
      ].join(' ')}>
        {value ? format(value, time ? 'd MMM yyyy HH:mm' : 'd MMM yyyy', { locale: fr }) : '—'}
      </div>
    </div>
  );
}

function MetricCell({ label, value }) {
  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-3">
      <div className="text-base font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function Badge({ label, icon: Icon, tone = 'slate', subtle = false }) {
  const tones = {
    slate:  subtle ? 'bg-slate-50 text-slate-700 ring-1 ring-slate-200' : 'bg-slate-100 text-slate-800',
    amber:  subtle ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-amber-100 text-amber-800',
    blue:   subtle ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'   : 'bg-blue-100 text-blue-800',
    emerald:subtle ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-emerald-100 text-emerald-800',
    rose:   subtle ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'   : 'bg-rose-100 text-rose-800',
    gray:   subtle ? 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'   : 'bg-gray-100 text-gray-800'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone] ?? tones.slate}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </span>
  );
}

function getStatusConfig(status) {
  switch (status) {
    case 'pending':
      return { tone: 'amber', icon: Clock, text: 'En attente' };
    case 'in_progress':
      return { tone: 'blue', icon: FileText, text: 'En cours' };
    case 'completed':
      return { tone: 'emerald', icon: CheckCircle, text: 'Terminé' };
    case 'archived':
      return { tone: 'gray', icon: FileText, text: 'Archivé' };
    default:
      return { tone: 'gray', icon: AlertCircle, text: 'Inconnu' };
  }
}

function getTypeConfig(type) {
  switch (type) {
    case 'checkin':
      return { tone: 'emerald', text: "État d'entrée" };
    case 'checkout':
      return { tone: 'rose', text: 'État de sortie' };
    default:
      return { tone: 'slate', text: 'Général' };
  }
}
