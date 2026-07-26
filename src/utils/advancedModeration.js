// ══════════════════════════════════════════════════════════════════════════════
// COLOBANE MARKET — MOTEUR DE MODÉRATION AVANCÉE NIVEAU 3
// Filtres stricts spécifiques au Sénégal + Normalisation Anti-contournement
// ══════════════════════════════════════════════════════════════════════════════

export const PROHIBITED_CATEGORIES = {
  PROSTITUTION: [
    'escort', 'escorte', 'accompagnatrice', 'call girl',
    'massage tantrique', 'massage erotique', 'massage sensuel',
    'massage complet', 'massage avec finition', 'massage libertin',
    'passe', 'passe rapide', 'plan cul', 'plan q',
    'cougar', 'sugar daddy', 'sugar mommy',
    'nuit complète', 'nuit entière disponible',
    'disponible 24h', 'disponible toute la nuit',
    'send nudes', 'nude', 'contenu adulte',
    'video intime', 'photo intime', 'abonnement only',
    'onlyfans', 'mym', 'fansly',
    'plaisir garanti', 'satisfaction garantie',
    'détente assurée', 'moments inoubliables',
    'rencontre discrète', 'relation discrète',
    'femme chaude', 'homme chaud', 'fille chaude',
    'femme sérieuse cherche', 'cherche homme généreux',
    'cherche sugar', 'entretenue', 'plan discret',
    'gratuit contre', 'photo contre', 'video contre', 'echange service'
  ],

  DROGUES: [
    'yamba', 'chanvre', 'cannabis', 'weed', 'herbe',
    'shit', 'haschisch', 'hachich', 'zamal',
    'cocaïne', 'cocaine', 'coke', 'poudre blanche',
    'héroïne', 'heroine', 'brown sugar',
    'ecstasy', 'mdma', 'molly',
    'tramadol', 'tramal', 'rivotril',
    'diazépam', 'lexomil', 'rohypnol',
    'médicament sans ordonnance', 'vente médicament',
    'comprimé fort', 'pilule forte',
    'codéine', 'codeine', 'sirop codéine',
    'promethazine', 'lean', 'purple drank',
    'khat', 'qat', 'stimulant naturel fort',
    'poudre magique', 'poudre miracle'
  ],

  ARMES: [
    'arme', 'pistolet', 'révolver', 'revolver', 'fusil',
    'kalachnikov', 'ak47', 'mitraillette',
    'munition', 'balle', 'cartouche',
    'couteau cran', 'couteau automatique',
    'matraque électrique', 'matraque electrique', 'taser',
    'grenade', 'explosif', 'pétard professionnel', 'petard professionnel',
    'gaz lacrymogène', 'gaz lacrymogene', 'spray poivre'
  ],

  FAUX_DOCUMENTS: [
    'faux passeport', 'fausse carte', 'faux permis',
    'faux diplôme', 'faux diplome', 'diplôme authentifié', 'diplome authentifie',
    'carte identité vierge', 'carte identite vierge', 'document officiel',
    'visa garanti', 'visa sans refus',
    'acte de naissance vierge',
    'contrefaçon', 'contrefacon', 'copie exacte officielle',
    'faux billets', 'billets identiques'
  ],

  PRODUITS_DANGEREUX: [
    'mercure', 'cyanure', 'acide sulfurique',
    'produit éclaircissant interdit', 'produit eclaircissant interdit',
    'crème hydroquinone forte', 'creme hydroquinone forte',
    'crème au mercure', 'creme au mercure', 'savon au mercure',
    'pesticide interdit', 'ddt',
    'ivoire', 'défense éléphant', 'defense elephant', 'corne rhinocéros', 'corne rhinoceros',
    'peau léopard', 'peau leopard', 'peau crocodile sauvage',
    'perroquet gris', 'animal protégé', 'animal protege',
    'singe', 'chimpanzé', 'chimpanze', 'gorille'
  ],

  MARABOUTAGE_ESCROQUERIE: [
    'marabout puissant', 'grand marabout',
    'retour affection garanti', 'retour amour 24h',
    'résultats garantis', 'resultats garantis', 'résultats rapides marabout',
    'problème argent résolu', 'probleme argent resolu', 'chance immédiate', 'chance immediate',
    'portefeuille magique', 'argent magique',
    'multiplication argent', 'doubler argent',
    'bague magique', 'anneau magique',
    'talisman puissant', 'gris gris',
    'envoûtement', 'envoutement', 'désenvoûtement', 'desenvoutement',
    'sacrifice', 'rituel',
    // Arnaques financières & Avances
    'arnaque', 'faux', 'fake', 'escroquerie', 'avance', 'acompte',
    'western union', 'moneygram', 'bitcoin', 'crypto', 'paypal',
    'virement', 'envoyer argent', 'send money', 'transfert',
    'code de vérification', 'code wave', 'code orange',
    'reçu wave', 'reçu orange', 'capture wave',
    'payer avant', 'paiement avant', 'avance obligatoire',
    'envoyer d\'abord', 'envoyer avant de voir',
    'frais de livraison à avancer', 'frais de dossier',
    'frais de déblocage', 'frais de transfert',
    'caution remboursable', 'dépôt de garantie urgent',
    'urgent urgent', 'besoin cash urgent', 'départ définitif', 'quitte le sénégal',
    'quitte dakar', 'voyage imminent', 'liquidation totale', 'tout doit partir',
    'propriétaire absent', 'clés disponibles', 'visite sans rendez-vous',
    'payer pour visiter', 'frais de réservation', 'bloquer le bien',
    'vendu pour raisons médicales', 'décès du propriétaire', 'héritage à vendre',
    'ambassade vend', 'ONG vend', 'association vend'
  ]
};

