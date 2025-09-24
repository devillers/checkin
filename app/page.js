'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  CreditCard,
  QrCode, 
  FileText, 
  Users,
  ArrowRight,
  Star,
  CheckCircle,
  Globe,
  Zap,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const features = [
    {
      icon: FileText,
      title: 'Inventaires intelligents',
      description: 'Créez des inventaires détaillés par pièce avec photos et système de notation 1-5.'
    },
    {
      icon: CreditCard,
      title: 'Cautions Stripe automatisées',
      description: 'Pré-autorisations sans débit immédiat, libération automatique après 48h.'
    },
    {
      icon: QrCode,
      title: 'Check-in/out avec QR codes',
      description: 'Processus automatisé avec codes QR pour inventaires d\'entrée et sortie.'
    },
    {
      icon: Users,
      title: 'Gestion des guests',
      description: 'Suivi complet des séjours avec codes d\'accès et notifications automatiques.'
    },
    {
      icon: Smartphone,
      title: 'PWA Mobile-First',
      description: 'Application installable, fonctionnement hors-ligne et synchronisation.'
    },
    {
      icon: Globe,
      title: 'Multi-langue FR/EN',
      description: 'Interface complètement traduite pour vos guests internationaux.'
    }
  ];

  const testimonials = [
    {
      name: 'Marie Laurent',
      role: 'Propriétaire Airbnb Plus',
      content: 'Checkinly a révolutionné ma gestion locative. Les cautions automatisées me font gagner un temps précieux.',
      rating: 5
    },
    {
      name: 'Thomas Martin',
      role: 'Gestionnaire immobilier',
      content: 'L\'automatisation du check-in avec QR codes impressionne mes clients. Outil indispensable !',
      rating: 5
    },
    {
      name: 'Sophie Dubois',
      role: 'Investisseuse immobilière',
      content: 'Interface intuitive, fonctionnalités complètes. Mes 8 logements sont parfaitement gérés.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="safe-top">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold gradient-text">Checkinly</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/fonctionnalites" className="text-gray-600 hover:text-primary-600 transition-colors">
                Fonctionnalités
              </Link>
              <Link href="/tarifs" className="text-gray-600 hover:text-primary-600 transition-colors">
                Tarifs
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-primary-600 transition-colors">
                Contact
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-primary-600 transition-colors">
                Témoignages
              </Link>
              <Link href="/auth/login" className="btn-secondary">
                Connexion
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Essai gratuit
              </Link>
            </div>
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-md p-2 text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-nav"
                aria-label="Ouvrir le menu principal"
              >
                {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </nav>
        <div
          id="mobile-nav"
          className={`md:hidden border-t border-gray-200 bg-white shadow-lg transition-all duration-300 ${
            isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 overflow-hidden opacity-0'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
            <Link
              href="/fonctionnalites"
              className="block text-gray-700 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Fonctionnalités
            </Link>
            <Link
              href="/tarifs"
              className="block text-gray-700 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Tarifs
            </Link>
            <Link
              href="/contact"
              className="block text-gray-700 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="#testimonials"
              className="block text-gray-700 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Témoignages
            </Link>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/auth/login"
                className="btn-secondary text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className="btn-primary text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 text-balance">
          Gérez vos locations
          <span className="gradient-text block">courte durée</span>
          en toute simplicité
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto text-balance">
          PWA complète pour automatiser vos inventaires, cautions Stripe et processus de check-in/check-out 
          avec QR codes. Parfait pour Airbnb et locations saisonnières.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/auth/register" className="btn-primary text-lg px-8 py-4 group">
            Commencer gratuitement
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/demo" className="btn-secondary text-lg px-8 py-4">
            Voir la démo
          </Link>
        </div>
        
        {/* Hero Image/Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">500+</div>
            <div className="text-sm text-gray-600">Propriétaires actifs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">10k+</div>
            <div className="text-sm text-gray-600">Inventaires créés</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">98%</div>
            <div className="text-sm text-gray-600">Satisfaction client</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">24/7</div>
            <div className="text-sm text-gray-600">Support disponible</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités complètes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer efficacement vos locations courte durée
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`card hover-lift transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <feature.icon className="h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-primary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Pourquoi choisir Checkinly ?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Automatisation complète</h3>
                    <p className="text-gray-600">
                      Du premier contact à la fin du séjour, tout est automatisé pour vous faire gagner du temps.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Sécurité renforcée</h3>
                    <p className="text-gray-600">
                      Chiffrement des données, authentification sécurisée et conformité RGPD.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Interface mobile-first</h3>
                    <p className="text-gray-600">
                      PWA installable qui fonctionne parfaitement sur tous les appareils, même hors-ligne.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Support expert</h3>
                    <p className="text-gray-600">
                      Équipe dédiée à votre réussite avec formation et accompagnement personnalisé.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 p-1">
                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Zap className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Interface PWA</h3>
                    <p className="text-gray-600 px-4">
                      Application web progressive installable et utilisable hors-ligne
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez les témoignages de nos utilisateurs satisfaits
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt à automatiser votre gestion locative ?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Rejoignez des centaines de propriétaires qui ont déjà simplifié leur quotidien avec Checkinly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="bg-white text-primary-600 hover:bg-gray-50 btn text-lg px-8 py-4">
              Commencer maintenant
            </Link>
            <Link href="/contact" className="border border-white text-white hover:bg-white hover:text-primary-600 btn text-lg px-8 py-4">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-primary-400" />
                <span className="text-2xl font-bold">Checkinly</span>
              </div>
              <p className="text-gray-400 mb-4">
                La solution complète pour gérer vos locations courte durée avec automatisation, 
                sécurité et simplicité.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  LinkedIn
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  YouTube
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Produit</h3>
              <ul className="space-y-2">
                <li><a href="/fonctionnalites" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="/tarifs" className="text-gray-400 hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="/demo" className="text-gray-400 hover:text-white transition-colors">Démo</a></li>
                <li><a href="/api-docs" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="/help" className="text-gray-400 hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors">Confidentialité</a></li>
                <li><a href="/legal/terms" className="text-gray-400 hover:text-white transition-colors">CGU</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Checkinly. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}