'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Mail, Send, ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (event) => {
    setEmail(event.target.value);

    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with API call when endpoint is available
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setIsSuccess(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrors({ submit: "Impossible d'envoyer l'email de réinitialisation" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Shield className="h-10 w-10 text-primary-600" />
            <span className="text-3xl font-bold gradient-text">Checkinly</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-600">
            Saisissez votre adresse email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <div className="card">
          {isSuccess ? (
            <div className="space-y-6 text-center">
              <CheckCircle className="h-12 w-12 text-success-500 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Email envoyé !</h2>
                <p className="text-gray-600">
                  Si un compte existe pour <span className="font-medium text-gray-900">{email}</span>, vous recevrez un message contenant les instructions pour réinitialiser votre mot de passe.
                </p>
              </div>
              <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-left space-y-3">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pensez à vérifier vos spams</p>
                    <p className="text-sm text-gray-600">L'email peut mettre quelques minutes à arriver. N'hésitez pas à vérifier votre dossier courrier indésirable.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Link href="/auth/login" className="btn-primary w-full py-3 inline-flex items-center justify-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Retour à la connexion</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                  className="w-full text-sm text-primary-600 hover:text-primary-500"
                >
                  Utiliser une autre adresse email
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {errors.submit && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0" />
                  <span className="text-danger-700 text-sm">{errors.submit}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="form-label">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`form-input ${errors.email ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''}`}
                  placeholder="votre@email.com"
                  value={email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-danger-600">{errors.email}</p>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-sm text-gray-600">
                <p className="font-medium text-gray-900">Comment ça marche ?</p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-start space-x-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary-500"></span>
                    <span>Nous vous envoyons un email sécurisé avec un lien valable 30 minutes.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary-500"></span>
                    <span>Cliquez sur ce lien pour choisir un nouveau mot de passe.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary-500"></span>
                    <span>Reconnectez-vous avec votre nouveau mot de passe.</span>
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 inline-flex items-center justify-center space-x-2 text-base"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Envoyer le lien de réinitialisation</span>
                  </>
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                <Link href="/auth/login" className="text-primary-600 hover:text-primary-500">
                  <ArrowLeft className="h-4 w-4 inline mr-1" /> Retour à la page de connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
