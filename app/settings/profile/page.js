'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Camera, CheckCircle2, Info, Mail, Phone, User } from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const defaultFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  bio: ''
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;

      if (!storedToken) {
        router.replace('/auth/login');
        return;
      }

      if (!isMounted) {
        return;
      }

      setAuthToken(storedToken);
      setIsCheckingAuth(false);
      setIsLoading(true);
      setError('');
      setSuccessMessage('');

      try {
        const response = await fetch('/api/profile', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('auth-token');
          router.replace('/auth/login');
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Impossible de charger le profil');
        }

        if (!isMounted) {
          return;
        }

        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.profile?.phone || '',
          jobTitle: data.profile?.jobTitle || '',
          bio: data.profile?.bio || ''
        });
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        console.error('Failed to load profile', fetchError);
        setError(fetchError.message || 'Impossible de charger le profil');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!authToken) {
      router.replace('/auth/login');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          jobTitle: formData.jobTitle,
          bio: formData.bio
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('auth-token');
        router.replace('/auth/login');
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue lors de la mise à jour');
      }

      setFormData({
        firstName: data.firstName || formData.firstName,
        lastName: data.lastName || formData.lastName,
        email: data.email || formData.email,
        phone: data.profile?.phone ?? formData.phone,
        jobTitle: data.profile?.jobTitle ?? formData.jobTitle,
        bio: data.profile?.bio ?? formData.bio
      });
      setSuccessMessage(data.message || 'Profil mis à jour avec succès');
    } catch (submitError) {
      console.error('Failed to update profile', submitError);
      setError(submitError.message || 'Une erreur est survenue lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingAuth || (isLoading && !error)) {
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

        {(error || successMessage) && (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Une erreur est survenue</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="border-success-200 bg-success-50 text-success-700">
                <CheckCircle2 className="h-5 w-5" />
                <AlertTitle>Mise à jour réussie</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
              <p className="text-sm text-gray-600">
                Ces informations sont utilisées sur vos documents et communications clients.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Prénom</Label>
                  <Input
                    id="first-name"
                    placeholder="Alexandre"
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                    disabled={isSaving}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Nom</Label>
                  <Input
                    id="last-name"
                    placeholder="Martin"
                    value={formData.lastName}
                    onChange={handleChange('lastName')}
                    disabled={isSaving}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@monagence.com"
                    value={formData.email}
                    onChange={handleChange('email')}
                    disabled={isSaving}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Input
                  id="role"
                  placeholder="Fondateur"
                  value={formData.jobTitle}
                  onChange={handleChange('jobTitle')}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biographie</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  placeholder="Décrivez votre expertise, votre approche et vos services pour instaurer la confiance."
                  value={formData.bio}
                  onChange={handleChange('bio')}
                  disabled={isSaving}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving} className="flex items-center">
                  {isSaving && <div className="loading-spinner mr-2 h-5 w-5 border-b-2 border-white" />}
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
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
                  <p className="text-sm text-gray-600">
                    {[formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Non renseigné'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{formData.jobTitle || 'Rôle non renseigné'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{formData.email || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Téléphone</p>
                  <p className="text-sm text-gray-600">{formData.phone || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Info className="mt-1 h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Présentation</p>
                  <p className="text-sm text-gray-600">{formData.bio || 'Non renseignée'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
