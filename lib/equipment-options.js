import {
  Armchair,
  Baby,
  Bath,
  Briefcase,
  Building2,
  Car,
  CreditCard,
  Flame,
  Flower2,
  Laptop,
  Play,
  Snowflake,
  Sparkles,
  Sunrise,
  Sun,
  Trees,
  Tv,
  UtensilsCrossed,
  WashingMachine,
  Waves,
  Wifi,
  Wind
} from 'lucide-react';

export const EQUIPMENT_GROUPS = [
  {
    key: 'wellness',
    label: 'Bien-être',
    options: [
      {
        value: 'Sauna',
        icon: Flame,
        description: 'Chaleur sèche pour un moment relaxant.',
        keywords: ['detente', 'chaleur', 'bien-etre']
      },
      {
        value: 'Jacuzzi',
        icon: Bath,
        description: 'Bain à remous privatif.',
        keywords: ['spa', 'bain', 'remous']
      },
      {
        value: 'Spa',
        icon: Flower2,
        description: 'Espace bien-être ou massages.',
        keywords: ['detente', 'soin']
      },
      {
        value: 'Piscine',
        icon: Waves,
        description: 'Bassin intérieur ou extérieur.',
        keywords: ['pool', 'nage']
      }
    ]
  },
  {
    key: 'comfort',
    label: 'Confort & services',
    options: [
      {
        value: 'Wifi',
        icon: Wifi,
        description: 'Connexion internet haut débit.',
        keywords: ['internet', 'fibre']
      },
      {
        value: 'Cuisine équipée',
        icon: UtensilsCrossed,
        description: 'Tout le nécessaire pour cuisiner sur place.',
        keywords: ['cuisine', 'equipement']
      },
      {
        value: 'Climatisation',
        icon: Snowflake,
        description: 'Température idéale toute l’année.',
        keywords: ['clim', 'air conditionne']
      },
      {
        value: 'Cheminée',
        icon: Flame,
        description: 'Ambiance chaleureuse au coin du feu.',
        keywords: ['feu', 'hiver']
      },
      {
        value: 'TV',
        icon: Tv,
        description: 'Écran disponible dans le séjour.',
        keywords: ['television', 'ecran']
      },
      {
        value: 'Netflix',
        icon: Play,
        description: 'Accès aux plateformes de streaming.',
        keywords: ['streaming', 'vod']
      }
    ]
  },
  {
    key: 'work',
    label: 'Télétravail',
    options: [
      {
        value: 'Bureau',
        icon: Briefcase,
        description: 'Espace de travail dédié.',
        keywords: ['desk', 'travail']
      },
      {
        value: 'Télétravail',
        icon: Laptop,
        description: 'Installation pensée pour travailler à distance.',
        keywords: ['remote', 'bureau']
      }
    ]
  },
  {
    key: 'family',
    label: 'Familles',
    options: [
      {
        value: 'Lit bébé',
        icon: Baby,
        description: 'Lit parapluie ou berceau disponible.',
        keywords: ['bebe', 'famille']
      },
      {
        value: 'Chaise haute',
        icon: Armchair,
        description: 'Chaise adaptée aux tout-petits.',
        keywords: ['enfant', 'repas']
      }
    ]
  },
  {
    key: 'outdoor',
    label: 'Extérieur',
    options: [
      {
        value: 'Balcon',
        icon: Building2,
        description: 'Espace extérieur attenant.',
        keywords: ['exterieur']
      },
      {
        value: 'Terrasse',
        icon: Sun,
        description: 'Coin détente en plein air.',
        keywords: ['plein air', 'exterieur']
      },
      {
        value: 'Jardin',
        icon: Trees,
        description: 'Espace vert privatif ou partagé.',
        keywords: ['nature']
      },
      {
        value: 'Vue mer',
        icon: Sunrise,
        description: 'Panorama sur l’océan ou le littoral.',
        keywords: ['ocean', 'vue']
      }
    ]
  },
  {
    key: 'practical',
    label: 'Pratique',
    options: [
      {
        value: 'Parking',
        icon: Car,
        description: 'Place de stationnement dédiée.',
        keywords: ['stationnement', 'garage']
      },
      {
        value: 'Stationnement gratuit',
        icon: Sparkles,
        description: 'Stationnement sans frais pour vos voyageurs.',
        keywords: ['stationnement', 'gratuit']
      },
      {
        value: 'Stationnement payant',
        icon: CreditCard,
        description: 'Stationnement disponible avec supplément.',
        keywords: ['stationnement', 'payant']
      },
      {
        value: 'Lave-linge',
        icon: WashingMachine,
        description: 'Machine à laver sur place.',
        keywords: ['linge', 'lavage']
      },
      {
        value: 'Sèche-linge',
        icon: Wind,
        description: 'Système de séchage rapide.',
        keywords: ['linge', 'sechage']
      }
    ]
  }
];

export const EQUIPMENT_OPTIONS = EQUIPMENT_GROUPS.flatMap((group) => group.options);

export const EQUIPMENT_OPTION_MAP = EQUIPMENT_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option;
  return acc;
}, {});

