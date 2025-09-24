import { Shield, FileText, Smartphone, CreditCard, QrCode, Users, Globe, Zap, CheckCircle2, Database, BellRing } from 'lucide-react';
import Link from 'next/link';

const coreFeatures = [
  {
    icon: FileText,
    title: 'Inventaires intelligents',
    description:
      "Créez des inventaires complets avec photos, commentaires et système de notation par pièce. Tout est horodaté et archivé automatiquement."
  },
  {
    icon: CreditCard,
    title: 'Cautions Stripe automatisées',
    description:
      "En un clic, déclenchez la pré-autorisation et laissez Checkinly gérer la libération ou l'encaissement en cas de litige."
  },
  {
    icon: QrCode,
    title: 'Check-in/out guidé',
    description:
      "Générez des QR codes uniques pour chaque séjour et laissez vos voyageurs suivre un parcours pas-à-pas lors de l'entrée et de la sortie."
  },
  {
    icon: Users,
    title: 'Gestion centralisée des guests',
    description:
      "Visualisez les informations clés de vos voyageurs, gérez les accès et gardez une trace des échanges importants."
  },
  {
    icon: Smartphone,
    title: 'Application PWA mobile-first',
    description:
      "Installez Checkinly sur n'importe quel appareil et continuez de travailler même sans connexion, vos données se synchronisent ensuite."
  },
  {
    icon: Globe,
    title: 'Expérience multilingue',
    description:
      "Fournissez automatiquement l'interface et les procédures en français ou en anglais selon le profil de vos voyageurs."
  }
];

const automationFlows = [
  {
    title: 'Avant l\'arrivée',
    items: [
      "Création de la réservation et des accès digitaux",
      "Envoi automatique de l\'email de bienvenue",
      "Collecte des informations légales et de la caution"
    ]
  },
  {
    title: 'Pendant le séjour',
    items: [
      "Guide digital personnalisé accessible via QR code",
      "Notifications en temps réel en cas d\'incident",
      "Support invité 24/7 par email et SMS"
    ]
  },
  {
    title: 'Après le départ',
    items: [
      "Inventaire de sortie assisté et comparé à l\'entrée",
      "Libération automatique de la caution",
      "Génération du rapport PDF et archivage sécurisé"
    ]
  }
];

const advancedModules = [
  {
    icon: Database,
    title: 'Synchronisation multi-biens',
    description:
      "Connectez toutes vos propriétés dans un tableau de bord unique et attribuez des droits différents à vos collaborateurs."
  },
  {
    icon: BellRing,
    title: 'Alertes intelligentes',
    description:
      "Soyez informé instantanément des anomalies : caution refusée, inventaire incomplet ou retard check-out."
  },
  {
    icon: Zap,
    title: 'Automations no-code',
    description:
      "Construisez vos propres scénarios (webhook, email, SMS) sans écrire une seule ligne de code."
  }
];

export default function FeaturesPage() {
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
            <Link href="/tarifs" className="text-gray-600 hover:text-primary-600 transition-colors">
              Tarifs
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-primary-600 transition-colors">
              Contact
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
            Fonctionnalités
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 text-balance">
            Toutes les briques pour automatiser la gestion de vos locations courte durée
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Découvrez comment Checkinly vous aide à suivre chaque étape du parcours voyageur et à sécuriser vos biens grâce à une plateforme unique, pensée pour les professionnels exigeants.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/tarifs" className="btn-primary text-lg px-8 py-4">
              Voir les plans
            </Link>
            <Link href="/auth/register" className="btn-secondary text-lg px-8 py-4">
              Commencer l'essai gratuit
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature) => (
              <div key={feature.title} className="card h-full">
                <feature.icon className="h-12 w-12 text-primary-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h2>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="bg-white rounded-3xl shadow-lg border border-primary-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 bg-primary-600 text-white">
                <h2 className="text-3xl font-bold mb-4">Automatisation du parcours voyageur</h2>
                <p className="text-primary-100 mb-6">
                  Des scénarios prêts à l'emploi pour déléguer les tâches répétitives et offrir une expérience remarquable à vos guests.
                </p>
                <div className="space-y-4">
                  {automationFlows.map((flow) => (
                    <div key={flow.title} className="bg-white/10 rounded-2xl p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">{flow.title}</h3>
                      <ul className="space-y-2 text-sm text-primary-50">
                        {flow.items.map((item) => (
                          <li key={item} className="flex items-start space-x-2">
                            <CheckCircle2 className="h-4 w-4 mt-1 text-primary-200 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-10 space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Une plateforme pensée pour les équipes</h2>
                <p className="text-gray-600 leading-relaxed">
                  Invitez vos cleaners, partenaires et collaborateurs en définissant des permissions précises. Chaque action est tracée, vous gardez toujours le contrôle sur ce qui a été réalisé.
                </p>
                <div className="space-y-4">
                  {advancedModules.map((module) => (
                    <div key={module.title} className="flex items-start space-x-4">
                      <module.icon className="h-10 w-10 text-primary-600 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-primary-100 p-6 bg-primary-50">
                  <h3 className="font-semibold text-gray-900 mb-2">Sécurité de niveau professionnel</h3>
                  <p className="text-gray-600 text-sm">
                    Données chiffrées, journal d'audit complet et hébergement conforme RGPD sur des serveurs européens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Prêt à explorer toutes les possibilités ?</h2>
          <p className="text-gray-600 mb-8 max-w-3xl mx-auto">
            Programmez une démonstration personnalisée avec un expert Checkinly. Nous analyserons votre organisation, puis configurerons ensemble les automations les plus adaptées.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="btn-primary text-lg px-8 py-4">
              Planifier une démo
            </Link>
            <Link href="/auth/register" className="btn-secondary text-lg px-8 py-4">
              Créer un compte
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
