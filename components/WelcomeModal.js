'use client';

import { useState } from 'react';
import { X, Shield, CheckCircle, ArrowRight } from 'lucide-react';

export default function WelcomeModal({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Bienvenue sur Checkinly ! 🎉',
      content: 'Vous venez de rejoindre la plateforme de gestion locative la plus complète. Laissez-nous vous présenter les fonctionnalités principales.',
      icon: Shield
    },
    {
      title: 'Créez vos inventaires',
      content: 'Commencez par créer des inventaires détaillés pour chacune de vos propriétés. Ajoutez des photos, notations et commentaires.',
      action: 'Créer un inventaire',
      href: '/dashboard/inventory/new'
    },
    {
      title: 'Gérez vos guests',
      content: 'Ajoutez vos invités, suivez leurs séjours et automatisez le processus de check-in/check-out avec QR codes.',
      action: 'Ajouter un guest',
      href: '/dashboard/guests/new'
    },
    {
      title: 'Configurez Stripe',
      content: 'Connectez votre compte Stripe pour gérer automatiquement les cautions et pré-autorisations.',
      action: 'Configurer Stripe',
      href: '/dashboard/settings'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 relative animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Étape {currentStep + 1} sur {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Passer
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          {currentStepData.icon && (
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <currentStepData.icon className="h-8 w-8 text-primary-600" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {currentStepData.action ? (
            <>
              <a
                href={currentStepData.href}
                className="btn-primary flex-1 flex items-center justify-center"
                onClick={onClose}
              >
                {currentStepData.action}
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
              <button
                onClick={handleNext}
                className="btn-secondary flex-1"
              >
                Plus tard
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleNext}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                {currentStep === steps.length - 1 ? 'Commencer' : 'Suivant'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </>
          )}
        </div>

        {/* Features checklist for first step */}
        {currentStep === 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Ce que vous pouvez faire :
            </h3>
            <div className="space-y-2">
              {[
                'Créer des inventaires détaillés avec photos',
                'Gérer les cautions Stripe automatiquement',
                'Automatiser le check-in/check-out avec QR codes',
                'Suivre vos guests et réservations'
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-success-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}