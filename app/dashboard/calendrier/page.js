'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Clock,
  ShieldCheck,
  Smartphone,
  Mail,
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PROPERTY_CALENDARS } from '@/lib/property-calendar-data';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const RESERVATION_STATUS_STYLES = {
  confirmed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  maintenance: 'bg-sky-100 text-sky-700 border border-sky-200',
  blocked: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isDateWithinRange = (date, start, end) => {
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return current >= start && current <= end;
};

const buildCalendarDays = (month) => {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const startDayOffset = (startOfMonth.getDay() + 6) % 7;
  const startDate = new Date(startOfMonth);
  startDate.setDate(startOfMonth.getDate() - startDayOffset);

  const totalDays = 42;
  const days = [];

  for (let i = 0; i < totalDays; i += 1) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    days.push({
      date: currentDate,
      isCurrentMonth: currentDate.getMonth() === month.getMonth(),
      isToday: isSameDay(currentDate, new Date()),
      isPast: currentDate < new Date(new Date().setHours(0, 0, 0, 0)),
      isFuture: currentDate > endOfMonth,
    });
  }

  return days;
};

const formatDateRange = (startDate, endDate) => {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  });

  return `${formatter.format(startDate)} → ${formatter.format(endDate)}`;
};

const formatFullDate = (date) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

const getReservationStyles = (status) =>
  RESERVATION_STATUS_STYLES[status] ?? RESERVATION_STATUS_STYLES.confirmed;

const ReservationSummary = ({ reservation }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <div className="rounded-lg border bg-muted/10 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Séjour
      </p>
      <p className="mt-1 text-sm font-semibold">
        {formatDateRange(reservation.startDate, reservation.endDate)}
      </p>
      <div className="mt-2 flex items-center space-x-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>
          Check-in {reservation.checkInTime ?? 'à définir'} • Check-out {reservation.checkOutTime ?? 'à définir'}
        </span>
      </div>
    </div>

    <div className="rounded-lg border bg-muted/10 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Statut
      </p>
      <Badge className={cn('mt-1 w-fit capitalize', getReservationStyles(reservation.status))} variant="outline">
        {reservation.status === 'confirmed' && 'Confirmée'}
        {reservation.status === 'pending' && 'En attente'}
        {reservation.status === 'maintenance' && 'Maintenance'}
        {reservation.status === 'blocked' && 'Blocage'}
      </Badge>
      <p className="mt-2 text-xs text-muted-foreground">Origine : {reservation.channel}</p>
    </div>

    <div className="rounded-lg border bg-muted/10 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Suivi administratif
      </p>
      <ul className="mt-2 space-y-1 text-xs">
        <li className={reservation.depositPaid ? 'text-emerald-600' : 'text-amber-600'}>
          • Caution {reservation.depositPaid ? 'encaissée' : 'en attente'}
        </li>
        <li className={reservation.inventorySigned ? 'text-emerald-600' : 'text-amber-600'}>
          • Inventaire {reservation.inventorySigned ? 'signé' : 'non signé'}
        </li>
        <li className={reservation.welcomePack ? 'text-emerald-600' : 'text-muted-foreground'}>
          • Pack d'accueil {reservation.welcomePack ? 'préparé' : 'à prévoir'}
        </li>
      </ul>
    </div>

    <div className="rounded-lg border bg-muted/10 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Contact
      </p>
      <div className="mt-2 space-y-2 text-xs text-muted-foreground">
        {reservation.phone && (
          <p className="flex items-center space-x-2">
            <Smartphone className="h-3.5 w-3.5" />
            <span>{reservation.phone}</span>
          </p>
        )}
        {reservation.email && (
          <p className="flex items-center space-x-2">
            <Mail className="h-3.5 w-3.5" />
            <span>{reservation.email}</span>
          </p>
        )}
      </div>
    </div>
  </div>
);

