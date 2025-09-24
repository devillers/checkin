'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  Globe,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users
} from 'lucide-react';

import StatsCard from '@/components/StatsCard';
import { cn } from '@/lib/utils';

const DEFAULT_DATA = {
  lastUpdated: "Actualisé il y a 4 minutes",
  metrics: [
    {
      id: 'active-accounts',
      title: 'Comptes actifs',
      value: '1 287',
      icon: Users,
      color: 'primary',
      trend: '+8,2% vs mois dernier',
      trendDirection: 'up'
    },
    {
      id: 'properties',
      title: 'Propriétés listées',
      value: '4 652',
      icon: Building2,
      color: 'success',
      trend: '+312 nouvelles',
      trendDirection: 'up'
    },
    {
      id: 'mrr',
      title: 'Revenus récurrents (MRR)',
      value: '128 400 €',
      icon: CreditCard,
      color: 'warning',
      trend: '+12,4% vs 2023',
      trendDirection: 'up'
    },
    {
      id: 'occupancy',
      title: 'Taux occupation moyen',
      value: '87%',
      icon: TrendingUp,
      color: 'primary',
      trend: '-1,1 pts',
      trendDirection: 'down'
    },
    {
      id: 'integrations',
      title: 'Intégrations actives',
      value: '18',
      icon: Globe,
      color: 'success',
      trend: '+3 lancées',
      trendDirection: 'up'
    },
    {
      id: 'satisfaction',
      title: 'Satisfaction clients (CSAT)',
      value: '94%',
      icon: Sparkles,
      color: 'warning',
      trend: '+2 pts NPS',
      trendDirection: 'up'
    }
  ],
  quickActions: [
    {
      id: 'billing',
      title: 'Suivre la facturation',
      description: 'Vérifiez la santé financière et les encaissements.',
      icon: CreditCard,
      tone: 'primary'
    },
    {
      id: 'growth',
      title: 'Analyser la croissance',
      description: 'Consultez les performances des propriétaires engagés.',
      icon: BarChart3,
      tone: 'success'
    },
    {
      id: 'support',
      title: 'Superviser le support',
      description: 'Pilotez les priorités de tickets et la satisfaction.',
      icon: LifeBuoy,
      tone: 'warning'
    },
    {
      id: 'onboarding',
      title: 'Optimiser l’onboarding',
      description: 'Planifiez les étapes pour les nouveaux comptes premium.',
      icon: UserPlus,
      tone: 'primary'
    }
  ],
  platformHealth: {
    status: 'Stable',
    uptime: '99,98%',
    incidentsThisMonth: 1,
    responseTime: '320 ms',
    deploymentFrequency: '5 déploiements / semaine'
  },
  monthlyGrowth: [
    { month: 'Mai', revenue: 42000, owners: 24, properties: 45 },
    { month: 'Juin', revenue: 46800, owners: 28, properties: 52 },
    { month: 'Juil.', revenue: 50200, owners: 31, properties: 58 },
    { month: 'Août', revenue: 51750, owners: 32, properties: 61 },
    { month: 'Sept.', revenue: 54200, owners: 36, properties: 68 }
  ],
  activity: [
    {
      id: 'act-1',
      title: 'Partenariat OTA validé',
      description: 'Contrat signé avec Booking.com pour l’API disponibilité temps réel.',
      date: 'Il y a 2 heures',
      status: 'En production',
      type: 'integration'
    },
    {
      id: 'act-2',
      title: 'Campagne de rétention',
      description: 'Nouveau scénario d’emails automatisés lancé sur les comptes inactifs.',
      date: 'Hier',
      status: 'Lancé',
      type: 'growth'
    },
    {
      id: 'act-3',
      title: 'Migration infra terminée',
      description: 'Passage complet sur la région eu-west-3 pour réduire la latence.',
      date: 'Lundi',
      status: 'Succès',
      type: 'platform'
    }
  ],
  support: {
    openTickets: 12,
    criticalTickets: 2,
    satisfaction: 94,
    tickets: [
      {
        id: 'SUP-482',
        subject: 'Sync Airbnb bloquée',
        account: 'Hostify Paris',
        priority: 'Haute',
        status: 'En cours',
        updated: 'Il y a 20 min'
      },
      {
        id: 'SUP-476',
        subject: 'Erreur check-in digital',
        account: 'UrbanStay',
        priority: 'Moyenne',
        status: 'Investig.',
        updated: 'Il y a 3 h'
      },
      {
        id: 'SUP-471',
        subject: 'Facture annuelle manquante',
        account: 'CosyBnB',
        priority: 'Basse',
        status: 'Résolu',
        updated: 'Hier'
      }
    ]
  },
  topOwners: [
    {
      id: 'owner-1',
      name: 'Hélène Martin',
      company: 'Paris Premium Stays',
      properties: 18,
      occupancy: '89%',
      revenue: '72 400 €',
      trend: '+12%'
    },
    {
      id: 'owner-2',
      name: 'Samuel Perez',
      company: 'Barcelona Homes',
      properties: 25,
      occupancy: '92%',
      revenue: '88 900 €',
      trend: '+18%'
    },
    {
      id: 'owner-3',
      name: 'Laura Nguyen',
      company: 'Nice Riviera Rentals',
      properties: 14,
      occupancy: '85%',
      revenue: '55 100 €',
      trend: '+9%'
    }
  ],
  roadmap: [
    {
      id: 'roadmap-1',
      title: 'Module fidélisation voyageurs',
      quarter: 'T4 2024',
      owner: 'Produit',
      progress: 70,
      status: 'On track',
      description: 'Programme de points et avantages automatiques pour les voyageurs récurrents.'
    },
    {
      id: 'roadmap-2',
      title: 'Centre de formation propriétaire',
      quarter: 'T1 2025',
      owner: 'Success',
      progress: 45,
      status: 'En préparation',
      description: 'Bibliothèque de parcours interactifs et certification partenaire.'
    },
    {
      id: 'roadmap-3',
      title: 'Marketplace prestataires locaux',
      quarter: 'T2 2025',
      owner: 'Ops',
      progress: 25,
      status: 'Discovery',
      description: 'Référencement et mise en relation avec des conciergeries et sociétés de ménage.'
    }
  ],
  expansion: {
    markets: [
      { id: 'market-1', name: 'Espagne', status: 'Live', properties: 340 },
      { id: 'market-2', name: 'Italie', status: 'Beta', properties: 120 },
      { id: 'market-3', name: 'Portugal', status: 'En cours', properties: 65 }
    ],
    pipeline: [
      { id: 'pipeline-1', label: 'Partenaires en discussion', value: 12 },
      { id: 'pipeline-2', label: 'Accords signés', value: 5 },
      { id: 'pipeline-3', label: 'Formations planifiées', value: 9 }
    ]
  }
};

