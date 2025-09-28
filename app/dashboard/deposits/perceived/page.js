//app/dashboard/deposits/perceived/page.js

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  CreditCard,
  Filter,
  Mail,
  MessageCircle,
  MessageSquare,
  Search,
  ShieldCheck
} from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const DEPOSITS = [
  {
    id: 'dep-1',
    guest: {
      firstName: 'Camille',
      lastName: 'Durand'
    },
    propertyName: 'Loft Belleville',
    arrivalDate: '2024-03-18',
    departureDate: '2024-03-23',
    amount: 500,
    currency: '€',
    status: 'holding',
    lastUpdate: '2024-03-11',
    communications: {
      lastHostMessage: '2024-03-10',
      unreadFromGuest: 2,
      lastGuestMessage: '2024-03-11'
    }
  },
  {
    id: 'dep-2',
    guest: {
      firstName: 'Sophie',
      lastName: 'Martin'
    },
    propertyName: 'Appartement Opéra',
    arrivalDate: '2024-04-02',
    departureDate: '2024-04-08',
    amount: 350,
    currency: '€',
    status: 'refund-ready',
    lastUpdate: '2024-03-09',
    communications: {
      lastHostMessage: '2024-03-09',
      unreadFromGuest: 0,
      lastGuestMessage: '2024-03-07'
    }
  },
  {
    id: 'dep-3',
    guest: {
      firstName: 'Lucas',
      lastName: 'Bernard'
    },
    propertyName: 'Villa Sables d’Olonne',
    arrivalDate: '2024-03-28',
    departureDate: '2024-04-04',
    amount: 800,
    currency: '€',
    status: 'holding',
    lastUpdate: '2024-03-12',
    communications: {
      lastHostMessage: '2024-03-12',
      unreadFromGuest: 1,
      lastGuestMessage: '2024-03-12'
    }
  },
  {
    id: 'dep-4',
    guest: {
      firstName: 'Emma',
      lastName: 'Lefèvre'
    },
    propertyName: 'Maison Saint-Malo',
    arrivalDate: '2024-05-15',
    departureDate: '2024-05-20',
    amount: 600,
    currency: '€',
    status: 'scheduled',
    lastUpdate: '2024-03-08',
    communications: {
      lastHostMessage: '2024-03-05',
      unreadFromGuest: 0,
      lastGuestMessage: '2024-03-04'
    }
  },
  {
    id: 'dep-5',
    guest: {
      firstName: 'Nicolas',
      lastName: 'Petit'
    },
    propertyName: 'Chalet Alpin',
    arrivalDate: '2024-03-21',
    departureDate: '2024-03-27',
    amount: 450,
    currency: '€',
    status: 'refund-in-review',
    lastUpdate: '2024-03-15',
    communications: {
      lastHostMessage: '2024-03-15',
      unreadFromGuest: 3,
      lastGuestMessage: '2024-03-15'
    }
  }
];

const STATUS_DETAILS = {
  holding: {
    label: 'En cours de séjour',
    tone: 'bg-blue-50 text-blue-700 border border-blue-100'
  },
  'refund-ready': {
    label: 'Prêt à rembourser',
    tone: 'bg-success-50 text-success-700 border border-success-100'
  },
  'refund-in-review': {
    label: 'Litige en cours',
    tone: 'bg-warning-50 text-warning-700 border border-warning-200'
  },
  scheduled: {
    label: 'Séjour à venir',
    tone: 'bg-gray-100 text-gray-700 border border-gray-200'
  }
};

function formatDate(value) {
  return new Date(value + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export default function PerceivedDepositsPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  const propertyOptions = useMemo(() => {
    const names = Array.from(new Set(DEPOSITS.map((item) => item.propertyName)));
    return names.map((name) => ({ value: name, label: name }));
  }, []);

  const filteredDeposits = useMemo(() => {
    return DEPOSITS.filter((deposit) => {
      const matchesProperty =
        propertyFilter === 'all' || deposit.propertyName === propertyFilter;

      const guestFullName = `${deposit.guest.firstName} ${deposit.guest.lastName}`.toLowerCase();
      const matchesGuest = guestFullName.includes(searchTerm.toLowerCase());

      return matchesProperty && matchesGuest;
    });
  }, [propertyFilter, searchTerm]);

  const metrics = useMemo(() => {
    const totalAmount = filteredDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const today = new Date();
    const upcoming = filteredDeposits.filter(
      (deposit) => new Date(deposit.arrivalDate) > today
    ).length;
    const pendingReviews = filteredDeposits.filter(
      (deposit) => deposit.status === 'refund-in-review'
    ).length;
    const unreadMessages = filteredDeposits.reduce(
      (sum, deposit) => sum + deposit.communications.unreadFromGuest,
      0
    );

    return {
      totalAmount,
      upcoming,
      pendingReviews,
      unreadMessages
    };
  }, [filteredDeposits]);

  if (isCheckingAuth) {
    return (
     
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner" />
        </div>
  
    );
  }

  return (
   
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cautions perçues</h1>
            <p className="mt-1 text-gray-600">
              Centralisez les dépôts reçus, suivez les remboursements et priorisez les actions à mener.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total encaissé</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {metrics.totalAmount.toLocaleString('fr-FR')}€
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Séjours à venir</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{metrics.upcoming}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Litiges à traiter</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{metrics.pendingReviews}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-warning-100 text-warning-700 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Messages non lus</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{metrics.unreadMessages}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="card space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Suivi des cautions perçues</h2>
              <p className="text-sm text-gray-500">
                Filtrez par logement ou par invité pour traiter rapidement les remboursements et relances.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher un guest"
                  className="pl-9"
                />
              </div>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="sm:w-64">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Filtrer par logement" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les logements</SelectItem>
                  {propertyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-gray-200">
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Guest
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Montant
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Logement
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Arrivée
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Statut
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500 text-center">
                    Messages
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-sm text-gray-500">
                      Aucun dépôt ne correspond à vos critères pour le moment.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeposits.map((deposit) => {
                    const statusDetails = STATUS_DETAILS[deposit.status];
                    return (
                      <TableRow key={deposit.id} className="border-gray-200">
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {deposit.guest.firstName} {deposit.guest.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            Séjour du {formatDate(deposit.arrivalDate)} au {formatDate(deposit.departureDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-gray-900">
                            {deposit.amount.toLocaleString('fr-FR')} {deposit.currency}
                          </div>
                          <div className="text-xs text-gray-500">Maj {formatDate(deposit.lastUpdate)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-700">
                            {deposit.propertyName}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {formatDate(deposit.arrivalDate)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusDetails?.tone || 'bg-gray-100 text-gray-700'}>
                            {statusDetails?.label || 'En cours'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-500">
                              <Mail className="h-5 w-5" />
                            </div>
                            <div
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-full border bg-white ${
                                deposit.communications.unreadFromGuest > 0
                                  ? 'border-primary-200 text-primary-600'
                                  : 'border-gray-200 text-gray-400'
                              }`}
                            >
                              <MessageSquare className="h-5 w-5" />
                              {deposit.communications.unreadFromGuest > 0 && (
                                <span className="ml-1 text-xs font-semibold">
                                  {deposit.communications.unreadFromGuest}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end space-x-3 text-gray-400">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white hover:border-primary-200 hover:text-primary-600 transition"
                              aria-label="Envoyer un message"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white hover:border-primary-200 hover:text-primary-600 transition"
                              aria-label="Ouvrir la conversation"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    
  );
}
