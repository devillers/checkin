'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  FileText,
  Users,
  CreditCard, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  QrCode,
  Download
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import WelcomeModal from '@/components/WelcomeModal';
import StatsCard from '@/components/StatsCard';
import RecentActivity from '@/components/RecentActivity';
import { cn } from '@/lib/utils';

const QUICK_ACTION_COLOR_CLASSES = {
  primary: {
    button: 'border-primary-200 hover:border-primary-400 hover:bg-primary-50',
    icon: 'text-primary-600'
  },
  success: {
    button: 'border-success-200 hover:border-success-400 hover:bg-success-50',
    icon: 'text-success-600'
  },
  warning: {
    button: 'border-warning-200 hover:border-warning-400 hover:bg-warning-50',
    icon: 'text-warning-600'
  }
};

const getQuickActionColorClasses = (color) =>
  QUICK_ACTION_COLOR_CLASSES[color] ?? QUICK_ACTION_COLOR_CLASSES.primary;

export default function DashboardPage() {
  const [stats, setStats] = useState({
    properties: 0,
    inventories: 0,
    activeGuests: 0,
    pendingDeposits: 0,
    totalRevenue: 0,
    occupancyRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingCheckins, setUpcomingCheckins] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is a new user
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
    }

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (!token) {
      setIsLoading(false);
      router.replace('/login');
      return;
    }

    fetchDashboardData(token);
  }, [router, searchParams]);

  const fetchDashboardData = async (token) => {
    try {
      setIsLoading(true);

      // Fetch all dashboard data in parallel
      const fetchWithAuth = (url) =>
        fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

      const [statsRes, activitiesRes, checkinsRes, tasksRes] = await Promise.all([
        fetchWithAuth('/api/dashboard/stats'),
        fetchWithAuth('/api/dashboard/activities'),
        fetchWithAuth('/api/dashboard/checkins'),
        fetchWithAuth('/api/dashboard/tasks')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setRecentActivities(activitiesData);
      }

      if (checkinsRes.ok) {
        const checkinsData = await checkinsRes.json();
        setUpcomingCheckins(checkinsData);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setPendingTasks(tasksData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-inventory':
        router.push('/inventory/new');
        break;
      case 'new-guest':
        router.push('/guests/new');
        break;
      case 'view-deposits':
        router.push('/deposits');
        break;
      case 'calendar':
        router.push('/calendar');
        break;
      default:
        break;
    }
  };

  const quickActions = [
    {
      id: 'new-inventory',
      title: 'Nouvel inventaire',
      description: 'Créer un nouvel inventaire',
      icon: FileText,
      color: 'primary'
    },
    {
      id: 'new-guest',
      title: 'Nouveau guest',
      description: 'Ajouter un nouvel invité',
      icon: Users,
      color: 'success'
    },
    {
      id: 'view-deposits',
      title: 'Gérer cautions',
      description: 'Voir les cautions en cours',
      icon: CreditCard,
      color: 'warning'
    },
    {
      id: 'calendar',
      title: 'Calendrier',
      description: 'Voir le planning',
      icon: Calendar,
      color: 'primary'
    }
  ];

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
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg text-white p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Bienvenue sur votre dashboard 👋
          </h1>
          <p className="text-primary-100">
            Gérez vos locations courte durée en toute simplicité
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Propriétés"
            value={stats.properties}
            icon={Home}
            color="primary"
            trend="+2 ce mois"
          />
          <StatsCard
            title="Inventaires"
            value={stats.inventories}
            icon={FileText}
            color="success"
            trend="+5 cette semaine"
          />
          <StatsCard
            title="Guests actifs"
            value={stats.activeGuests}
            icon={Users}
            color="warning"
            trend="3 arrivées aujourd'hui"
          />
          <StatsCard
            title="Cautions en attente"
            value={`${stats.pendingDeposits}€`}
            icon={CreditCard}
            color="danger"
            trend="2 à libérer"
          />
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-primary-600" />
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const { button: buttonColorClasses, icon: iconColorClass } =
                getQuickActionColorClasses(action.color);

              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  className={cn(
                    'p-4 rounded-lg border-2 border-dashed transition-all text-left group',
                    buttonColorClasses
                  )}
                >
                  <action.icon
                    className={cn(
                      'h-6 w-6 mb-2 group-hover:scale-110 transition-transform',
                      iconColorClass
                    )}
                  />
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Check-ins */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary-600" />
              Arrivées prochaines
            </h2>
            
            {upcomingCheckins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune arrivée prévue</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingCheckins.slice(0, 5).map((checkin) => (
                  <div key={checkin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{checkin.guestName}</p>
                        <p className="text-sm text-gray-600">{checkin.property}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{checkin.date}</p>
                      <div className="flex items-center space-x-2">
                        <span className={`badge ${checkin.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                          {checkin.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-warning-600" />
              Tâches en attente
            </h2>
            
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Toutes les tâches sont à jour !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className={`flex items-center justify-between p-3 border-l-4 bg-gray-50 rounded-r-lg ${
                    task.priority === 'high' ? 'border-danger-500' : 
                    task.priority === 'medium' ? 'border-warning-500' : 'border-primary-500'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        task.priority === 'high' ? 'bg-danger-100' : 
                        task.priority === 'medium' ? 'bg-warning-100' : 'bg-primary-100'
                      }`}>
                        <Clock className={`h-4 w-4 ${
                          task.priority === 'high' ? 'text-danger-600' : 
                          task.priority === 'medium' ? 'text-warning-600' : 'text-primary-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{task.due}</span>
                      <button className="btn-secondary text-xs">
                        Traiter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity activities={recentActivities} />
      </div>

      {/* Welcome Modal for new users */}
      {showWelcome && (
        <WelcomeModal onClose={() => setShowWelcome(false)} />
      )}
    </DashboardLayout>
  );
}