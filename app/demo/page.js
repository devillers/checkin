import { Shield, PlayCircle, Laptop, Smartphone, CheckCircle2, CalendarCheck2, MessageCircle, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';

const highlights = [
  {
    title: 'Parcours guidé en temps réel',
    description:
      "Suivez un check-in complet comme si vous étiez propriétaire : notifications, étapes et validations automatiques à chaque pièce.",
    icon: PlayCircle
  },
  {
    title: 'Interface propriétaire',
    description:
      "Explorez le tableau de bord, consultez vos réservations et visualisez l'état de vos inventaires en direct.",
    icon: Laptop
  },
  {
    title: 'Expérience guest',
    description:
      "Passez du côté voyageur et testez l'application mobile avec QR code, assistance intégrée et signatures numériques.",
    icon: Smartphone
  }
];

const timeline = [
  {
    step: '01',
    title: 'Recevez le lien de la démo',
    description:
      "Un environnement complet pré-configuré vous est envoyé par email : 3 biens, 6 réservations et des exemples d'incidents.",
    accent: 'bg-primary-100 text-primary-700'
  },
  {
    step: '02',
    title: 'Suivez le scénario guidé',
    description:
      "Un parcours interactif vous guide sur le dashboard web : création d'une caution Stripe, lancement d'un inventaire et validation.",
    accent: 'bg-success-100 text-success-700'
  },
  {
    step: '03',
    title: 'Terminez sur mobile',
    description:
      "Scannez le QR code fourni pour vivre l'expérience guest : check-out assisté, reporting photo et signature finale.",
    accent: 'bg-warning-100 text-warning-700'
  }
];

const teamSupport = [
  {
    title: 'Session live de 30 minutes',
    description:
      "Réservez une visio avec un membre de l'équipe produit pour poser vos questions et personnaliser la démo selon vos cas d'usage."
  },
  {
    title: 'Ressources à télécharger',
    description:
      "Fiches pratiques, checklist d'onboarding et comparatif des plans pour préparer votre déploiement."
  },
  {
    title: 'Accès collaboratif',
    description:
      "Invitez jusqu'à 3 collègues sur l'environnement démo pour tester les permissions et workflows d'équipe."
  }
];

const demoPerks = [
  {
    title: 'Sans installation',
    description: "La démo fonctionne directement depuis votre navigateur, desktop ou mobile.",
    icon: Sparkles
  },
  {
    title: 'Guides interactifs',
    description: "Des bulles d'aide vous accompagnent sur chaque étape clé du parcours.",
    icon: MessageCircle
  },
  {
    title: 'Cas pratiques',
    description: "Découvrez comment gérer un incident inventaire et débloquer la caution en quelques clics.",
    icon: CalendarCheck2
  }
];

export default function DemoPage() {
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

      <main className="pb-24">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
          <span className="inline-flex items-center px-4 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
            Démo immersive
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 text-balance">
            Découvrez Checkinly comme si vous y étiez
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Prenez le contrôle d'un compte de démonstration complet : du tableau de bord propriétaire à l'application guest. Notre parcours guidé vous montre comment sécuriser vos locations courte durée étape par étape.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="#scenario" className="btn-primary text-lg px-8 py-4">
              Lancer la visite guidée
            </Link>
            <Link href="/auth/register" className="btn-secondary text-lg px-8 py-4">
              Créer mon compte
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-[2fr,1fr] items-center">
          <div className="bg-white rounded-3xl shadow-lg border border-primary-100 p-8 lg:p-10 space-y-6">
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary-100 via-white to-primary-100 flex items-center justify-center">
              <PlayCircle className="h-20 w-20 text-primary-500" />
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {highlights.map((highlight) => (
                <div key={highlight.title} className="rounded-2xl border border-primary-100 p-4 text-left">
                  <highlight.icon className="h-8 w-8 text-primary-600 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{highlight.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{highlight.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 text-white rounded-3xl p-8 lg:p-10 space-y-6">
            <h2 className="text-3xl font-bold">Ce que vous allez explorer</h2>
            <ul className="space-y-4 text-sm text-primary-100">
              <li className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-white" />
                <span>Un calendrier rempli de réservations réelles pour suivre les changements de statut.</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-white" />
                <span>Un inventaire d'entrée et de sortie déjà préparé avec photos et annotations.</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-white" />
                <span>Des notifications en direct simulant les actions d'un guest et de votre équipe terrain.</span>
              </li>
            </ul>
            <div className="bg-white/10 rounded-2xl p-6">
              <p className="text-sm text-primary-50">
                Vous disposez de 7 jours d'accès à l'environnement démo. Prolongez-le gratuitement sur simple demande auprès de notre équipe support.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="grid gap-10 md:grid-cols-3">
            {timeline.map((item) => (
              <div key={item.step} className="card h-full">
                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-semibold ${item.accent}`}>
                  {item.step}
                </span>
                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="grid gap-10 md:grid-cols-3">
            {demoPerks.map((perk) => (
              <div key={perk.title} className="card h-full">
                <perk.icon className="h-10 w-10 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{perk.title}</h3>
                <p className="text-gray-600 leading-relaxed">{perk.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 grid gap-12 lg:grid-cols-[1.2fr,0.8fr] items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Une démo conçue pour vos équipes</h2>
            <p className="text-gray-600 leading-relaxed">
              Partagez l'accès démo à vos associés, cleaning partners ou property managers. Chaque personne reçoit ses propres instructions et voit comment Checkinly facilite la collaboration.
            </p>
            <ul className="space-y-4">
              {teamSupport.map((item) => (
                <li key={item.title} className="flex items-start space-x-4">
                  <Users className="h-8 w-8 text-primary-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-3xl shadow-lg border border-primary-100 p-8 space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900">Obtenir l'accès</h3>
            <p className="text-gray-600 leading-relaxed">
              Remplissez le formulaire ci-dessous, nous vous envoyons les identifiants et le guide interactif en moins de 2 minutes.
            </p>
            <form className="space-y-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="company">
                  Structure
                </label>
                <input
                  id="company"
                  type="text"
                  placeholder="Agence, conciergerie, propriétaire..."
                  className="w-full rounded-xl border border-primary-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                  Email professionnel
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="vous@entreprise.com"
                  className="w-full rounded-xl border border-primary-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="units">
                  Nombre de lots gérés
                </label>
                <input
                  id="units"
                  type="number"
                  min="1"
                  placeholder="Ex. 25"
                  className="w-full rounded-xl border border-primary-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <button type="button" className="btn-primary w-full py-3 text-lg">
                Recevoir la démo
              </button>
              <p className="text-xs text-gray-500">
                En envoyant ce formulaire, vous acceptez d'être contacté par notre équipe commerciale. Aucune carte bancaire requise.
              </p>
            </form>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="bg-white rounded-3xl shadow-lg border border-primary-100 p-10 text-center space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Prêt à automatiser vos check-ins ?</h2>
            <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Obtenez votre accès démo gratuit et découvrez pourquoi plus de 500 propriétaires font confiance à Checkinly pour sécuriser leurs locations courte durée.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="#scenario" className="btn-primary text-lg px-8 py-4">
                Commencer la visite
              </Link>
              <Link href="/tarifs" className="btn-secondary text-lg px-8 py-4">
                Comparer les plans
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
