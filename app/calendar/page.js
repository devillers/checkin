'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CalendarClock } from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';

export default function CalendarPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  if (isCheckingAuth) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendrier</h1>
            <p className="mt-1 text-gray-600">
              Visualisez vos check-ins, check-outs et interventions planifiées au même endroit.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start space-x-3">
            <div className="rounded-full bg-primary-100 p-2">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Planning interactif en préparation</h2>
              <p className="mt-2 text-gray-600">
                Vous pourrez bientôt synchroniser vos réservations, suivre vos équipes terrain et automatiser les
                rappels liés à vos états des lieux.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Les intégrations iCal et les connexions avec vos OTA seront ajoutées dans une prochaine mise à jour.
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gray-900 text-white">
          <div className="flex items-start space-x-3">
            <CalendarClock className="h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Restez informé</h3>
              <p className="mt-1 text-sm text-gray-100">
                Activez les notifications pour être alerté dès que le planning sera disponible et profiter des tests
                bêta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
