import { 
  Smartphone, 
  Laptop, 
  Tv, 
  Armchair, 
  Shirt, 
  ShoppingBag, 
  Glasses, 
  Sparkles, 
  Flower2,
  Watch,
  Handbag,
  CarFront, 
  Building, 
  Hammer, 
  Sprout, 
  PawPrint, 
  Utensils, 
  BookOpen, 
  Gamepad2, 
  Wrench, 
  Handshake, 
  Briefcase,
  PackageOpen
} from 'lucide-react';

export const categories = [
  {
    id: 'telephones_tablettes',
    name: 'Téléphones & Tablettes',
    icon: <Smartphone size={28} strokeWidth={1.5} />,
    color: '#007aff',
    fields: [
      { name: 'type', label: 'Type d\'appareil', type: 'select', options: ['Téléphone', 'Tablette', 'Montre connectée', 'Accessoire', 'Autre'] },
      { name: 'brand', label: 'Marque', type: 'select', options: ['Apple', 'Samsung', 'Xiaomi', 'Tecno', 'Infinix', 'Itel', 'Huawei', 'Oppo', 'Autre'] },
      { name: 'model', label: 'Modèle exact', type: 'text', placeholder: 'Ex: Galaxy S23 Ultra, iPhone 14...' },
      { name: 'storage', label: 'Stockage', type: 'select', options: ['16 Go', '32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To', 'Autre'], showIf: { field: 'type', values: ['Téléphone', 'Tablette'] } },
      { name: 'ram', label: 'RAM', type: 'select', options: ['2 Go', '3 Go', '4 Go', '6 Go', '8 Go', '12 Go', '16 Go', 'Autre'], showIf: { field: 'type', values: ['Téléphone', 'Tablette'] } },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf sous blister', 'Comme neuf', 'Très bon état', 'Bon état', 'État correct', 'Pour pièces'] },
      { name: 'warranty', label: 'Garantie', type: 'select', options: ['Aucune', '1 mois', '3 mois', '6 mois', '12 mois', 'Plus de 12 mois'] }
    ]
  },
  {
    id: 'informatique',
    name: 'Informatique',
    icon: <Laptop size={28} strokeWidth={1.5} />,
    color: '#5856d6',
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['Ordinateur portable', 'Ordinateur de bureau', 'Écran', 'Composant', 'Périphérique', 'Imprimante', 'Logiciel', 'Autre'] },
      { name: 'brand', label: 'Marque', type: 'select', options: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Toshiba', 'Autre'] },
      { name: 'processor', label: 'Processeur', type: 'select', options: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M1/M2/M3', 'Autre'], showIf: { field: 'type', values: ['Ordinateur portable', 'Ordinateur de bureau', 'Composant'] } },
      { name: 'ram', label: 'RAM', type: 'select', options: ['4 Go', '8 Go', '16 Go', '32 Go', '64 Go', 'Autre'], showIf: { field: 'type', values: ['Ordinateur portable', 'Ordinateur de bureau', 'Composant'] } },
      { name: 'storage', label: 'Stockage', type: 'select', options: ['256 Go SSD', '512 Go SSD', '1 To SSD', '500 Go HDD', '1 To HDD', 'Autre'], showIf: { field: 'type', values: ['Ordinateur portable', 'Ordinateur de bureau', 'Composant'] } },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Occasion - Excellent', 'Occasion - Bon', 'Occasion - Correct'] }
    ]
  },
  {
    id: 'electronique',
    name: 'Électronique & Électroménager',
    icon: <Tv size={28} strokeWidth={1.5} />,
    color: '#ff9500',
    fields: [
      { name: 'type', label: 'Type d\'appareil', type: 'select', options: ['Téléviseur & Smart TV', 'Réfrigérateur & Congélateur', 'Machine à laver', 'Climatiseur & Ventilateur', 'Micro-ondes & Four', 'Cuisinière & Gazinière', 'Robots & Mixeur', 'Son, Enceinte & Home Cinéma', 'Photo & Caméra', 'Autre Électroménager', 'Autre Électronique'] },
      { name: 'brand', label: 'Marque', type: 'select', options: ['Samsung', 'LG', 'Hisense', 'Sony', 'Panasonic', 'TCL', 'Philips', 'Nasco', 'Midea', 'Sharp', 'Whirlpool', 'Beko', 'Moulinex', 'Autre'] },
      { name: 'size_capacity', label: 'Taille / Capacité', type: 'text', placeholder: 'Ex: 55 pouces, 250 Litres, 10 Kg...' },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf sous carton', 'Comme neuf', 'Très bon état', 'Occasion certifiée'] },
      { name: 'warranty', label: 'Garantie', type: 'select', options: ['Aucune', '1 mois', '3 mois', '6 mois', '1 an', '2 ans'] }
    ]
  },
  {
    id: 'maison_jardin',
    name: 'Maison & Jardin',
    icon: <Armchair size={28} strokeWidth={1.5} />,
    color: '#ff2d55',
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['Meubles', 'Décoration', 'Linge de maison', 'Cuisine', 'Jardinage', 'Autre'] },
      { name: 'dimensions', label: 'Dimensions', type: 'text', placeholder: 'Ex: 200x160 cm, 2m de long...', showIf: { field: 'type', values: ['Meubles', 'Décoration', 'Linge de maison'] } },
      { name: 'material', label: 'Matière', type: 'select', options: ['Bois', 'Verre', 'Métal', 'Plastique', 'Cuir', 'Tissu', 'Autre'], showIf: { field: 'type', values: ['Meubles', 'Décoration', 'Cuisine'] } },
      { name: 'color', label: 'Couleur', type: 'select', options: ['Noir', 'Blanc', 'Marron', 'Gris', 'Rouge', 'Bleu', 'Beige', 'Multicolore', 'Autre'] },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Très bon état', 'Bon état', 'Usagé'] }
    ]
  },
  {
    id: 'habillement',
    name: 'Habillement',
    icon: <Shirt size={28} strokeWidth={1.5} />,
    color: '#ff3b30',
    fields: [
      { name: 'type', label: 'Sous-catégorie', type: 'select', options: ['Prêt-à-porter', 'Vêtements', 'Chaussures', 'Sacs / Bagagerie', 'Sous-vêtements', 'Autre'] },
      { name: 'size', label: 'Taille / Pointure', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44', '45', 'Autre'], showIf: { field: 'type', values: ['Prêt-à-porter', 'Vêtements', 'Chaussures', 'Sous-vêtements'] } },
      { name: 'gender', label: 'Genre', type: 'select', options: ['Homme', 'Femme', 'Enfant', 'Mixte'] },
      { name: 'color', label: 'Couleur(s)', type: 'select', options: ['Noir', 'Blanc', 'Bleu', 'Rouge', 'Jaune', 'Vert', 'Gris', 'Marron', 'Multicolore', 'Autre'] },
      { name: 'brand', label: 'Marque', type: 'select', options: ['Nike', 'Adidas', 'Zara', 'H&M', 'Puma', 'Gucci', 'Balenciaga', 'Louis Vuitton', 'Lacoste', 'Autre'] },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf avec étiquette', 'Neuf sans étiquette', 'Très bon état', 'Bon état', 'Usagé'] }
    ]
  },
  {
    id: 'friperie',
    name: 'Friperie',
    icon: <ShoppingBag size={28} strokeWidth={1.5} />,
    color: '#e91e63',
    fields: [
      { name: 'type', label: 'Sous-catégorie', type: 'select', options: ['Vêtements', 'Friperie 1er Choix', 'Balle de fripe', 'Demi-balle', 'Chaussures', 'Robes', 'T-shirts', 'Shorts', 'Sacs', 'Draps / Tissus', 'Autre'] },
      { name: 'sale_type', label: 'Type de vente', type: 'select', options: ['Détail (Pièce)', 'Gros (Balle entière)', 'Demi-balle'] },
      { name: 'gender', label: 'Genre', type: 'select', options: ['Homme', 'Femme', 'Enfant', 'Mixte'] },
      { name: 'origin', label: 'Provenance (Qualité)', type: 'select', options: ['1er Choix (Premier choix)', '2ème Choix', 'Tout-venant', 'Non précisé'] }
    ]
  },
  {
    id: 'accessoires',
    name: 'Accessoires',
    icon: <Watch size={28} strokeWidth={1.5} />,
    color: '#ff9500',
    fields: [
      { name: 'type', label: 'Sous-catégorie', type: 'select', options: ['Montre', 'Lunettes', 'Bracelet', 'Collier', 'Bague', 'Boucles d\'oreilles', 'Ceinture', 'Chapeau / Casquette', 'Autre'] },
      { name: 'gender', label: 'Genre', type: 'select', options: ['Homme', 'Femme', 'Enfant', 'Mixte'] },
      { name: 'material', label: 'Matière', type: 'select', options: ['Or', 'Argent', 'Cuir', 'Acier inoxydable', 'Tissu', 'Autre'] },
      { name: 'brand', label: 'Marque', type: 'select', options: ['Rolex', 'Ray-Ban', 'Casio', 'Seiko', 'Michael Kors', 'Autre'] },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Très bon état', 'Bon état', 'Occasion'] }
    ]
  },
  {
    id: 'beaute_sante',
    name: 'Beauté & Santé',
    icon: <Flower2 size={28} strokeWidth={1.5} />,
    color: '#ff2d55',
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['Parfum', 'Maquillage', 'Soin du visage', 'Soin du corps', 'Cheveux', 'Compléments alimentaires', 'Matériel beauté', 'Autre'] },
      { name: 'volume', label: 'Volume / Contenance', type: 'text', placeholder: 'Ex: 100 ml, 50 g...', showIf: { field: 'type', values: ['Parfum', 'Soin du visage', 'Soin du corps', 'Cheveux', 'Compléments alimentaires'] } },
      { name: 'brand', label: 'Marque', type: 'select', options: ['L\'Oréal', 'MAC', 'Dior', 'Chanel', 'Nivea', 'Garnier', 'Autre'] },
      { name: 'skin_type', label: 'Type de peau / cheveux', type: 'select', options: ['Normale', 'Sèche', 'Grasse', 'Mixte', 'Sensible', 'Tous types', 'Non applicable'], showIf: { field: 'type', values: ['Soin du visage', 'Soin du corps', 'Maquillage', 'Cheveux'] } },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf scellé', 'Neuf jamais utilisé', 'Peu utilisé'] }
    ]
  },
  {
    id: 'vehicules',
    name: 'Véhicules',
    icon: <CarFront size={28} strokeWidth={1.5} />,
    color: '#007aff',
    fields: [
      { name: 'type', label: 'Type de véhicule', type: 'select', options: ['Voiture', 'Moto / Scooter', 'Camion / Utilitaire', 'Pièces & Accessoires', 'Autre'] },
      { name: 'brand', label: 'Marque', type: 'select', options: ['Toyota', 'Hyundai', 'Ford', 'Peugeot', 'Renault', 'Kia', 'Mercedes', 'BMW', 'Dacia', 'Autre'] },
      { name: 'model', label: 'Modèle', type: 'text', placeholder: 'Ex: Corolla, Tucson...' },
      { name: 'year', label: 'Année', type: 'text', placeholder: 'Ex: 2018' },
      { name: 'mileage', label: 'Kilométrage', type: 'text', placeholder: 'Ex: 85000 km', showIf: { field: 'type', values: ['Voiture', 'Moto / Scooter', 'Camion / Utilitaire'] } },
      { name: 'transmission', label: 'Transmission', type: 'select', options: ['Automatique', 'Manuelle'], showIf: { field: 'type', values: ['Voiture', 'Camion / Utilitaire'] } },
      { name: 'fuel', label: 'Carburant', type: 'select', options: ['Essence', 'Diesel', 'Hybride', 'Électrique'], showIf: { field: 'type', values: ['Voiture', 'Camion / Utilitaire'] } },
      { name: 'condition', label: 'État', type: 'select', options: ['Excellent état', 'Très bon état', 'Bon état', 'À réparer'] }
    ]
  },
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: <Building size={28} strokeWidth={1.5} />,
    color: '#5856d6',
    fields: [
      { name: 'transaction_type', label: 'Type de transaction', type: 'select', options: ['Location', 'Vente', 'Colocation'] },
      { name: 'property_type', label: 'Type de bien', type: 'select', options: ['Appartement', 'Maison / Villa', 'Chambre', 'Terrain', 'Bureau / Commerce', 'Autre'] },
      { name: 'surface', label: 'Surface', type: 'text', placeholder: 'Ex: 150 m², 1 hectare...' },
      { name: 'rooms', label: 'Nombre de pièces', type: 'select', options: ['1 (Studio)', '2', '3', '4', '5', '6 et plus'], showIf: { field: 'property_type', values: ['Appartement', 'Maison / Villa', 'Bureau / Commerce'] } },
      { name: 'furnishing', label: 'Ameublement', type: 'select', options: ['Non meublé', 'Meublé', 'Semi-meublé', 'Non applicable'], showIf: { field: 'property_type', values: ['Appartement', 'Maison / Villa', 'Chambre', 'Bureau / Commerce'] } }
    ]
  },
  {
    id: 'construction',
    name: 'Construction & Quincaillerie',
    icon: <Hammer size={28} strokeWidth={1.5} />,
    color: '#8e8e93',
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['Matériaux (Ciment, Sable...)', 'Outillage', 'Électricité', 'Plomberie', 'Peinture', 'Menuiserie', 'Autre'] },
      { name: 'brand', label: 'Marque', type: 'text', placeholder: 'Ex: Sococim, Bosch...' },
      { name: 'quantity', label: 'Quantité disponible', type: 'text', placeholder: 'Ex: 50, 100...' },
      { name: 'price_unit', label: 'Unité de prix', type: 'select', options: ['Par article', 'Par tonne', 'Par sac', 'Par m²', 'Par lot'] },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Occasion'] }
    ]
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Élevage',
    icon: <Sprout size={28} strokeWidth={1.5} />,
    color: '#34c759',
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['Semences / Plants', 'Engrais / Produits', 'Matériel agricole', 'Aliment pour animaux', 'Récoltes', 'Autre'] },
      { name: 'quantity', label: 'Quantité / Poids', type: 'text', placeholder: 'Ex: 10 tonnes, 50 Kg...' },
      { name: 'origin', label: 'Provenance / Région', type: 'text', placeholder: 'Ex: Vallée du fleuve, Niayes...' },
      { name: 'condition_stage', label: 'État / Stade', type: 'text', placeholder: 'Ex: Frais, Séché, Poussin, Adulte...' }
    ]
  },
  {
    id: 'animaux',
    name: 'Animaux',
    icon: <PawPrint size={28} strokeWidth={1.5} />,
    color: '#ff9500',
    fields: [
      { name: 'species', label: 'Espèce', type: 'select', options: ['Chien', 'Chat', 'Mouton / Chèvre', 'Volaille', 'Bovin', 'Poisson', 'Oiseau', 'Autre'] },
      { name: 'breed', label: 'Race', type: 'text', placeholder: 'Ex: Ladoum, Berger allemand...' },
      { name: 'age', label: 'Âge', type: 'text', placeholder: 'Ex: 2 mois, 1 an...' },
      { name: 'gender', label: 'Sexe', type: 'select', options: ['Mâle', 'Femelle', 'Inconnu'] },
      { name: 'vaccinated', label: 'Vacciné', type: 'radio', options: ['Oui', 'Non', 'Non applicable'] }
    ]
  },
  {
    id: 'alimentation',
    name: 'Restauration & Cuisine',
    icon: <Utensils size={28} strokeWidth={1.5} />,
    color: '#10b981',
    fields: [
      { name: 'type', label: 'Sous-catégorie', type: 'select', options: ['Plats cuisinés / Commandes', 'Service Traiteur & Cérémonies', 'Fast-Food / Snack', 'Pâtisserie & Gâteaux', 'Jus naturels & Boissons', 'Produits locaux & Épices', 'Équipements & Ustensiles cuisine', 'Autre'] },
      { name: 'quantity', label: 'Portion / Quantité', type: 'text', placeholder: 'Ex: Par plat, Balle de 50 personnes, Litre...' },
      { name: 'delivery_option', label: 'Option de livraison', type: 'select', options: ['Livraison à domicile', 'A emporter sur place', 'Les deux'] },
      { name: 'origin', label: 'Origine / Spécialité', type: 'text', placeholder: 'Ex: Fait maison, Sénégalaise, Européenne...' }
    ]
  },
  {
    id: 'education',
    name: 'Éducation & Formation',
    icon: <BookOpen size={28} strokeWidth={1.5} />,
    color: '#007aff',
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['Livre scolaire', 'Livre de lecture', 'Fournitures', 'Cours de soutien', 'Formation pro', 'Autre'] },
      { name: 'level', label: 'Niveau', type: 'text', placeholder: 'Ex: Primaire, Lycée, Universitaire, Tous niveaux...' },
      { name: 'subject', label: 'Matière / Domaine', type: 'text', placeholder: 'Ex: Mathématiques, Informatique, Langues...' },
      { name: 'condition', label: 'État (si matériel)', type: 'select', options: ['Neuf', 'Très bon état', 'Bon état', 'Usagé', 'Non applicable'] }
    ]
  },
  {
    id: 'jeux_loisirs',
    name: 'Jeux & Loisirs',
    icon: <Gamepad2 size={28} strokeWidth={1.5} />,
    color: '#5856d6',
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['Console de jeux', 'Jeux vidéo', 'Matériel de sport', 'Instruments de musique', 'Jeux de société', 'Jouets', 'Autre'] },
      { name: 'brand_platform', label: 'Marque / Plateforme', type: 'text', placeholder: 'Ex: PS5, Nintendo Switch, Yamaha...' },
      { name: 'target_age', label: 'Âge cible', type: 'text', placeholder: 'Ex: +3 ans, Adulte, Tout public...' },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf scellé', 'Très bon état', 'Bon état', 'Occasion'] }
    ]
  },
  {
    id: 'pro',
    name: 'Matériel Professionnel',
    icon: <Wrench size={28} strokeWidth={1.5} />,
    color: '#8e8e93',
    fields: [
      { name: 'sector', label: 'Secteur', type: 'select', options: ['Restauration', 'Médical', 'Industrie', 'Bureautique', 'BTP', 'Couture', 'Coiffure/Beauté', 'Autre'] },
      { name: 'brand', label: 'Marque', type: 'text', placeholder: 'Ex: Brother, Kärcher...' },
      { name: 'model_ref', label: 'Modèle / Référence', type: 'text', placeholder: 'Ex: ...' },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Occasion', 'Reconditionné', 'Pour pièces'] },
      { name: 'warranty', label: 'Garantie', type: 'select', options: ['Aucune', '3 mois', '6 mois', '1 an', 'Autre'] }
    ]
  },
  {
    id: 'services',
    name: 'Services',
    icon: <Handshake size={28} strokeWidth={1.5} />,
    color: '#007aff',
    fields: [
      { name: 'type', label: 'Type de service', type: 'select', options: ['Bricolage / Dépannage', 'Ménage / Entretien', 'Beauté / Coiffure à domicile', 'Transport / Déménagement', 'Développement / Tech', 'Design / Média', 'Autre'] },
      { name: 'duration', label: 'Durée', type: 'text', placeholder: 'Ex: 2 heures, La journée...' },
      { name: 'intervention_zone', label: 'Zone d\'intervention', type: 'text', placeholder: 'Ex: Dakar et environs...' },
      { name: 'experience', label: 'Expérience', type: 'text', placeholder: 'Ex: 5 ans...' },
      { name: 'availability', label: 'Disponibilité', type: 'text', placeholder: 'Ex: Lundi au Vendredi, Week-end...' }
    ]
  },
  {
    id: 'emploi',
    name: 'Emploi',
    icon: <Briefcase size={28} strokeWidth={1.5} />,
    color: '#34c759',
    fields: [
      { name: 'contract_type', label: 'Type de contrat', type: 'select', options: ['CDI', 'CDD', 'Stage', 'Freelance / Mission', 'Intérim', 'Autre'] },
      { name: 'sector', label: 'Secteur', type: 'text', placeholder: 'Ex: Informatique, Commerce, Restauration...' },
      { name: 'level_required', label: 'Niveau requis', type: 'text', placeholder: 'Ex: Bac, Bac+3, Aucun diplôme...' },
      { name: 'hours', label: 'Horaires', type: 'text', placeholder: 'Ex: Temps plein, Temps partiel...' },
      { name: 'salary', label: 'Salaire proposé', type: 'text', placeholder: 'Ex: À débattre, 150000 FCFA...' }
    ]
  },
  {
    id: 'autre_divers',
    name: 'Autre / Divers',
    icon: <PackageOpen size={28} strokeWidth={1.5} />,
    color: '#8e8e93',
    fields: [
      { name: 'type', label: 'Type d\'article', type: 'text', placeholder: 'Ex: Solaire, Billet, Événement, Objet unique...' },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Très bon état', 'Bon état', 'État correct', 'Non applicable'] }
    ]
  }
];
