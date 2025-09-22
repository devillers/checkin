import { Shield, Check, ArrowRight, Award, Star, Users, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: '39€',
    period: 'par mois',
    description: 'Idéal pour lancer l\'automatisation sur vos 2 premiers biens.',
    highlights: ['2 biens inclus', 'Inventaires illimités', 'Cautions Stripe', 'Support email 5j/7'],
    ctaLabel: 'Choisir Starter'
  },
  {
    name: 'Growth',
    price: '79€',
    period: 'par mois',
    description: 'La formule préférée des conciergeries en croissance.',
    highlights: [
      'Jusqu\'à 8 biens',
      'Automations avancées',
      'Workflows collaboratifs',
      'Support prioritaire 7j/7'
    ],
    popular: true,
    ctaLabel: 'Choisir Growth'
  },
  {
    name: 'Scale',
    price: '149€',
    period: 'par mois',
    description: 'Pensé pour les opérateurs multi-sites avec besoins spécifiques.',
    highlights: [
      'Biens illimités',
      'SSO & rôles personnalisés',
      'Intégrations API',
      'Customer success dédié'
    ],
    ctaLabel: 'Parler à un expert'
  }
];

const faqs = [
  {
    question: 'Y a-t-il des frais d\'installation ?',
    answer: "Non, la configuration initiale est incluse dans tous nos plans et nous vous accompagnons pour importer vos premiers biens."
  },
  {
    question: 'Puis-je changer de plan à tout moment ?',
    answer: "Oui, vous pouvez passer à l'offre supérieure ou inférieure en un clic. Le prorata est calculé automatiquement."
  },
  {
    question: 'Proposez-vous une facturation annuelle ?',
    answer: "Bien sûr. Optez pour la facturation annuelle et bénéficiez de deux mois offerts. Contactez-nous pour en profiter."
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <header className="safe-top border-b border-primary-100 bg-white/70 backdrop-blur">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold gradient-text">Checkinly</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
              Accueil
            </Link>
            <Link href="/fonctionnalites" className="text-gray-600 hover:text-primary-600 transition-colors">
              Fonctionnalités
            </Link>
            <Link href="/auth/login" className="btn-secondary">
              Connexion
            </Link>
            <Link href="/auth/register" className="btn-primary">
              Essai gratuit
            </Link>
          </div>
          <div className="md:hidden">
            <Link href="/auth/register" className="btn-primary">
              Essai gratuit
            </Link>
          </div>
        </nav>
      </header>

      <main className="pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
          <span className="inline-flex items-center px-4 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
            Tarification transparente
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 text-balance">
            Choisissez le plan qui accompagne la croissance de votre activité
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Quel que soit le nombre de biens que vous gérez, nous avons une offre adaptée. Toutes incluent un essai gratuit de 14 jours et l'assistance de nos experts pour bien démarrer.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-4">
              Commencer l'essai gratuit
            </Link>
            <Link href="/contact" className="btn-secondary text-lg px-8 py-4">
              Parler à l'équipe
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card relative h-full flex flex-col ${plan.popular ? 'border-primary-200 shadow-primary/40 shadow-xl ring-2 ring-primary-200' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                    Populaire
                  </div>
                )}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-3 text-gray-600 mb-8 flex-1">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`btn text-base px-6 py-3 flex items-center justify-center gap-2 ${plan.popular ? 'btn-primary text-white' : 'btn-secondary'}`}
                >
                  {plan.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="bg-white rounded-3xl border border-primary-100 p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tous les plans incluent</h2>
              <p className="text-gray-600">
                Bénéficiez du meilleur de Checkinly dès le premier jour, sans options cachées. Les fonctionnalités avancées se déploient ensuite selon vos besoins.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Star className="h-6 w-6 text-primary-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Onboarding personnalisé</h3>
                  <p className="text-gray-600 text-sm">
                    Session de lancement en visio avec un spécialiste pour configurer vos biens et vos premiers scénarios.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 text-primary-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Accès collaborateurs illimités</h3>
                  <p className="text-gray-600 text-sm">
                    Invitez votre équipe et vos prestataires sans frais supplémentaires. Gérez leurs droits en toute simplicité.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Award className="h-6 w-6 text-primary-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Mises à jour continues</h3>
                  <p className="text-gray-600 text-sm">
                    Nouvelles fonctionnalités chaque mois, automatiquement déployées sur votre espace.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-6 w-6 text-primary-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Support réactif</h3>
                  <p className="text-gray-600 text-sm">
                    Assistance par chat et email, avec un temps de réponse moyen inférieur à 2 heures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="bg-white rounded-3xl border border-primary-100 p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Questions fréquentes</h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="border border-primary-100 rounded-2xl p-6 bg-primary-50/40">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center">
          <div className="bg-primary-600 rounded-3xl px-10 py-16 text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Besoin d'un plan sur-mesure ?</h2>
            <p className="text-primary-100 mb-8">
              Notre équipe élabore des offres personnalisées pour les groupes et réseaux d'agences. Discutons de vos besoins spécifiques.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/contact" className="bg-white text-primary-600 hover:bg-gray-100 btn text-lg px-8 py-4">
                Contacter un expert
              </Link>
              <Link href="/auth/register" className="border border-white text-white hover:bg-white hover:text-primary-600 btn text-lg px-8 py-4">
                Lancer mon essai
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
