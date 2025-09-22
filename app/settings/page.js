'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Shield, Bell, Users } from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paramètres</h1>
            <p className="mt-1 text-gray-600">
              Configurez votre compte, votre équipe et vos préférences d&apos;application.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-primary-100 p-2">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sécurité</h2>
                <p className="mt-2 text-gray-600">
                  Gérez l&apos;accès à votre compte, configurez la double authentification et contrôlez les sessions
                  actives.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-primary-100 p-2">
                <Bell className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <p className="mt-2 text-gray-600">
                  Personnalisez les alertes email et push pour suivre les événements importants de vos locations.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-primary-100 p-2">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Équipe</h2>
                <p className="mt-2 text-gray-600">
                  Invitez des collaborateurs, attribuez des rôles et gérez leurs permissions.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-primary-100 p-2">
                <Settings className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Personnalisation</h2>
                <p className="mt-2 text-gray-600">
                  Configurez vos modèles d&apos;emails, vos documents PDF et vos intégrations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-primary-50 border-primary-100 text-primary-700">
          <h3 className="font-semibold">Bientôt disponible</h3>
          <p className="mt-2 text-sm">
            Nous mettons la touche finale à cette section pour vous offrir un contrôle total sur votre compte et vos
            automatisations.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