// ══════════════════════════════════════════════════════════════════════════════
// NORMALISATION DU TEXTE ET DÉTECTION DU LEET-SPEAK (CONTOURNEMENT)
// Ex: "c0caïne" -> "cocaine", "w33d" -> "weed", "e-s-c-o-r-t-e" -> "escorte"
// ══════════════════════════════════════════════════════════════════════════════
export const normalizeTextForModeration = (rawText) => {
  if (!rawText) return '';
  
  let str = rawText.toString().toLowerCase();

  // 1. Suppression des accents
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 2. Remplacement Leet-Speak (Normalisation des chiffres et symboles)
  str = str
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4|@/g, 'a')
    .replace(/5|\$/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/!|\|/g, 'i');

  // 3. Version nettoyée des séparateurs pour contrer "w.e.e.d" ou "e-s-c-o-r-t"
  const strippedSeparators = str.replace(/[^a-z0-9]/g, '');

  return { originalNormalized: str, strippedSeparators };
};

// ══════════════════════════════════════════════════════════════════════════════
// ANALYSE COMPLETE DE L'ANNONCE (Titre + Description + Tags/Metadata)
// ══════════════════════════════════════════════════════════════════════════════
export const analyzeContentForModeration = ({ title = '', description = '', category = '', metadata = {} }) => {
  const metadataString = JSON.stringify(metadata || {}).toLowerCase();
  const rawCombinedText = `${title} ${description} ${category} ${metadataString}`;
  
  const { originalNormalized, strippedSeparators } = normalizeTextForModeration(rawCombinedText);

  // Parcourir chaque catégorie d'interdiction
  for (const [categoryName, keywords] of Object.entries(PROHIBITED_CATEGORIES)) {
    for (const keyword of keywords) {
      const { originalNormalized: normKeyword, strippedSeparators: normKeywordStripped } = normalizeTextForModeration(keyword);

      // Vérification 1 : présence du mot normalisé dans le texte
      if (originalNormalized.includes(normKeyword)) {
        return {
          isProhibited: true,
          categoryName,
          keyword,
          reason: getCategoryReasonMessage(categoryName, keyword)
        };
      }

      // Vérification 2 : détection de contournement par espaces/points (ex: "y a m b a")
      if (normKeywordStripped.length >= 4 && strippedSeparators.includes(normKeywordStripped)) {
        return {
          isProhibited: true,
          categoryName,
          keyword,
          reason: getCategoryReasonMessage(categoryName, keyword)
        };
      }
    }
  }

  // Vérification des devises étrangères ($, €, dollar, euro)
  const currencyRegex = /(\$|€|\bdollars?\b|\beuros?\b)/i;
  if (currencyRegex.test(title) || currencyRegex.test(description)) {
    return {
      isProhibited: true,
      categoryName: 'CURRENCY',
      keyword: 'Devise étrangère',
      reason: 'Les prix sur Colobane Market doivent être indiqués en FCFA uniquement.'
    };
  }

  return { isProhibited: false };
};

const getCategoryReasonMessage = (categoryName, keyword) => {
  switch (categoryName) {
    case 'PROSTITUTION':
      return `⛔ Contenu interdit : Offres d'accompagnement ou contenu à caractère sexuel ("${keyword}").`;
    case 'DROGUES':
      return `⛔ Contenu interdit : Vente de substances illicites ou médicaments réglementés ("${keyword}").`;
    case 'ARMES':
      return `⛔ Contenu interdit : Vente d'armes ou munitions entre particuliers ("${keyword}").`;
    case 'FAUX_DOCUMENTS':
      return `⛔ Contenu interdit : Faux documents, diplômes ou contrefaçons ("${keyword}").`;
    case 'PRODUITS_DANGEREUX':
      return `⛔ Contenu interdit : Produits chimiques dangereux ou espèces protégées ("${keyword}").`;
    case 'MARABOUTAGE_ESCROQUERIE':
      return `⛔ Contenu interdit : Offre de maraboutage, multiplication d'argent ou tentative de fraude ("${keyword}").`;
    default:
      return `⛔ Contenu non conforme détecté ("${keyword}").`;
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GESTION ET SUIVI DES INFRACTIONS (SUSPENSION APRÈS 2 TENTATIVES)
// ══════════════════════════════════════════════════════════════════════════════
export const trackViolationAttempt = (userId) => {
  if (!userId) return { attemptCount: 1, isSuspended: false };

  const storageKey = `moderation_violations_${userId}`;
  const existingAttempts = parseInt(localStorage.getItem(storageKey) || '0', 10);
  const newAttempts = existingAttempts + 1;

  localStorage.setItem(storageKey, newAttempts.toString());

  return {
    attemptCount: newAttempts,
    isSuspended: newAttempts >= 2
  };
};

export const checkIsUserSuspendedForModeration = (userId) => {
  if (!userId) return false;
  const storageKey = `moderation_violations_${userId}`;
  const attempts = parseInt(localStorage.getItem(storageKey) || '0', 10);
  return attempts >= 2;
};
