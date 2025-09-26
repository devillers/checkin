'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CreditCard, ShieldCheck } from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';

export default function DepositsPage() {
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
     
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
    
    );
  }

  return (
    
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cautions</h1>
            <p className="mt-1 text-gray-600">
              Suivez vos dépôts de garantie et préparez vos futurs remboursements.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link
            href="dashboard/deposits/perceived"
            className="card group p-5 flex flex-col justify-between hover:border-primary-200 transition"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-primary-100 p-2">
                <CreditCard className="h-6 w-6 text-primary-600" />
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-900">Cautions perçues</h2>
              <p className="mt-2 text-gray-600 text-sm">
                Accédez au tableau de bord des dépôts encaissés, filtrez par logement ou invité et suivez les
                remboursements prioritaires.
              </p>
            </div>
          </Link>

          <div className="card">
            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-primary-100 p-2">
                <CreditCard className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gestion des cautions à venir</h2>
                <p className="mt-2 text-gray-600">
                  Ce tableau de bord vous permettra bientôt de suivre les paiements, réclamations et remboursements
                  liés aux cautions de vos locations.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Les intégrations Stripe et les rappels automatiques sont en cours de finalisation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-primary-50 border-primary-100 text-primary-700">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Sécurisez vos cautions avec Checkinly</h3>
              <p className="mt-1 text-sm">
                Bientôt, vous pourrez déclencher des paiements sécurisés, automatiser les relances et suivre les
                litiges directement depuis cette interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    
  );
}