const QUICK_ACTION_STYLES = {
  primary: {
    container: 'border-primary-200 hover:border-primary-400 hover:bg-primary-50',
    icon: 'text-primary-600'
  },
  success: {
    container: 'border-success-200 hover:border-success-400 hover:bg-success-50',
    icon: 'text-success-600'
  },
  warning: {
    container: 'border-warning-200 hover:border-warning-400 hover:bg-warning-50',
    icon: 'text-warning-600'
  }
};

const STATUS_BADGE_STYLES = {
  Stable: 'bg-success-100 text-success-700',
  "En préparation": 'bg-warning-100 text-warning-700',
  Discovery: 'bg-primary-100 text-primary-700',
  "On track": 'bg-success-100 text-success-700'
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [authState, setAuthState] = useState({ checked: false, authorized: false });
  const [data, setData] = useState(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem('auth-token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      setAuthState({ checked: true, authorized: false });
      router.replace('/auth/login');
      return;
    }

    const parsedUser = (() => {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Impossible de lire les informations utilisateur:', error);
        return null;
      }
    })();

    if (!parsedUser || parsedUser.role !== 'superadmin') {
      setAuthState({ checked: true, authorized: false });
      router.replace('/dashboard');
      return;
    }

    setAuthState({ checked: true, authorized: true });

    const fetchOverview = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/super-admin/overview', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const payload = await response.json();
          setData((previous) => {
            const mergeCollectionsById = (defaults, updates) => {
              if (!Array.isArray(updates)) {
                return defaults;
              }

              const defaultMap = new Map((defaults || []).map((item) => [item.id, item]));

              return updates.map((item) => {
                const base = defaultMap.get(item.id) || {};
                return { ...base, ...item };
              });
            };

            return {
              ...previous,
              ...payload,
              metrics: mergeCollectionsById(previous.metrics, payload.metrics),
              quickActions: mergeCollectionsById(previous.quickActions, payload.quickActions),
              platformHealth: payload.platformHealth
                ? { ...previous.platformHealth, ...payload.platformHealth }
                : previous.platformHealth,
              monthlyGrowth: Array.isArray(payload.monthlyGrowth)
                ? payload.monthlyGrowth
                : previous.monthlyGrowth,
              activity: Array.isArray(payload.activity) ? payload.activity : previous.activity,
              support: payload.support
                ? {
                    ...previous.support,
                    ...payload.support,
                    tickets: Array.isArray(payload.support.tickets)
                      ? payload.support.tickets
                      : previous.support.tickets
                  }
                : previous.support,
              topOwners: Array.isArray(payload.topOwners)
                ? payload.topOwners
                : previous.topOwners,
              roadmap: Array.isArray(payload.roadmap) ? payload.roadmap : previous.roadmap,
              expansion: payload.expansion
                ? {
                    ...previous.expansion,
                    ...payload.expansion,
                    markets: Array.isArray(payload.expansion.markets)
                      ? payload.expansion.markets
                      : previous.expansion.markets,
                    pipeline: Array.isArray(payload.expansion.pipeline)
                      ? payload.expansion.pipeline
                      : previous.expansion.pipeline
                  }
                : previous.expansion
            };
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données super admin:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, [router]);

  const maxRevenue = useMemo(() => {
    if (!data.monthlyGrowth || data.monthlyGrowth.length === 0) {
      return 0;
    }

    return Math.max(...data.monthlyGrowth.map((item) => item.revenue));
  }, [data.monthlyGrowth]);

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'billing':
        router.push('/settings');
        break;
      case 'growth':
        router.push('/dashboard');
        break;
      case 'support':
        router.push('/settings');
        break;
      case 'onboarding':
        router.push('/dashboard/properties');
        break;
      default:
        break;
    }
  };

  if (!authState.checked) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse h-40" />
        <div className="card animate-pulse h-40" />
      </div>
    );
  }

  if (!authState.authorized) {
    return (
      <div className="card">
        <div className="p-6">
          <p className="text-gray-600">Redirection en cours…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pilotage global</h1>
            <p className="text-gray-600 max-w-2xl">
              Visualisez les indicateurs clés de la plateforme Checkinly, gérez la croissance et assurez la
              meilleure expérience possible pour vos propriétaires partenaires.
            </p>
          </div>
          <div className="self-start rounded-full bg-primary-50 text-primary-700 px-4 py-2 text-sm font-medium">
            {isLoading ? 'Mise à jour des données…' : data.lastUpdated}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.metrics.map((metric) => (
            <StatsCard key={metric.id} {...metric} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 card">
            <div className="p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
                  <p className="text-sm text-gray-500">
                    Anticipez les besoins des propriétaires et gardez un temps d'avance sur la croissance.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.quickActions.map((action) => {
                  const tone = QUICK_ACTION_STYLES[action.tone] ?? QUICK_ACTION_STYLES.primary;

                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleQuickAction(action.id)}
                      className={cn(
                        'border rounded-xl px-4 py-4 flex items-start gap-4 text-left transition-all duration-200 hover:-translate-y-0.5',
                        tone.container
                      )}
                    >
                      <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-sm', tone.icon)}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">{action.title}</p>
                            <p className="text-sm text-gray-500">{action.description}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Santé de la plateforme</h2>
                  <p className="text-sm text-gray-500">
                    Suivi automatisé des principaux indicateurs de disponibilité et de fiabilité.
                  </p>
                </div>
                <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', STATUS_BADGE_STYLES[data.platformHealth.status] ?? 'bg-primary-100 text-primary-700')}>
                  {data.platformHealth.status}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Disponibilité</span>
                  <span className="font-semibold text-gray-900">{data.platformHealth.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Incidents ce mois-ci</span>
                  <span className="font-semibold text-gray-900">{data.platformHealth.incidentsThisMonth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Temps de réponse moyen</span>
                  <span className="font-semibold text-gray-900">{data.platformHealth.responseTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fréquence de déploiement</span>
                  <span className="font-semibold text-gray-900">{data.platformHealth.deploymentFrequency}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="card xl:col-span-2">
            <div className="p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Croissance mensuelle</h2>
                  <p className="text-sm text-gray-500">
                    Revenus récurrents, nouveaux propriétaires et propriétés actives sur les 5 derniers mois.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-5 gap-4 items-end">
                {data.monthlyGrowth.map((item) => {
                  const barHeight = maxRevenue > 0 ? Math.max(16, Math.round((item.revenue / maxRevenue) * 160)) : 16;

                  return (
                    <div key={item.month} className="flex flex-col items-center gap-3">
                      <div className="w-full rounded-t-lg bg-gradient-to-t from-primary-100 via-primary-200 to-primary-400 flex flex-col justify-end" style={{ height: `${barHeight}px` }}>
                        <span className="text-xs font-semibold text-primary-900 px-2 py-2 text-center">{item.revenue.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="text-xs text-gray-500 text-center space-y-1">
                        <p className="font-semibold text-gray-900">{item.month}</p>
                        <p>{item.owners} nouveaux propriétaires</p>
                        <p>{item.properties} propriétés actives</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Activités stratégiques</h2>
                <p className="text-sm text-gray-500">Dernières initiatives clés pilotées par vos équipes.</p>
              </div>
              <div className="space-y-4">
                {data.activity.map((activity) => (
                  <div key={activity.id} className="relative border-l border-gray-200 pl-6">
                    <span className="absolute left-0 top-1.5 -translate-x-1/2 h-3 w-3 rounded-full bg-primary-500" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                      </div>
                      <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{activity.date}</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                      <Activity className="h-3.5 w-3.5" />
                      {activity.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="card xl:col-span-2">
            <div className="p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Support & satisfaction</h2>
                  <p className="text-sm text-gray-500">Pilotage des tickets prioritaires et qualité de service.</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500 tracking-wide">Tickets ouverts</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{data.support.openTickets}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500 tracking-wide">Priorité critique</p>
                  <p className="mt-2 text-2xl font-semibold text-danger-600">{data.support.criticalTickets}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500 tracking-wide">CSAT</p>
                  <p className="mt-2 text-2xl font-semibold text-success-600">{data.support.satisfaction}%</p>
                </div>
              </div>

              <div className="mt-6 -mx-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide text-xs">Ticket</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide text-xs">Compte</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide text-xs">Priorité</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide text-xs">Statut</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wide text-xs">Maj</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {data.support.tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{ticket.id}</td>
                        <td className="px-4 py-3 text-gray-600">{ticket.account}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                              ticket.priority === 'Haute'
                                ? 'bg-danger-100 text-danger-700'
                                : ticket.priority === 'Moyenne'
                                  ? 'bg-warning-100 text-warning-700'
                                  : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{ticket.status}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{ticket.updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Top propriétaires</h2>
                <p className="text-sm text-gray-500">Partenaires générant le plus de valeur ce trimestre.</p>
              </div>
              <div className="space-y-4">
                {data.topOwners.map((owner) => (
                  <div key={owner.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{owner.name}</p>
                        <p className="text-sm text-gray-500">{owner.company}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {owner.trend}
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-500">
                      <div>
                        <dt>Propriétés</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900">{owner.properties}</dd>
                      </div>
                      <div>
                        <dt>Occupation</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900">{owner.occupancy}</dd>
                      </div>
                      <div>
                        <dt>Revenus</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900">{owner.revenue}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="card xl:col-span-2">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Feuille de route produits</h2>
                <p className="text-sm text-gray-500">Les chantiers stratégiques à suivre pour les prochains trimestres.</p>
              </div>
              <div className="space-y-4">
                {data.roadmap.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <div className="text-sm text-gray-500 text-right">
                        <p>{item.quarter}</p>
                        <p>{item.owner}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Progression</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className={cn(
                      'mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                      STATUS_BADGE_STYLES[item.status] ?? 'bg-primary-50 text-primary-700'
                    )}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Expansion & marchés</h2>
                <p className="text-sm text-gray-500">Suivi des nouvelles zones géographiques et de la pipeline.</p>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Marchés actifs</p>
                    <Globe className="h-4 w-4 text-primary-500" />
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-gray-500">
                    {data.expansion.markets.map((market) => (
                      <li key={market.id} className="flex items-center justify-between">
                        <span>{market.name}</span>
                        <span className="font-semibold text-gray-900">{market.properties} propriétés ({market.status})</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Pipeline équipes Success</p>
                    <ShieldCheck className="h-4 w-4 text-success-500" />
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-gray-500">
                    {data.expansion.pipeline.map((item) => (
                      <li key={item.id} className="flex items-center justify-between">
                        <span>{item.label}</span>
                        <span className="font-semibold text-gray-900">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/50 p-4">
                  <div className="flex items-center gap-3">
                    <CalendarRange className="h-5 w-5 text-primary-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Prochain comité stratégique</p>
                      <p className="text-sm text-gray-600">12 novembre · Focus croissance Espagne & upsell premium.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
  );
}
