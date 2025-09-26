'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, ShieldCheck, Clock, Key } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const DEFAULT_SETTINGS = {
  autoCheckIn: true,
  requireDeposit: true,
  depositAmount: 0,
  cleaningFee: 0,
  accessCode: '',
  checkInTime: '15:00',
  checkOutTime: '11:00'
};

export default function PropertySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(null);

  const propertyId = params?.id;

  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token');

    if (!storedToken) {
      router.replace('/auth/login');
      return;
    }

    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!propertyId || !token) {
      return;
    }

    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);

        const response = await fetch(`/api/properties/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          router.replace('/auth/login');
          return;
        }

        if (!response.ok) {
          const message = response.status === 404
            ? 'Propriété introuvable'
            : 'Impossible de charger la propriété';
          setFetchError(message);
          return;
        }

        const data = await response.json();
        setProperty(data);

        const settings = {
          ...DEFAULT_SETTINGS,
          ...data.settings
        };

        setFormData({
          autoCheckIn: Boolean(settings.autoCheckIn),
          requireDeposit: Boolean(settings.requireDeposit),
          depositAmount: Number(settings.depositAmount ?? 0),
          cleaningFee: Number(settings.cleaningFee ?? 0),
          accessCode: settings.accessCode ?? '',
          checkInTime: settings.checkInTime ?? DEFAULT_SETTINGS.checkInTime,
          checkOutTime: settings.checkOutTime ?? DEFAULT_SETTINGS.checkOutTime
        });
      } catch (err) {
        console.error('Error loading property settings:', err);
        setFetchError('Impossible de charger la propriété');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, router, token]);

  const handleGoBack = () => {
    router.push(property ? `/dashboard/properties/${property.id}` : '/dashboard/properties');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'accessCode' || name === 'checkInTime' || name === 'checkOutTime'
        ? value
        : Number(value)
    }));
  };

  const handleToggle = (event) => {
    const { name, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!propertyId || !token) {
      router.replace('/auth/login');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      setSuccess(false);

      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          settings: {
            ...formData,
            depositAmount: formData.requireDeposit ? formData.depositAmount : 0
          }
        })
      });

      if (response.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setSaveError(errorData?.message || 'Impossible de sauvegarder les paramètres');
        return;
      }

      const updated = await response.json();
      setProperty(updated);
      setSaveError(null);
      setSuccess(true);
    } catch (err) {
      console.error('Error saving property settings:', err);
      setSaveError('Impossible de sauvegarder les paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  return (
   
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </button>
        </div>

        {isLoading ? (
          <div className="card flex h-64 items-center justify-center">
            <div className="loading-spinner" />
          </div>
        ) : fetchError ? (
          <div className="card border-danger-200 bg-danger-50 text-danger-700">
            <p>{fetchError}</p>
          </div>
        ) : property ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <h1 className="text-2xl font-bold text-gray-900">Paramètres de {property.name}</h1>
              <p className="mt-2 text-gray-600">
                Ajustez les paramètres opérationnels de votre propriété.
              </p>
            </div>

            {success && (
              <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-success-700">
                Les paramètres ont été mis à jour avec succès.
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="card space-y-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Horaires d&apos;arrivée et de départ</h2>
                  </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="checkInTime" className="form-label">Heure de check-in</label>
                    <input
                      id="checkInTime"
                      name="checkInTime"
                      type="time"
                      className="form-input"
                      value={formData.checkInTime}
                      onChange={handleInputChange}
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label htmlFor="checkOutTime" className="form-label">Heure de check-out</label>
                    <input
                      id="checkOutTime"
                      name="checkOutTime"
                      type="time"
                      className="form-input"
                      value={formData.checkOutTime}
                      onChange={handleInputChange}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="autoCheckIn"
                    className="form-checkbox"
                    checked={formData.autoCheckIn}
                    onChange={handleToggle}
                    disabled={isSaving}
                  />
                  <span className="text-sm text-gray-700">Activation automatique du check-in</span>
                </label>
              </section>

              <section className="card space-y-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Dépôt et sécurité</h2>
                </div>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="requireDeposit"
                    className="form-checkbox"
                    checked={formData.requireDeposit}
                    onChange={handleToggle}
                    disabled={isSaving}
                  />
                  <span className="text-sm text-gray-700">Exiger un dépôt de garantie</span>
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="depositAmount" className="form-label">Montant du dépôt (€)</label>
                    <input
                      id="depositAmount"
                      name="depositAmount"
                      type="number"
                      min="0"
                      step="10"
                      className="form-input"
                      value={formData.depositAmount}
                      onChange={handleInputChange}
                      disabled={isSaving || !formData.requireDeposit}
                    />
                  </div>

                  <div>
                    <label htmlFor="cleaningFee" className="form-label">Frais de ménage (€)</label>
                    <input
                      id="cleaningFee"
                      name="cleaningFee"
                      type="number"
                      min="0"
                      step="5"
                      className="form-input"
                      value={formData.cleaningFee}
                      onChange={handleInputChange}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </section>

              <section className="card space-y-6 lg:col-span-2">
                <div className="flex items-center gap-3">
                  <Key className="h-6 w-6 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Accès</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="accessCode" className="form-label">Code d&apos;accès</label>
                    <input
                      id="accessCode"
                      name="accessCode"
                      type="text"
                      className="form-input"
                      value={formData.accessCode}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      placeholder="Ex: 458920"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        const newCode = Math.random().toString().slice(-6);
                        setFormData((prev) => ({ ...prev, accessCode: newCode }));
                      }}
                      className="btn-secondary w-full"
                      disabled={isSaving}
                    >
                      Générer un code aléatoire
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {saveError && (
              <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-danger-700">
                {saveError}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary inline-flex items-center"
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
              </button>
            </div>
          </form>
        ) : (
          <div className="card">
            <p className="text-gray-600">Propriété introuvable.</p>
          </div>
        )}
      </div>
    
  );
}

