'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';

export default function NewGuestPage() {
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ajouter un invité</h1>
            <p className="mt-1 text-gray-600">
              Cette page vous permettra bientôt de créer un nouveau profil voyageur et de préparer son check-in.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start space-x-3">
            <div className="rounded-full bg-primary-100 p-2">
              <UserPlus className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Formulaire en cours de développement</h2>
              <p className="mt-2 text-gray-600">
                Nous travaillons sur un formulaire complet pour collecter les informations de vos invités, générer
                des documents et automatiser la communication avant leur arrivée.
              </p>
              <button
                onClick={() => router.push('/guests')}
                className="mt-4 btn-secondary"
              >
                Retour à la liste des invités
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