const PropertyCalendar = ({ property, month, onReservationClick }) => {
  const calendarDays = useMemo(() => buildCalendarDays(month), [month]);

  const reservationsWithDates = useMemo(
    () =>
      property.reservations.map((reservation) => ({
        ...reservation,
        startDate: new Date(reservation.startDate),
        endDate: new Date(reservation.endDate),
      })),
    [property.reservations],
  );

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="relative h-48 w-full">
          <Image
            src={property.image}
            alt={property.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={false}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 text-white">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{property.name}</h2>
                <p className="flex items-center text-sm text-gray-200">
                  <MapPin className="mr-2 h-4 w-4" />
                  {property.location}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide">
                <Badge className="bg-white/90 text-gray-900" variant="outline">
                  Taux d'occupation {property.occupancyRate}%
                </Badge>
                <Badge className="bg-white/90 text-gray-900" variant="outline">
                  Ménage : {property.housekeepingPartner}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Cliquer sur une réservation pour afficher la fiche guest</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmée
              </span>
              <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 font-medium text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> En attente
              </span>
              <span className="flex items-center gap-1 rounded-full border border-sky-200 bg-sky-100 px-2.5 py-0.5 font-medium text-sky-700">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Maintenance
              </span>
              <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-slate-500" /> Blocage
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px rounded-xl bg-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="bg-white px-3 py-2 text-center">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-slate-200">
            {calendarDays.map(({ date, isCurrentMonth, isToday }) => {
              const dayReservations = reservationsWithDates.filter((reservation) =>
                isDateWithinRange(date, reservation.startDate, reservation.endDate),
              );

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    'min-h-[110px] bg-white p-2 transition-colors',
                    !isCurrentMonth && 'bg-slate-50 text-slate-300',
                    isToday && 'border-2 border-primary/60',
                  )}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className={cn('text-sm', !isCurrentMonth && 'text-slate-300')}>{date.getDate()}</span>
                    {isToday && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Aujourd'hui</span>}
                  </div>

                  <div className="mt-1 space-y-1">
                    {dayReservations.slice(0, 3).map((reservation) => (
                      <button
                        key={reservation.id}
                        type="button"
                        onClick={() => onReservationClick(reservation, property)}
                        className={cn(
                          'group flex w-full items-center justify-between rounded-md border px-2 py-1 text-left text-[11px] font-medium transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40',
                          getReservationStyles(reservation.status),
                        )}
                      >
                        <span className="truncate">{reservation.guestName}</span>
                        <span className="ml-2 flex items-center text-[10px] font-normal opacity-75">
                          <Clock className="mr-1 h-3 w-3" />
                          {reservation.checkInTime ?? '—'}
                        </span>
                      </button>
                    ))}
                    {dayReservations.length > 3 && (
                      <div className="text-[10px] text-slate-500">
                        +{dayReservations.length - 3} autres réservations
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DashboardCalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [activeProperty, setActiveProperty] = useState(PROPERTY_CALENDARS[0]?.id ?? '');

  useEffect(() => {
    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    const propertyFromQuery = searchParams.get('property');
    const monthFromQuery = searchParams.get('month');

    if (propertyFromQuery && PROPERTY_CALENDARS.some((property) => property.id === propertyFromQuery)) {
      setActiveProperty(propertyFromQuery);
    }

    if (monthFromQuery) {
      const [year, month] = monthFromQuery.split('-').map(Number);
      if (!Number.isNaN(year) && !Number.isNaN(month)) {
        const parsedDate = new Date(year, month - 1, 1);
        if (!Number.isNaN(parsedDate.getTime())) {
          setCurrentMonth(parsedDate);
        }
      }
    }
  }, [searchParams]);

  const handleMonthChange = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const handleReservationClick = (reservation, property) => {
    setSelectedReservation({ reservation, property });
  };

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const activePropertyData = PROPERTY_CALENDARS.find((property) => property.id === activeProperty);

  if (isCheckingAuth) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
              Vue calendrier
            </p>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Planning des réservations
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Visualisez l'occupation de vos logements, anticipez les arrivées et suivez en un clin d'œil les
              informations clés de vos guests.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
            <button
              type="button"
              onClick={() => handleMonthChange(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Mois</p>
              <p className="text-sm font-semibold text-gray-900">
                {monthFormatter.format(currentMonth)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleMonthChange(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50"
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Tabs value={activeProperty} onValueChange={setActiveProperty} className="space-y-6">
          <TabsList className="w-full justify-start gap-2 overflow-x-auto rounded-2xl border bg-white p-2 shadow-sm">
            {PROPERTY_CALENDARS.map((property) => (
              <TabsTrigger
                key={property.id}
                value={property.id}
                className="flex items-center gap-2 rounded-xl border border-transparent px-4 py-2 text-sm font-medium text-slate-600 transition data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <CalendarIcon className="h-4 w-4" />
                {property.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {PROPERTY_CALENDARS.map((property) => (
            <TabsContent key={property.id} value={property.id} className="focus:outline-none">
              <PropertyCalendar
                property={property}
                month={currentMonth}
                onReservationClick={handleReservationClick}
              />
            </TabsContent>
          ))}
        </Tabs>

        <Dialog
          open={Boolean(selectedReservation)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedReservation(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            {selectedReservation && (
              <>
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-2xl font-semibold">
                    {selectedReservation.reservation.guestName}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedReservation.property.name} • {formatDateRange(
                      selectedReservation.reservation.startDate,
                      selectedReservation.reservation.endDate,
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border">
                        {selectedReservation.reservation.guestAvatar ? (
                          <AvatarImage src={selectedReservation.reservation.guestAvatar} alt={selectedReservation.reservation.guestName} />
                        ) : (
                          <AvatarFallback>
                            {selectedReservation.reservation.guestName
                              .split(' ')
                              .map((part) => part[0])
                              .join('')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {selectedReservation.reservation.channel}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          {selectedReservation.reservation.guests} voyageurs
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Arrivée {formatFullDate(selectedReservation.reservation.startDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-xs">
                      <Badge className={getReservationStyles(selectedReservation.reservation.status)} variant="outline">
                        {selectedReservation.reservation.status === 'confirmed' && 'Séjour confirmé'}
                        {selectedReservation.reservation.status === 'pending' && 'Action requise'}
                        {selectedReservation.reservation.status === 'maintenance' && 'Bloc planning'}
                        {selectedReservation.reservation.status === 'blocked' && 'Bloc propriétaire'}
                      </Badge>
                      <p className="text-muted-foreground">Responsable ménage : {selectedReservation.property.housekeepingPartner}</p>
                    </div>
                  </div>

                  <ReservationSummary reservation={selectedReservation.reservation} />

                  {selectedReservation.reservation.notes && (
                    <div className="rounded-xl border bg-muted/10 p-4 text-sm text-muted-foreground">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Notes opérationnelles
                      </p>
                      <p className="mt-2 text-sm text-gray-700">
                        {selectedReservation.reservation.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
