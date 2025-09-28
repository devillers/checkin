'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CreditCard, Filter, RefreshCw, Search, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_DETAILS = {
  captured: {
    label: 'Capturé',
    tone: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  partially_refunded: {
    label: 'Partiellement remboursé',
    tone: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  refunded: {
    label: 'Remboursé',
    tone: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  canceled: {
    label: 'Annulé',
    tone: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'captured', label: 'Capturé' },
  { value: 'partially_refunded', label: 'Partiellement remboursé' },
  { value: 'refunded', label: 'Remboursé' },
  { value: 'canceled', label: 'Annulé' },
];

function formatCurrency(amount, currency) {
  if (typeof amount !== 'number') {
    return '—';
  }

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: (currency || 'EUR').toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount / 100);
  } catch (error) {
    return `${(amount / 100).toFixed(2)} ${currency || ''}`.trim();
  }
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function computeCurrencyRollup(deposits, field) {
  return deposits.reduce((accumulator, deposit) => {
    const currency = (deposit.currency || 'EUR').toUpperCase();
    const amount = typeof deposit[field] === 'number' ? deposit[field] : 0;
    accumulator[currency] = (accumulator[currency] || 0) + amount;
    return accumulator;
  }, {});
}

function renderCurrencyRollup(rollup) {
  const entries = Object.entries(rollup);

  if (entries.length === 0) {
    return '—';
  }

  return entries
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(' · ');
}

export default function PerceivedDepositsPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [depositData, setDepositData] = useState({ items: [], total: 0, totalPages: 0, page: 1, pageSize: 20 });
  const [propertyOptions, setPropertyOptions] = useState([]);

  const handlePropertyFilterChange = useCallback((value) => {
    setPropertyFilter(value);
    setPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const loadDeposits = useCallback(async () => {
    if (isCheckingAuth) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        expand: 'guest,property',
        page: String(page),
        pageSize: String(depositData.pageSize || 20),
      });

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      if (propertyFilter !== 'all') {
        params.set('propertyId', propertyFilter);
      }

      const response = await fetch(`/api/deposits?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Erreur lors du chargement des deposits');
      }

      setDepositData({
        items: Array.isArray(payload.items) ? payload.items : [],
        total: payload.total ?? 0,
        totalPages: payload.totalPages ?? 0,
        page: payload.page ?? 1,
        pageSize: payload.pageSize ?? 20,
      });

      setPage(payload.page ?? 1);

      setPropertyOptions((previous) => {
        const nextPropertyOptions = new Map(previous.map((option) => [option.value, option]));

        (payload.items || []).forEach((item) => {
          if (item.property_id) {
            const label = item.property_title || item.property?.title || 'Logement sans titre';
            nextPropertyOptions.set(item.property_id, {
              value: item.property_id,
              label,
            });
          }
        });

        return Array.from(nextPropertyOptions.values());
      });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Erreur inattendue');
    } finally {
      setIsLoading(false);
    }
  }, [depositData.pageSize, isCheckingAuth, page, propertyFilter, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (!isCheckingAuth) {
      loadDeposits();
    }
  }, [isCheckingAuth, loadDeposits]);

  const filteredDeposits = useMemo(() => {
    const items = Array.isArray(depositData.items) ? depositData.items : [];

    if (!searchTerm) {
      return items;
    }

    const normalized = searchTerm.toLowerCase();

    return items.filter((deposit) => {
      const guestName = (
        deposit.guest_name ||
        [deposit.guest?.first_name, deposit.guest?.last_name].filter(Boolean).join(' ')
      )
        .toString()
        .toLowerCase();

      const propertyTitle = (
        deposit.property_title ||
        deposit.property?.title ||
        ''
      )
        .toString()
        .toLowerCase();

      const description = (deposit.description || '').toLowerCase();

      return (
        guestName.includes(normalized) ||
        propertyTitle.includes(normalized) ||
        description.includes(normalized) ||
        (deposit.stripe_payment_intent_id || '').toLowerCase().includes(normalized) ||
        (deposit.stripe_charge_id || '').toLowerCase().includes(normalized)
      );
    });
  }, [depositData.items, searchTerm]);

  const totalCaptured = useMemo(
    () => computeCurrencyRollup(filteredDeposits.filter((item) => item.status === 'captured'), 'amount'),
    [filteredDeposits]
  );

  const totalRefundable = useMemo(
    () => computeCurrencyRollup(filteredDeposits, 'refundable_remaining'),
    [filteredDeposits]
  );

  const refundedCount = useMemo(
    () => filteredDeposits.filter((item) => item.status === 'refunded').length,
    [filteredDeposits]
  );

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Deposits perçus</h1>
          <p className="mt-1 text-gray-600">
            Pilotez vos deposits capturés, préparez vos remboursements et vérifiez la synchronisation Stripe.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadDeposits}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <Link
            href="/dashboard/deposits"
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Créer un deposit
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-start space-x-3 py-6">
            <div className="rounded-full bg-primary-100 p-2">
              <CreditCard className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Montant capturé</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {renderCurrencyRollup(totalCaptured)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Somme des deposits encore au statut « capturé ».</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start space-x-3 py-6">
            <div className="rounded-full bg-emerald-100 p-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Montant remboursable restant</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {renderCurrencyRollup(totalRefundable)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Somme qui peut encore être remboursée via Stripe.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start space-x-3 py-6">
            <div className="rounded-full bg-gray-100 p-2">
              <Filter className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Deposits remboursés</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{refundedCount}</p>
              <p className="mt-1 text-xs text-gray-500">Nombre de deposits totalement remboursés.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher par invité, logement, description ou Stripe ID"
                className="pl-10"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={propertyFilter} onValueChange={handlePropertyFilterChange}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filtrer par logement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les logements</SelectItem>
                  {propertyOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[220px]">Invité</TableHead>
                  <TableHead>Logement</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Restant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && filteredDeposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                      Chargement des deposits…
                    </TableCell>
                  </TableRow>
                ) : null}

                {!isLoading && filteredDeposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                      Aucun deposit à afficher pour le moment.
                    </TableCell>
                  </TableRow>
                ) : null}

                {filteredDeposits.map((deposit) => {
                  const statusDetail = STATUS_DETAILS[deposit.status] || {
                    label: deposit.status || 'Inconnu',
                    tone: 'bg-gray-100 text-gray-600 border border-gray-200',
                  };

                  const guestName =
                    deposit.guest_name ||
                    [deposit.guest?.first_name, deposit.guest?.last_name].filter(Boolean).join(' ') ||
                    'Invité inconnu';

                  const propertyTitle =
                    deposit.property_title || deposit.property?.title || 'Logement non renseigné';

                  return (
                    <TableRow key={deposit._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span>{guestName}</span>
                          <span className="text-xs text-gray-500">{deposit.guest?.email || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">{propertyTitle}</TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex flex-col space-y-1">
                          <span className="truncate">{deposit.description || '—'}</span>
                          <span className="text-xs text-gray-500">
                            PI: {deposit.stripe_payment_intent_id || '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {formatCurrency(deposit.amount, deposit.currency)}
                      </TableCell>
                      <TableCell className="text-right text-gray-700">
                        {formatCurrency(deposit.refundable_remaining, deposit.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusDetail.tone}>{statusDetail.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(deposit.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-gray-500">
              Page {depositData.page} sur {Math.max(1, depositData.totalPages)} · {depositData.total} deposits
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={isLoading || depositData.page <= 1}
              >
                Précédent
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() =>
                  setPage((current) =>
                    depositData.totalPages ? Math.min(depositData.totalPages, current + 1) : current + 1
                  )
                }
                disabled={
                  isLoading ||
                  depositData.totalPages === 0 ||
                  depositData.page >= depositData.totalPages
                }
              >
                Suivant
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
