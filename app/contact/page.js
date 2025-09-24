import { Shield, Mail, Phone, MessageCircle, Calendar, MapPin, Clock, Send, Users } from 'lucide-react';
import Link from 'next/link';

const contactChannels = [
  {
    icon: Mail,
    title: 'Support email',
    description: 'Une réponse garantie sous 24h ouvrées pour toutes vos questions techniques ou commerciales.',
    value: 'support@checkinly.com'
  },
  {
    icon: Phone,
    title: 'Ligne directe',
    description: 'Disponible du lundi au vendredi de 9h à 18h (heure de Paris).',
    value: '+33 1 84 80 12 45'
  },
  {
    icon: MessageCircle,
    title: 'Chat en direct',
    description: 'Accédez au centre d\'aide intégré dans l\'application pour discuter avec notre équipe.',
    value: 'Temps de réponse moyen : 5 minutes'
  }
];

const meetingOptions = [
  {
    title: 'Session de démo personnalisée',
    description: '60 minutes avec un expert Checkinly pour découvrir la plateforme adaptée à votre activité.',
    audience: 'Propriétaires multi-biens et agences'
  },
  {
    title: 'Onboarding Premium',
    description: 'Accompagnement complet pour migrer vos inventaires et automatisations existantes.',
    audience: 'Utilisateurs en déploiement'
  },
  {
    title: 'Audit process check-in/out',
    description: 'Analyse de vos procédures et recommandations pour sécuriser chaque étape du séjour.',
    audience: 'Professionnels cherchant à optimiser leur expérience voyageur'
  }
];

const faqs = [
  {
    question: 'Quels sont vos délais de réponse ?',
    answer:
      'Notre équipe support répond sous 2 heures ouvrées via le chat, et sous 24 heures via email. Les urgences liées aux cautions sont traitées en priorité.'
  },
  {
    question: 'Proposez-vous un accompagnement à la mise en place ?',
    answer:
      'Oui, chaque nouveau client bénéficie d\'un parcours onboarding guidé, et d\'un chargé de compte dédié pour les portefeuilles de plus de 5 biens.'
  },
  {
    question: 'Puis-je planifier une démonstration avant de m\'engager ?',
    answer:
      'Absolument ! Réservez un créneau de démo live pour découvrir l\'ensemble des fonctionnalités et poser vos questions en direct.'
  }
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <header className="safe-top border-b border-primary-100 bg-white/80 backdrop-blur">
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
            <Link href="/tarifs" className="text-gray-600 hover:text-primary-600 transition-colors">
              Tarifs
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
            Contact
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 text-balance">
            Parlons de vos procédures check-in/out et de vos objectifs de croissance
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Que vous soyez au début de votre transformation digitale ou déjà utilisateur avancé, notre équipe vous accompagne pour
            fluidifier vos opérations, sécuriser vos cautions et créer une expérience voyageur irréprochable.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="mailto:support@checkinly.com" className="btn-primary text-lg px-8 py-4">
              Écrire au support
            </a>
            <a href="https://cal.com/checkinly/demo" target="_blank" rel="noopener noreferrer" className="btn-secondary text-lg px-8 py-4">
              Réserver une démo
            </a>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactChannels.map((channel) => (
            <div key={channel.title} className="card h-full hover:shadow-lg transition-shadow">
              <channel.icon className="h-10 w-10 text-primary-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{channel.title}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{channel.description}</p>
              <p className="text-primary-600 font-semibold">{channel.value}</p>
            </div>
          ))}
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white rounded-3xl border border-primary-100 shadow-soft p-10">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-8 w-8 text-primary-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Planifier un rendez-vous</h2>
                <p className="text-gray-500">Choisissez le format qui correspond le mieux à votre besoin.</p>
              </div>
            </div>
            <div className="space-y-6">
              {meetingOptions.map((option) => (
                <div key={option.title} className="border border-gray-200 rounded-2xl p-6 hover:border-primary-200 transition-colors">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{option.title}</h3>
                  <p className="text-gray-600 mb-3">{option.description}</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
                    {option.audience}
                  </div>
                </div>
              ))}
            </div>
            <a
              href="https://cal.com/checkinly/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700"
            >
              <Send className="h-4 w-4" />
              Ouvrir l'agenda en ligne
            </a>
          </div>

          <div className="bg-white rounded-3xl border border-primary-100 shadow-soft p-10">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-8 w-8 text-primary-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Formulaire de contact</h2>
                <p className="text-gray-500">Partagez votre projet et recevez un retour personnalisé.</p>
              </div>
            </div>
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="form-label">
                  Nom complet
                </label>
                <input id="name" type="text" name="name" placeholder="Ex : Marie Dupont" className="form-input" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="form-label">
                    Adresse email
                  </label>
                  <input id="email" type="email" name="email" placeholder="vous@entreprise.com" className="form-input" required />
                </div>
                <div>
                  <label htmlFor="phone" className="form-label">
                    Numéro de téléphone
                  </label>
                  <input id="phone" type="tel" name="phone" placeholder="+33 6 12 34 56 78" className="form-input" />
                </div>
              </div>
              <div>
                <label htmlFor="company" className="form-label">
                  Nom de votre structure
                </label>
                <input id="company" type="text" name="company" placeholder="Agence, conciergerie, propriétaire..." className="form-input" />
              </div>
              <div>
                <label htmlFor="message" className="form-label">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Décrivez vos besoins, vos volumes de biens et les fonctionnalités recherchées."
                  className="form-input"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-base font-semibold">
                Envoyer ma demande
              </button>
              <p className="text-sm text-gray-500 text-center">
                En soumettant ce formulaire, vous acceptez d'être recontacté par notre équipe et de recevoir notre documentation.
              </p>
            </form>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card bg-primary-600 text-white lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-6 w-6" />
              <h3 className="text-xl font-semibold">Nous rencontrer</h3>
            </div>
            <p className="text-primary-100 mb-4">
              Nos bureaux sont situés au cœur de Paris, à deux pas de la station Sentier. Prenons un café pour parler optimisation
              opérationnelle.
            </p>
            <p className="font-semibold">12 rue du Check-in
              <br />
              75002 Paris
            </p>
          </div>
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-primary-600" />
              <h3 className="text-xl font-semibold text-gray-900">Disponibilités support</h3>
            </div>
            <ul className="space-y-3 text-gray-600">
              <li>
                <strong className="text-gray-900">Chat &amp; email :</strong> Lundi - Vendredi 8h30 &rarr; 19h (CET)
              </li>
              <li>
                <strong className="text-gray-900">Support week-end :</strong> Astreinte pour urgences check-out &amp; litiges cautions
              </li>
              <li>
                <strong className="text-gray-900">Client Premium :</strong> Canal Slack dédié et revue mensuelle des performances
              </li>
            </ul>
          </div>
          <div className="card lg:col-span-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Questions fréquentes</h3>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question} className="border border-gray-200 rounded-xl p-4 hover:border-primary-200 transition-colors">
                  <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
