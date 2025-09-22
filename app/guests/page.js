'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus } from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';

export default function GuestsPage() {
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invités</h1>
            <p className="mt-1 text-gray-600">
              Centralisez le suivi de vos voyageurs et préparez vos futures intégrations.
            </p>
          </div>
          <button
            onClick={() => router.push('/guests/new')}
            className="mt-4 sm:mt-0 btn-primary flex items-center"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Nouvel invité
          </button>
        </div>

        <div className="card">
          <div className="flex items-start space-x-3">
            <div className="rounded-full bg-primary-100 p-2">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">En construction</h2>
              <p className="mt-2 text-gray-600">
                Le module de gestion des invités sera bientôt disponible. Vous pourrez y inviter vos voyageurs,
                suivre leur statut et préparer leurs check-ins.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                En attendant, continuez d&apos;utiliser vos processus actuels. Nous vous informerons dès que cette
                fonctionnalité sera prête.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
