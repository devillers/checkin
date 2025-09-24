'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Info, Mail, Phone, User } from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProfileSettingsPage() {
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profil</h1>
            <p className="mt-2 text-gray-600">
              Mettez à jour vos informations personnelles et la présentation de votre agence.
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Changer de photo
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
              <p className="text-sm text-gray-600">
                Ces informations sont utilisées sur vos documents et communications clients.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">Prénom</Label>
                <Input id="first-name" placeholder="Alexandre" defaultValue="Alexandre" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Nom</Label>
                <Input id="last-name" placeholder="Martin" defaultValue="Martin" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="contact@monagence.com" defaultValue="contact@monagence.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" placeholder="06 12 34 56 78" defaultValue="06 12 34 56 78" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Input id="role" placeholder="Fondateur" defaultValue="Fondateur" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biographie</Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="Décrivez votre expertise, votre approche et vos services pour instaurer la confiance."
                defaultValue="Expert en conciergerie courte durée depuis 2018, je vous accompagne de A à Z pour optimiser vos revenus locatifs."
              />
            </div>

            <div className="flex justify-end">
              <Button>Enregistrer les modifications</Button>
            </div>
          </div>

          <div className="card space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Coordonnées publiques</h2>
              <p className="text-sm text-gray-600">
                Ces informations sont visibles par vos propriétaires et vos voyageurs.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="mt-1 h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Nom affiché</p>
                  <p className="text-sm text-gray-600">Alexandre Martin</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">contact@monagence.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Téléphone</p>
                  <p className="text-sm text-gray-600">06 12 34 56 78</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Info className="mt-1 h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Présentation</p>
                  <p className="text-sm text-gray-600">
                    Expert en conciergerie, disponible 7j/7 pour accompagner vos voyageurs et maximiser la rentabilité de vos biens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
