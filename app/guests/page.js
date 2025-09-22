'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import DashboardLayout from '@/components/DashboardLayout';

export default function GuestsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    router.replace('/dashboard/guests');
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    </DashboardLayout>
  );
}
