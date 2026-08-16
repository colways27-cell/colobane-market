import { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { categories } from '../data/categories';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { openWavePayment } from '../config/paymentConfig';
import toast from 'react-hot-toast';
import { 
  analyzeContentForModeration, 
  trackViolationAttempt, 
  checkIsUserSuspendedForModeration 
} from '../utils/advancedModeration';

import { locationsList as locations } from '../data/locations';

const deliveries = ['Livraison Express (Tiak-Tiak)', 'Dakar uniquement', 'Point Relais (Dakar)', 'Expédition Régions', 'Aucune'];

const categoryKeywords = {
  telephones_tablettes: ['téléphone', 'telephone', 'iphone', 'samsung', 'tecno', 'infinix', 'android', 'tablette', 'ipad', 'portable', 'smartphone', 'montre connectée'],
  informatique: ['pc', 'ordinateur', 'laptop', 'écran', 'clavier', 'souris', 'imprimante', 'macbook', 'dell', 'hp', 'lenovo', 'composant', 'disque dur', 'ssd'],
  electronique: ['tv', 'télé', 'télévision', 'son', 'audio', 'enceinte', 'caméra', 'frigo', 'climatiseur', 'ventilateur', 'micro-ondes', 'lave-linge', 'electromenager'],
  maison_jardin: ['meuble', 'canapé', 'lit', 'table', 'chaise', 'armoire', 'décoration', 'rideau', 'tapis', 'jardin', 'cuisine', 'vaisselle', 'lampe'],
  habillement: ['vêtement', 'vetement', 'chemise', 'pantalon', 'robe', 'jupe', 'chaussure', 'basket', 'nike', 'adidas', 'zara', 'taille', 'pointure', 'slip', 'tshirt', 't-shirt', 'jean', 'costume', 'boubou'],
  friperie: ['friperie', 'fripe', 'balle', 'occasion', 'seconde main', 'demi-balle', 'draps', 'tissus'],
  accessoires: ['montre', 'lunettes', 'bracelet', 'collier', 'bague', 'ceinture', 'casquette', 'chapeau', 'sac', 'bijou', 'boucle'],
  beaute_sante: ['parfum', 'maquillage', 'crème', 'soin', 'cheveux', 'beauté', 'cosmétique', 'lotion', 'savon', 'shampoing'],
  vehicules: ['voiture', 'moto', 'scooter', 'camion', 'toyota', 'peugeot', 'mercedes', 'bmw', 'hyundai', 'auto', 'véhicule', 'pièce auto'],
  immobilier: ['maison', 'appartement', 'terrain', 'villa', 'chambre', 'location', 'louer', 'vendre', 'bureau', 'immeuble', 'studio'],
  construction: ['ciment', 'sable', 'brique', 'fer', 'peinture', 'plomberie', 'électricité', 'quincaillerie', 'outil', 'menuiserie', 'carrelage'],
  agriculture: ['semence', 'engrais', 'tracteur', 'récolte', 'culture', 'plant', 'aliment animal', 'ferme'],
  animaux: ['chien', 'chat', 'mouton', 'chèvre', 'poule', 'volaille', 'oiseau', 'poisson', 'animal', 'ladoum', 'berger', 'bovin', 'vache'],
  alimentation: ['restauration', 'cuisine', 'traiteur', 'plat', 'repas', 'patisserie', 'gâteau', 'gateau', 'bissap', 'bouye', 'fast food', 'burger', 'pizza', 'thiebou', 'yassa', 'fataya', 'dibiterie', 'nourriture', 'boisson', 'jus', 'épice', 'gâteau'],
  education: ['livre', 'cahier', 'fourniture', 'cours', 'formation', 'scolaire', 'école', 'université', 'stylo'],
  jeux_loisirs: ['jeux', 'console', 'ps5', 'ps4', 'xbox', 'nintendo', 'ballon', 'sport', 'guitare', 'musique', 'jouet'],
  pro: ['machine', 'professionnel', 'couture', 'coiffure', 'restauration', 'médical', 'industrie', 'bureau'],
  services: ['service', 'réparation', 'dépannage', 'ménage', 'transport', 'déménagement', 'développement', 'design', 'freelance'],
  emploi: ['emploi', 'travail', 'job', 'stage', 'cdi', 'cdd', 'recrutement', 'offre', 'salaire'],
  autre_divers: ['autre', 'divers', 'solaire', 'panneau solaire', 'batterie solaire', 'voyage', 'billet', 'ticket', 'événement', 'evenement', 'occasion', 'divers', 'chose']
};

const cleanPhone = (num) => (num || '').replace(/^\+?221\s*/, '').replace(/\s+/g, '').trim();

const getMaxPhotosAllowed = (plan) => {
  if (plan === 'premium' || plan === 'forfait_premium') return 6;
  if (
    plan === 'pro' ||
    plan === 'standard' ||
    plan === '5000' ||
    plan === 'forfait_basique' ||
    plan === 'pass_semaine' ||
    plan === 'pass_15jours'
  ) return 4;
  return 3; // Nouveaux membres / Gratuit
};

const getMaxMonthlyListingsAllowed = (plan) => {
  if (plan === 'premium' || plan === 'forfait_premium') return 999999;
  if (
    plan === 'pro' ||
    plan === 'standard' ||
    plan === '5000' ||
    plan === 'forfait_basique' ||
    plan === 'pass_semaine' ||
    plan === 'pass_15jours'
  ) return 30;
  return 3; // Nouveaux membres / Gratuit
};

const InputWrapper = ({ label, icon, children, required }) => (
  <div style={{ marginBottom: '1.2rem', width: '100%', boxSizing: 'border-box' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>
      {label} {required && '*'}
    </label>
    <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', background: '#FAFAF9', width: '100%', boxSizing: 'border-box' }}>
      {icon && (
        <div style={{ padding: '0 12px', color: '#94A3B8', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  </div>
);

const FastInput = ({ value = '', onChange, ...props }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [localVal, setLocalVal] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setLocalVal(value);
  }

  return (
    <input
      value={localVal}
      onChange={(evt) => setLocalVal(evt.target.value)}
      onBlur={() => onChange({ target: { name: props.name, value: localVal } })}
      {...props}
    />
  );
};

const FastTextarea = ({ value = '', onChange, ...props }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [localVal, setLocalVal] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setLocalVal(value);
  }

  return (
    <textarea
      value={localVal}
      onChange={(evt) => setLocalVal(evt.target.value)}
      onBlur={() => onChange({ target: { name: props.name, value: localVal } })}
      {...props}
    />
  );
};



const categoryDescriptionTemplates = {
  telephones_tablettes: `📱 Modèle & Capacité : [Ex: iPhone 13 Pro 128Go]
🔋 État Batterie : [Ex: 88%]
📦 Accessoires inclus : [Ex: Chargeur d'origine + Coque offerte]
✅ État général : [Ex: Très bon état, aucune rayure]
📍 Disponible immédiatement à Dakar avec possibilité de livraison.`,

  friperie: `👚 Type de friperie : [Ex: Balle entière de t-shirts / Robes fripe 1er choix]
📦 Provenance & Qualité : [Ex: 1er Choix - Qualité supérieure]
⚖️ Quantité : [Ex: Balle de 45kg / Vente en gros & détail]
💰 Prix dégressif selon la quantité commandée !
📍 Stock disponible à Dakar. Livraison rapide dans les régions.`,

  alimentation: `🍲 Nom de la spécialité : [Ex: Thieboudienne Penda Mbaye / Buffet Traiteur]
👨‍🍳 Préparation : [Ex: Fait maison avec ingrédients locaux frais]
📦 Portion : [Ex: Par plat individuel ou Commande pour événements]
🛵 Service de livraison rapide à domicile ou au bureau.`,

  habillement: `👗 Nom du modèle : [Ex: Robe Wax sur mesure / Ensemble Tissu]
📏 Tailles disponibles : [Ex: S, M, L, XL]
🎨 Couleur & Tissu : [Ex: Tissu haute qualité, ne déteint pas]
✨ Produit neuf. Possibilité d'essayage sur place.`,

  vehicules: `🚗 Marque & Modèle : [Ex: Toyota Corolla 2018]
⛽ Carburant & Boîte : [Ex: Essence / Automatique]
流域 Kilométrage : [Ex: 85 000 km]
📄 Papiers : [Ex: Mutation, visite technique et assurance à jour]
🔑 Aucun frais à prévoir. Essai possible sur rendez-vous.`,

  immobilier: `🏠 Type de bien : [Ex: Appartement F3 / Terrain 300m²]
📍 Quartier : [Ex: Sacré-Cœur 3, Dakar]
🛌 Aménagement : [Ex: 2 chambres, grand salon, 2 salles de bain]
📄 Papiers : [Ex: Titre Foncier / Bail à jour]
🔑 Visite guidée disponible sur rendez-vous.`,

  informatique: `💻 Marque & Modèle : [Ex: HP EliteBook 840 G5]
🧠 Processeur & RAM : [Ex: Core i5 - 16Go RAM]
💾 Stockage SSD : [Ex: 512Go SSD ultra-rapide]
🔋 Autonomie batterie : [Ex: 4h à 5h de travail]
✅ Livré avec chargeur d'origine et garantie test.`,

  accessoires: `⌚ Marque & Modèle : [Ex: Montre Casio Edifice / Sac Cuir]
🎨 Matière & Couleur : [Ex: Cuir véritable / Couleur Marron]
✨ État : [Ex: Neuf avec coffret d'origine]
📍 Disponible avec livraison rapide sur tout le Sénégal.`,

  beaute_sante: `✨ Produit : [Ex: Parfum de marque / Crème éclat teint]
🌿 Composition & Origine : [Ex: Ingrédients naturels, certifié]
📦 Format : [Ex: Flacon 100ml / Neuf scellé]
📍 Stock disponible à Dakar avec livraison.`,

  electronique: `📺 Marque & Modèle : [Ex: Smart TV Samsung 55" / Frigo LG 250L]
⚡ Type : [Ex: Électroménager / Téléviseur / Climatiseur]
📦 État & Fonctionnement : [Ex: Neuf sous carton / Très bon état, testé]
🛡️ Garantie : [Ex: 6 mois de garantie avec facture]
📍 Disponible à Dakar avec livraison rapide possible.`,

  autre_divers: `📦 Article : [Ex: Panneau solaire 200W, Ticket de concert, etc.]
✨ Détails & Spécifications : [Ex: Puissance, date de l'événement, etc.]
✅ État : [Ex: Neuf sous emballage / Très bon état]
📍 Disponible immédiatement avec livraison.`,

  default: `✨ Description détaillée de l'article :
✅ État général : [Ex: Neuf / Très bon état]
📦 Accessoires & Détails : [Ex: Inclus avec emballage]
📍 Localisation & Livraison : [Ex: Disponible à Dakar]`
};

const PublishPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', price_type: 'Fixe', price: '', location: 'Dakar', delivery: 'Aucune', contact_whatsapp: ''
  });
  const [images, setImages] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState(null);
  const [publishedProduct, setPublishedProduct] = useState(null);
  const [selectedBoost, setSelectedBoost] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isProcessingBoost, setIsProcessingBoost] = useState(false);
  const [boostTab, setBoostTab] = useState('boost'); // 'boost' or 'standard'
  const [boostRequested, setBoostRequested] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryViewMode, setCategoryViewMode] = useState('compact');
  const [recentCategories, setRecentCategories] = useState([]);
  const [activeSubcatModal, setActiveSubcatModal] = useState(null);
  const [showMobilePreviewModal, setShowMobilePreviewModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const locationQuery = useLocation();

  useEffect(() => {
    try {
      const savedCats = JSON.parse(localStorage.getItem('colobane_recent_cats') || '[]');
      if (Array.isArray(savedCats)) setRecentCategories(savedCats);
    } catch (_e) {}

    const params = new URLSearchParams(locationQuery.search);
    if (params.get('mode') === 'reel') {
      toast('🎬 Mode Publication Reel TikTok activé ! Ajoutez le lien de votre vidéo.', { icon: '🎥', duration: 4000 });
    }
  }, [locationQuery]);

  // Draft Recovery & Auto-saving (Option B)
  useEffect(() => {
    try {
      const savedDraft = JSON.parse(localStorage.getItem('colobane_publish_draft_v1') || 'null');
      if (savedDraft && savedDraft.formData && (savedDraft.formData.title || savedDraft.previews?.length)) {
        toast((t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0F172A' }}>📝 Brouillon d'annonce retrouvé !</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  if (savedDraft.formData) setFormData(savedDraft.formData);
                  if (savedDraft.selectedCategory) setSelectedCategory(savedDraft.selectedCategory);
                  toast.dismiss(t.id);
                  const imgCount = savedDraft.savedImageCount || 0;
                  let msg = imgCount > 0
                    ? `Brouillon restauré ! 📸 ${imgCount} photo(s) à re-sélectionner.`
                    : "Brouillon restauré avec succès ! ✨";
                  if (savedDraft.hadVideo) {
                    msg += " 🎥 Vidéo à re-sélectionner.";
                  }
                  toast.success(msg);
                }}
                style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Restaurer
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('colobane_publish_draft_v1');
                  toast.dismiss(t.id);
                }}
                style={{ padding: '6px 12px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Effacer
              </button>
            </div>
          </div>
        ), { duration: 8000 });
      }
    } catch (_e) {}
  }, []);

  useEffect(() => {
    if (formData.title || formData.price || previews.length > 0) {
      try {
        localStorage.setItem('colobane_publish_draft_v1', JSON.stringify({
          formData,
          selectedCategory,
          savedImageCount: previews.length, // Sauvegarder le compte, pas les blob URLs
          hadVideo: !!videoFile || !!formData.video_url
        }));
      } catch (_e) {}
    }
  }, [formData, selectedCategory, previews, videoFile]);

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setCategorySearch('');
    try {
      const updated = [catId, ...recentCategories.filter(c => c !== catId)].slice(0, 4);
      setRecentCategories(updated);
      localStorage.setItem('colobane_recent_cats', JSON.stringify(updated));
    } catch (_e) {}

    const selectedCatObj = categories.find((c) => c.id === catId);
    if (selectedCatObj) {
      if (getSubcategoryField(selectedCatObj)) {
        setActiveSubcatModal(selectedCatObj);
      } else {
        setStep(3);
      }
    }
  };

  const handlePickSubcategory = (subcatOption) => {
    if (!activeSubcatModal) return;
    const catId = activeSubcatModal.id;
    setSelectedCategory(catId);
    
    const subcatField = activeSubcatModal.fields?.find(f => f.name === 'type' || f.name === 'subcategory') || activeSubcatModal.fields?.[0];
    if (subcatField && subcatOption && subcatOption !== 'Toutes') {
      setFormData(prev => ({ ...prev, [subcatField.name]: subcatOption }));
    }
    
    setActiveSubcatModal(null);
    setStep(3);
  };

  const renderLivePreview = () => (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', position: 'sticky', top: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--primary)', fontWeight: '800', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
        Aperçu en Direct
      </div>

      <div style={{ border: '1.5px solid #F1F5F9', background: 'var(--card-bg)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#F1F5F9', overflow: 'hidden' }}>
          {previews.length > 0 ? (
            <img src={previews[0]} alt="Preview" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: '10px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Aucune photo</span>
            </div>
          )}
          <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', color: 'var(--text-main)', fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', backdropFilter: 'blur(4px)', zIndex: 10 }}>
            {formData.condition || 'Occasion'}
          </span>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', lineHeight: '1.4', margin: '0', color: 'var(--text-main)', height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {formData.title || "Titre de l'annonce"}
          </h3>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
            {formData.price_type === 'Gratuit' ? 'Gratuit' : formData.price_type === 'Échange' ? 'Échange' : `${Number(formData.price || 0).toLocaleString('fr-FR')} FCFA`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px', fontWeight: '600' }}>
              {profile?.boutique_name || profile?.full_name || 'Vendeur'}
            </span>
            <span>•</span>
            <span>{formData.location || 'Dakar'}</span>
          </div>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ width: '100%', height: '44px', background: '#25D366', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '800', fontSize: '0.9rem', opacity: 0.9 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Contacter
          </div>
        </div>
      </div>
    </div>
  );


  useEffect(() => {
    if (user === null) {
      navigate('/auth');
      return;
    }

    // Pre-fill WhatsApp number if available
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('whatsapp_number, city, subscription_plan, subscription_end_date, account_type')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          let currentPlan = data.subscription_plan;
          let subEndDate = data.subscription_end_date;

          // Vérification de l'expiration de l'abonnement
          if (subEndDate && new Date(subEndDate) < new Date()) {
            currentPlan = 'none';
            // Mise à jour asynchrone non bloquante dans la base de données
            supabase
              .from('profiles')
              .update({ subscription_plan: 'none', subscription_end_date: null })
              .eq('id', user.id)
              .then(() => {});
            toast('Votre abonnement a expiré. Vous êtes passé au plan gratuit.', { icon: '⚠️', duration: 6000 });
          }

          const updatedProfile = { ...data, subscription_plan: currentPlan, subscription_end_date: null };
          setProfile(updatedProfile);
          setFormData(prev => ({
            ...prev,
            contact_whatsapp: cleanPhone(data.whatsapp_number || ''),
            location: data.city || 'Dakar'
          }));

          // Vérification du quota d'annonces mensuelles selon l'abonnement
          const maxMonthly = getMaxMonthlyListingsAllowed(currentPlan);
          if (maxMonthly < 999999) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count: prodCount, error: countError } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('seller_id', user.id)
              .gte('created_at', startOfMonth.toISOString());

            if (!countError) {
              setMonthlyCount(prodCount || 0);
              if ((prodCount || 0) >= maxMonthly) {
                setHasReachedLimit(true);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching profile for prefill', err);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  if (user === null) return null;

  const category = categories.find((c) => c.id === selectedCategory);

  const getSubcategoryField = (cat) => {
    if (!cat) return null;
    return cat.fields.find(f => ['type', 'property_type', 'service_type', 'job_type'].includes(f.name));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    const maxAllowed = getMaxPhotosAllowed(profile?.subscription_plan);
    const totalFiles = images.length + files.length;

    if (totalFiles > maxAllowed) {
      if (maxAllowed === 3) {
        toast.error(`Membre gratuit : 3 photos maximum par annonce. Abonnez-vous (5 000 FCFA) pour débloquer 4 photos !`);
      } else if (maxAllowed === 4) {
        toast.error(`Abonnement 5 000 FCFA : 4 photos max par annonce. Passez au Premium (10 000 FCFA) pour 6 photos !`);
      } else {
        toast.error(`Limite maximale de 6 photos atteinte par annonce.`);
      }
      return;
    }
    
    const newImages = [...images, ...files];
    setImages(newImages);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageChange(e);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const setCoverImage = (index) => {
    if (index === 0 || previews.length <= 1) return;
    const newPreviews = [...previews];
    const [selectedPrev] = newPreviews.splice(index, 1);
    newPreviews.unshift(selectedPrev);
    setPreviews(newPreviews);

    if (images.length > index) {
      const newImages = [...images];
      const [selectedImg] = newImages.splice(index, 1);
      newImages.unshift(selectedImg);
      setImages(newImages);
    }
    toast.success("Photo principale de couverture mise à jour ! ⭐");
  };

  const nextStep = async () => {
    if (step === 1 && !selectedCategory) {
      toast.error("Veuillez sélectionner une catégorie.");
      return;
    }
    if (step === 1) {
      const subcat = getSubcategoryField(category);
      if (!subcat) {
        setStep(3);
        return;
      }
    }
    if (step === 2) {
      const subcat = getSubcategoryField(category);
      if (subcat && !formData[subcat.name]) {
        toast.error("Veuillez sélectionner une sous-catégorie.");
        return;
      }
    }
    if (step === 3) {
      if (!formData.title || !formData.description) {
        toast.error("Veuillez remplir le titre et la description.");
        return;
      }

      // 1. Bloquer la soumission si aucune photo n'est ajoutée
      if (!images || images.length === 0) {
        toast.error("Au moins une photo est obligatoire pour publier une annonce.");
        return;
      }

      // 2. Vérification de suspension de compte pour récidive d'infraction
      if (user?.id && checkIsUserSuspendedForModeration(user.id)) {
        const msg = "⛔ Votre compte est suspendu pour tentative de publication de contenu strictement interdit (2ème infraction). Contactez le support.";
        toast.error(msg, { duration: 8000 });
        setErrorMsg(msg);
        return;
      }

      // 3. Moteur de modération avancée Niveau 3 (Titre + Description + Category + Metadata + LeetSpeak)
      const { title, description, ...metadata } = formData;
      const analysis = analyzeContentForModeration({
        title,
        description,
        category: selectedCategory,
        metadata
      });

      if (analysis.isProhibited) {
        // Enregistrement de l'infraction & vérification de la suspension
        const violation = trackViolationAttempt(user?.id);
        const errorMsgStr = violation.isSuspended
          ? `⛔ Compte Suspendu : Tentative de publication de contenu interdit ("${analysis.keyword}"). Votre compte a été suspendu pour récidive.`
          : `${analysis.reason} (Avertissement 1/2)`;

        toast.error(errorMsgStr, { duration: 8000 });
        setErrorMsg(errorMsgStr);
        return;
      }

      // 4. Limite anti-spam de 2 annonces par catégorie dans les dernières 24h (compte non-premium)
      const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'forfait_premium';
      if (!isPremium && user?.id && selectedCategory) {
        try {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { count: catCount, error: countErr } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .eq('category', selectedCategory)
            .gte('created_at', twentyFourHoursAgo);

          if (!countErr && (catCount || 0) >= 2) {
            toast.error("Vous avez déjà publié 2 annonces dans cette catégorie aujourd'hui. Passez en premium pour publier sans limite.");
            return;
          }
        } catch (e) {
          console.warn("Anti-spam check error", e);
        }
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step === 3) {
      const subcat = getSubcategoryField(category);
      if (!subcat) {
        setStep(1);
        return;
      }
    }
    setStep(step - 1);
  };

  const uploadImages = async () => {
    const uploadPromises = images.map(async (image) => {
      const compressionOptions = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp'
      };
      const compressedImage = await imageCompression(image, compressionOptions);
      const fileExt = 'webp';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, compressedImage);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      return data.publicUrl;
    });
    return Promise.all(uploadPromises);
  };

  const handleConfirmBoost = async (e) => {
    e.preventDefault();
    if (!paymentPhone.trim()) {
      toast.error('Veuillez entrer le numéro utilisé pour le paiement.');
      return;
    }
    
    setIsProcessingBoost(true);
    toast.loading('Envoi de la demande...', { id: 'boost-publish' });

    const adminNumber = "221773713175";
    const text = encodeURIComponent(`Nouvelle demande de Boost ! L'utilisateur ${profile?.full_name || user.id} a payé ${selectedBoost.price}F pour booster l'annonce "${publishedProduct.title}" avec le numéro ${paymentPhone}. Vérifiez Wave et activez le boost.`);
    window.open(`https://wa.me/${adminNumber}?text=${text}`, '_blank');

    try {
      const { error } = await supabase.from('payment_requests').insert([{
        user_id: user.id,
        plan_type: `boost_product_${selectedBoost.days}d_${publishedProduct.id}`,
        amount: selectedBoost.price,
        phone_used: paymentPhone,
        status: 'pending'
      }]);

      if (error) throw error;
      
      toast.success('Demande envoyée ! Le boost sera activé après vérification.', { id: 'boost-publish', duration: 5000 });
      setBoostRequested(true);
      setSelectedBoost(null);
      setPaymentPhone('');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi de la demande.', { id: 'boost-publish' });
    } finally {
      setIsProcessingBoost(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasReachedLimit) {
      toast.error("Vous avez atteint la limite de 3 annonces gratuites ce mois-ci. Veuillez vous abonner.");
      return;
    }

    // 1. Bloquer la soumission uniquement si ni photo ni vidéo n'est fournie
    if ((!images || images.length === 0) && !formData.video_url && !videoFile) {
      toast.error("Au moins une photo ou une vidéo est obligatoire pour publier une annonce.");
      setErrorMsg("Au moins une photo ou une vidéo est obligatoire pour publier une annonce.");
      return;
    }

    // 2. Vérification de suspension de compte pour récidive d'infraction
    if (user?.id && checkIsUserSuspendedForModeration(user.id)) {
      const msg = "⛔ Votre compte est suspendu pour tentative de publication de contenu strictement interdit (2ème infraction). Contactez le support.";
      toast.error(msg, { duration: 8000 });
      setErrorMsg(msg);
      return;
    }

    // 3. Moteur de modération avancée Niveau 3
    const { title, description, ...metadata } = formData;
    const analysis = analyzeContentForModeration({
      title,
      description,
      category: selectedCategory,
      metadata
    });

    if (analysis.isProhibited) {
      const violation = trackViolationAttempt(user?.id);
      const errorMsgStr = violation.isSuspended
        ? `⛔ Compte Suspendu : Tentative de publication de contenu interdit ("${analysis.keyword}"). Votre compte a été suspendu pour récidive.`
        : `${analysis.reason} (Avertissement 1/2)`;

      toast.error(errorMsgStr, { duration: 8000 });
      setErrorMsg(errorMsgStr);
      return;
    }

    // 4. Anti-Spam (Max 2 annonces par catégorie dans les dernières 24h)
    const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'forfait_premium';
    if (!isPremium && user?.id && selectedCategory) {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: catCount, error: countErr } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .eq('category', selectedCategory)
          .gte('created_at', twentyFourHoursAgo);

        if (!countErr && (catCount || 0) >= 2) {
          const msg = "Vous avez déjà publié 2 annonces dans cette catégorie aujourd'hui. Passez en premium pour publier sans limite.";
          toast.error(msg);
          setErrorMsg(msg);
          return;
        }
      } catch (e) {
        console.warn("Anti-spam check error", e);
      }
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { error: profileError } = await supabase.from('profiles').upsert([{ id: user.id }], { onConflict: 'id' });
      if (profileError && profileError.code !== '23505') console.warn('Profile sync issue:', profileError);

      const imageUrls = await uploadImages();

      let finalVideoUrl = formData.video_url || null;
      if (videoFile) {
        toast.loading("Upload de la vidéo en cours...", { id: 'vid-upload' });
        const ext = videoFile.name.split('.').pop() || 'mp4';
        const fileName = `video_${user.id}_${crypto.randomUUID()}.${ext}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: vidUploadErr } = await supabase.storage.from('products').upload(filePath, videoFile, { upsert: true });
        if (!vidUploadErr) {
          const { data: pubData } = supabase.storage.from('products').getPublicUrl(filePath);
          finalVideoUrl = pubData.publicUrl;
        }
        toast.dismiss('vid-upload');
      }

      const { title, description, price, price_type, location, delivery, contact_whatsapp, ...metadata } = formData;
      
      let finalPrice = 0;
      if (price_type !== 'Gratuit' && price_type !== 'Échange') {
        finalPrice = typeof price === 'string' ? parseFloat(price.replace(/\s/g, '')) : parseFloat(price);
      }

      // Handle "Autre" custom fields
      const processedMetadata = { ...metadata, price_type, delivery, contact_whatsapp, video_url: finalVideoUrl };
      Object.keys(processedMetadata).forEach(key => {
        if (processedMetadata[key] === 'Autre' && processedMetadata[`custom_${key}`]) {
          processedMetadata[key] = processedMetadata[`custom_${key}`];
        }
        if (key.startsWith('custom_')) {
          delete processedMetadata[key];
        }
      });

      const finalImages = imageUrls.length > 0 ? imageUrls : ['/hero.png'];

      const { data: insertedData, error: insertError } = await supabase.from('products').insert([{
        seller_id: user.id,
        title: title || 'Sans titre',
        description: description || '',
        price: isNaN(finalPrice) ? 0 : finalPrice,
        location: (location === 'Autre' && formData.custom_location) ? formData.custom_location : (location || 'Sénégal'),
        category: selectedCategory,
        images: finalImages,
        metadata: processedMetadata,
        is_boosted: isPremium,
        status: 'available'
      }]).select('id, title').single();

      if (insertError) throw insertError;

      toast.success("Annonce publiée avec succès !");
      setPublishedProduct(insertedData);
      
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "Une erreur s'est produite lors de la publication.");
      toast.error("Erreur de publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', background: 'white', minHeight: '100vh', position: 'relative' }}>
      
      {/* Écran de succès */}
      {publishedProduct ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '40px 20px', textAlign: 'center', animation: 'fadeIn 0.4s ease-out' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 30px rgba(34, 197, 94, 0.3)', animation: 'scaleUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 10px', fontFamily: 'var(--font-heading)' }}>Publiée avec succès !</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0 0 8px', lineHeight: '1.5' }}>Votre annonce <strong>"{publishedProduct.title}"</strong> est maintenant en ligne.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 24px' }}>Elle est visible par tous les utilisateurs de ColobaneMarket.</p>
          
          {/* Boost Section */}
          <div style={{ width: '100%', maxWidth: '360px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', textAlign: 'left', animation: 'fadeIn 0.6s ease-out 0.3s both' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '16px' }}>
              <button 
                type="button"
                onClick={() => setBoostTab('boost')} 
                style={{ flex: 1, padding: '12px 0', border: 'none', background: 'none', fontWeight: '700', fontSize: '0.9rem', color: boostTab === 'boost' ? '#f59e0b' : 'var(--text-muted)', borderBottom: boostTab === 'boost' ? '3px solid #f59e0b' : '3px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                🚀 Booster
              </button>
              <button 
                type="button"
                onClick={() => setBoostTab('standard')} 
                style={{ flex: 1, padding: '12px 0', border: 'none', background: 'none', fontWeight: '700', fontSize: '0.9rem', color: boostTab === 'standard' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: boostTab === 'standard' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer' }}
              >
                Standard (Sans boost)
              </button>
            </div>

            {boostTab === 'boost' && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                {boostRequested ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✅</div>
                    <h4 style={{ color: '#10b981', fontWeight: '800', margin: '0 0 8px 0' }}>Demande envoyée !</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Le boost sera activé après validation de votre paiement.</p>
                  </div>
                ) : selectedBoost ? (
                  <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    <button type="button" onClick={() => setSelectedBoost(null)} style={{ background: 'none', border: 'none', color: '#f59e0b', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px', padding: 0 }}>
                      ← Retour aux forfaits
                    </button>
                    <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '14px', marginBottom: '16px', textAlign: 'center' }}>
                      <p style={{ color: '#78350f', fontSize: '0.9rem', margin: '0 0 10px 0', fontWeight: '600' }}>
                        Option : <strong>Boost {selectedBoost.days} Jours ({selectedBoost.price} FCFA)</strong>
                      </p>
                      <button 
                        type="button"
                        onClick={() => openWavePayment()}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', background: '#0EA5E9', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.2)' }}
                      >
                        👉 Ouvrir Wave pour payer
                      </button>
                    </div>
                    <form onSubmit={handleConfirmBoost}>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                          Numéro Wave utilisé pour le paiement
                        </label>
                        <input 
                          type="tel" 
                          value={paymentPhone}
                          onChange={(e) => setPaymentPhone(e.target.value)}
                          placeholder="Ex: 77 123 45 67"
                          style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
                          required
                        />
                      </div>
                      <button type="submit" disabled={isProcessingBoost} style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '800', fontSize: '1rem', background: '#f59e0b', color: 'white', border: 'none', cursor: 'pointer', display: 'block', opacity: isProcessingBoost ? 0.7 : 1 }}>
                        {isProcessingBoost ? 'Envoi...' : 'Confirmer mon paiement'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#78350f', fontSize: '0.85rem', margin: '0 0 16px 0', lineHeight: '1.4', fontWeight: '500' }}>
                      Multipliez vos vues par 10 et vendez en un temps record ! Choisissez votre pack de Boost :
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button type="button" onClick={() => setSelectedBoost({ price: 500, days: 1, title: 'Boost Flash' })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', background: '#FAFAF9', color: '#B45309', border: '1.5px solid #FCD34D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: '800' }}>⚡ Boost Flash</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#92400E' }}>1 Annonce (24 Heures)</span>
                        </div>
                        <span style={{ fontWeight: '900', fontSize: '1.1rem' }}>500 F</span>
                      </button>

                      <button type="button" onClick={() => setSelectedBoost({ price: 1500, days: 7, title: 'Pack Semaine' })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', background: '#FFFBEB', color: '#B45309', border: '2px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: '800' }}>⭐️ Pack Semaine</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#92400E' }}>Jusqu'à 2 Annonces (7 Jours)</span>
                        </div>
                        <span style={{ fontWeight: '900', fontSize: '1.1rem' }}>1 500 F</span>
                      </button>

                      <button type="button" onClick={() => setSelectedBoost({ price: 5000, days: 30, title: 'Pack Mensuel' })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', background: '#FAFAF9', color: '#B45309', border: '1.5px solid #FCD34D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: '800' }}>🚀 Pack Mensuel</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#92400E' }}>Jusqu'à 5 Annonces (30 Jours)</span>
                        </div>
                        <span style={{ fontWeight: '900', fontSize: '1.1rem' }}>5 000 F</span>
                      </button>

                      <button type="button" onClick={() => setSelectedBoost({ price: 10000, days: 30, title: 'Pack Max' })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', background: '#FEF2F2', color: '#B91C1C', border: '1.5px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: '800' }}>🔥 Pack Max</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#7F1D1D' }}>Jusqu'à 12 Annonces (30 Jours)</span>
                        </div>
                        <span style={{ fontWeight: '900', fontSize: '1.1rem' }}>10 000 F</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {boostTab === 'standard' && (
              <div style={{ animation: 'fadeIn 0.2s ease-out', textAlign: 'center', padding: '10px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                  Votre annonce est publiée gratuitement. Vous pourrez toujours la booster plus tard depuis votre profil.
                </p>
                <div style={{ fontSize: '2.5rem' }}>🍃</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '380px' }}>
            <button
              type="button"
              onClick={() => {
                const productUrl = `https://colobanemarketplac.com/product/${publishedProduct.id}`;
                const text = encodeURIComponent(
                  `🔥 Nouveau produit disponible sur ColobaneMarket !\n📌 ${publishedProduct.title}\n💰 Prix : ${publishedProduct.price ? Number(publishedProduct.price).toLocaleString('fr-FR') + ' FCFA' : 'Sur demande'}\n\n👉 Cliquez ici pour voir et commander : ${productUrl}`
                );
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
              }}
              className="active-scale hover-lift"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                fontWeight: '800',
                fontSize: '1.05rem',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(37, 211, 102, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              📲 Partager sur mon Statut WhatsApp
            </button>

            <button
              type="button"
              onClick={() => {
                setPublishedProduct(null);
                setImages([]);
                setPreviews([]);
                setVideoFile(null);
                setFormData({ title: '', description: '', price_type: 'Fixe', price: '', location: 'Dakar', delivery: 'Aucune', contact_whatsapp: '' });
                setSelectedCategory('');
                setStep(1);
                toast.success("Prêt pour la publication suivante ! ⚡");
              }}
              className="active-scale"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: '0.98rem',
                background: '#F1F5F9',
                color: 'var(--text-main)',
                border: '1.5px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              ⚡ Enchaîner avec une autre annonce (5s)
            </button>

            <button 
              onClick={() => navigate(`/product/${publishedProduct.id}`)} 
              className="active-scale" 
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.9rem',
                background: 'transparent',
                color: 'var(--primary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              👉 Voir mon annonce en ligne
            </button>
          </div>
        </div>
      ) : (
      <>
      {hasReachedLimit ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '40px 20px', textAlign: 'center', animation: 'fadeIn 0.4s ease-out' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#fffbeb', border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.15)' }}>
            <span style={{ fontSize: '3rem' }}>⚠️</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 16px', fontFamily: 'var(--font-heading)' }}>Limite d'annonces atteinte</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: '0 0 12px', lineHeight: '1.5', maxWidth: '400px' }}>
            Vous avez publié <strong>{monthlyCount} annonces</strong> ce mois-ci.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0 0 32px', lineHeight: '1.5', maxWidth: '400px' }}>
            La formule gratuite est limitée à un maximum de <strong>3 annonces par mois</strong>. Pour continuer à publier, veuillez activer un forfait.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '360px' }}>
            <button onClick={() => navigate('/subscription')} className="active-scale" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '1.05rem', background: '#f59e0b', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)' }}>
              Upgradez vers Premium (Dès 5000F)
            </button>
            <button onClick={() => navigate('/')} className="active-scale" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '1.05rem', background: '#F1F5F9', color: 'var(--text-main)', border: 'none', cursor: 'pointer' }}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      ) : (
        <>
        {/* App Bar */}
      <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 100, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <button onClick={() => step > 1 ? prevStep() : navigate(-1)} className="touch-target active-scale" style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', fontWeight: '800', margin: 0, paddingRight: '40px', fontFamily: 'var(--font-heading)' }}>
          {step === 1 ? 'Catégorie' : step === 2 ? 'Sous-catégorie' : step === 3 ? 'Détails de l\'annonce' : 'Prix & Livraison'}
        </h1>
      </div>

      {/* Stepper Progress */}
      <div style={{ display: 'flex', padding: '16px 20px', gap: '8px', background: 'white' }}>
        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: step >= 1 ? 'var(--primary)' : '#F1F5F9', transition: 'all 0.3s' }}></div>
        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: step >= 2 ? 'var(--primary)' : '#F1F5F9', transition: 'all 0.3s' }}></div>
        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: step >= 3 ? 'var(--primary)' : '#F1F5F9', transition: 'all 0.3s' }}></div>
        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: step >= 4 ? 'var(--primary)' : '#F1F5F9', transition: 'all 0.3s' }}></div>
      </div>

      <div style={{ padding: '12px 20px 160px 20px' }}>
        {errorMsg && <div style={{ color: '#e74c3c', background: '#fdf0ed', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>{errorMsg}</div>}
        
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Que vendez-vous ?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.95rem' }}>Sélectionnez la catégorie qui correspond le mieux à votre article.</p>
            
            {/* Recent Categories (if seller published before) */}
            {recentCategories.length > 0 && !categorySearch && (
              <div style={{ marginBottom: '16px', background: '#FFFBEB', borderRadius: '16px', padding: '12px 14px', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#B45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⭐</span> Vos catégories récentes (Accès 1-Clic) :
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {recentCategories.map(catId => {
                    const catObj = categories.find(c => c.id === catId);
                    if (!catObj) return null;
                    return (
                      <button
                        key={catId}
                        type="button"
                        onClick={() => handleSelectCategory(catId)}
                        className="active-scale"
                        style={{ padding: '6px 12px', borderRadius: '12px', background: '#F59E0B', color: 'white', border: 'none', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span>{catObj.icon}</span>
                        <span>{catObj.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Barre de recherche de catégorie */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <input 
                type="text" 
                value={categorySearch} 
                onChange={(e) => setCategorySearch(e.target.value)} 
                placeholder="Rechercher : iPhone, voiture, robe, mouton..." 
                style={{ width: '100%', padding: '14px 14px 14px 42px', borderRadius: '14px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', background: '#FAFAF9', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
              />
              {categorySearch && (
                <button onClick={() => setCategorySearch('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>✕</button>
              )}
            </div>

            {/* View Mode Switcher - Modern Segmented Control */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#F1F5F9', padding: '4px', borderRadius: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', paddingLeft: '10px' }}>Vue :</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setCategoryViewMode('compact')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: categoryViewMode === 'compact' ? 'white' : 'transparent',
                    color: categoryViewMode === 'compact' ? 'var(--primary)' : '#64748B',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: categoryViewMode === 'compact' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ⚡ Ultra-Compact
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryViewMode('grid')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: categoryViewMode === 'grid' ? 'white' : 'transparent',
                    color: categoryViewMode === 'grid' ? 'var(--primary)' : '#64748B',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: categoryViewMode === 'grid' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🔲 Cartes Détaillées
                </button>
              </div>
            </div>

            {(() => {
              const query = categorySearch.toLowerCase().trim();
              const filtered = query ? categories.filter(cat => {
                if (cat.name.toLowerCase().includes(query)) return true;
                const keywords = categoryKeywords[cat.id] || [];
                return keywords.some(kw => kw.includes(query) || query.includes(kw));
              }) : categories;

              const categorySubExamples = {
                friperie: 'Vêtements, Balles 1er Choix, Robes...',
                telephones_tablettes: 'iPhone, Samsung, iPad...',
                informatique: 'Laptops, Écrans, PC...',
                electronique: 'TV, Frigo, Climatiseur...',
                maison_jardin: 'Canapés, Lits, Cuisine...',
                habillement: 'Robes, Baskets, Sacs...',
                accessoires: 'Montres, Lunettes, Bijoux...',
                beaute_sante: 'Parfums, Soins, Perruques...',
                vehicules: 'Voitures, Motos, Pièces...',
                immobilier: 'Appartements, Terrains...',
                animaux: 'Moutons, Chiens, Ladoum...',
                alimentation: 'Plats cuisinés, Traiteur, Gâteaux, Jus...',
                pro: 'Équipements & Machines...'
              };

              return (
                <>
                  {query && filtered.length > 0 && (
                    <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1.5px solid #93C5FD', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', animation: 'fadeIn 0.2s ease-out' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.3rem' }}>✨</span>
                        <div>
                          <div style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Catégorie détectée</div>
                          <div style={{ fontSize: '1rem', fontWeight: '900', color: '#1E3A8A' }}>{filtered[0].name}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(filtered[0].id)}
                        className="active-scale hover-lift"
                        style={{ padding: '8px 16px', borderRadius: '12px', background: '#2563EB', color: 'white', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                      >
                        ⚡ Sélectionner
                      </button>
                    </div>
                  )}

                  {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                  <p style={{ fontWeight: '600', fontSize: '1rem', margin: '0 0 6px 0' }}>Aucune catégorie trouvée</p>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>Essayez un autre mot-clé ou <button onClick={() => setCategorySearch('')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: '0.85rem' }}>voir toutes les catégories</button></p>
                </div>
              ) : categoryViewMode === 'compact' ? (
                /* Mode Ultra-Compact (Tout voir sur un seul écran sans scroller) */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                  {filtered.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const catColor = cat.color || '#007aff';
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className="touch-target active-scale"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: isSelected ? 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F5 100%)' : '#FFFFFF',
                          border: isSelected ? '2px solid var(--primary)' : '1.5px solid #F1F5F9',
                          borderRadius: '14px',
                          padding: '10px 12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 4px 12px rgba(139, 28, 49, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '20px', flexShrink: 0, color: catColor }}>{cat.icon}</span>
                        <span style={{
                          fontWeight: '800',
                          fontSize: '0.83rem',
                          color: isSelected ? 'var(--primary)' : '#0F172A',
                          lineHeight: '1.2',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Mode Cartes Détaillées Ultra-Moderne */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {filtered.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const catColor = cat.color || '#007aff';
                    return (
                      <button 
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className="touch-target active-scale"
                        style={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isSelected ? 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F5 100%)' : '#FFFFFF',
                          border: isSelected ? '2px solid var(--primary)' : '1.5px solid #F1F5F9',
                          borderRadius: '22px',
                          padding: '20px 12px 16px 12px',
                          gap: '10px',
                          boxShadow: isSelected ? '0 8px 24px rgba(139, 28, 49, 0.15)' : '0 4px 16px rgba(0,0,0,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', boxShadow: '0 2px 6px rgba(139, 28, 49, 0.3)' }}>
                            ✓
                          </div>
                        )}
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: `${catColor}14`, color: catColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: `0 4px 12px ${catColor}15` }}>
                          {cat.icon}
                        </div>
                        <div style={{ textAlign: 'center', width: '100%' }}>
                          <span style={{ display: 'block', fontWeight: '800', color: isSelected ? 'var(--primary)' : '#0F172A', fontSize: '0.92rem', lineHeight: '1.25', marginBottom: '4px' }}>
                            {cat.name}
                          </span>
                          {categorySubExamples[cat.id] && (
                            <span style={{ display: 'block', fontSize: '0.73rem', color: isSelected ? '#8A1C1C' : '#64748B', fontWeight: '500', lineHeight: '1.25', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {categorySubExamples[cat.id]}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
                </>
              );
            })()}
            
            <button onClick={nextStep} disabled={!selectedCategory} className="btn-primary active-scale" style={{ width: '100%', marginTop: '32px', padding: '1.1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              Continuer <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {step === 2 && getSubcategoryField(category) && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Précisez le type</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>Quelle sous-catégorie correspond le mieux ?</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {getSubcategoryField(category)?.options.map(opt => {
                 const fieldName = getSubcategoryField(category).name;
                 const isSelected = formData[fieldName] === opt;
                 return (
                   <div key={opt}>
                     <button 
                       type="button"
                       onClick={() => { 
                         setFormData({...formData, [fieldName]: opt}); 
                         if (opt !== 'Autre') {
                           setTimeout(() => setStep(3), 300); 
                         }
                       }}
                       className="touch-target active-scale"
                       style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isSelected ? 'var(--primary)' : '#FAFAF9', border: isSelected ? 'none' : '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px', color: isSelected ? 'white' : 'var(--text-main)', fontWeight: '600', fontSize: '1rem', transition: 'all 0.2s' }}
                     >
                       {opt}
                       {isSelected && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                     </button>
                     {isSelected && opt === 'Autre' && (
                       <div style={{ marginTop: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                         <FastInput 
                           type="text" 
                           name={`custom_${fieldName}`} 
                           placeholder="Veuillez préciser..."
                           onChange={(e) => setFormData({...formData, [`custom_${fieldName}`]: e.target.value})}
                           value={formData[`custom_${fieldName}`] || ''}
                           style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '1rem', background: 'white' }} 
                         />
                         <button onClick={() => setStep(3)} disabled={!formData[`custom_${fieldName}`]} className="btn-primary active-scale" style={{ width: '100%', marginTop: '12px', padding: '1rem', borderRadius: '12px', fontWeight: '700' }}>
                           Continuer
                         </button>
                       </div>
                     )}
                   </div>
                 );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <style>{`
              .publish-layout {
                display: grid;
                grid-template-columns: 1fr;
                gap: 2.5rem;
                align-items: start;
              }
              @media (min-width: 1024px) {
                .publish-layout {
                  grid-template-columns: 1.6fr 1.1fr;
                }
              }
            `}</style>
            
            <div className="publish-layout">
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>Détails et Photos</h2>
                
                {/* Mobile Floating Live Preview Button */}
                <button
                  type="button"
                  onClick={() => setShowMobilePreviewModal(true)}
                  className="active-scale hide-on-desktop"
                  style={{
                    width: '100%',
                    marginBottom: '20px',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    border: '1.5px solid #93C5FD',
                    color: '#1E40AF',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.12)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>👁️</span>
                    <span>Aperçu de votre Annonce en Direct</span>
                  </div>
                  <span style={{ background: '#2563EB', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '900' }}>LIVE</span>
                </button>

                <InputWrapper label="Titre de l'annonce" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>}>
                  <FastInput type="text" name="title" placeholder="Ex: iPhone 14 Pro Max 256Go" value={formData.title} onChange={handleInputChange} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} />
                </InputWrapper>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      Description <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => {
                        const template = categoryDescriptionTemplates[selectedCategory] || categoryDescriptionTemplates.default;
                        setFormData(prev => ({ ...prev, description: template }));
                        toast.success("Modèle de description spécifique inséré ! ✨");
                      }}
                      className="active-scale hover-lift"
                      style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1.5px solid #FCD34D', color: '#78350F', padding: '5px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(245,158,11,0.15)' }}
                    >
                      ✨ Modèle prérempli ({categories.find(c => c.id === selectedCategory)?.name || 'Catégorie'})
                    </button>
                  </div>
                  <InputWrapper icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '14px' }}><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="14" y1="18" x2="3" y2="18"></line></svg>}>
                    <FastTextarea name="description" rows="5" placeholder="Description détaillée..." value={formData.description} onChange={handleInputChange} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', resize: 'vertical' }}></FastTextarea>
                  </InputWrapper>
                  
                  {/* Détection numéro de téléphone dans la description */}
                  {/(\+?221|0)?[7][0-9]{8}/g.test(formData.description || '') && (
                    <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '12px', background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', fontSize: '0.83rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>⚠️</span>
                      <span>Évitez de mettre votre numéro dans la description. Utilisez le champ WhatsApp prévu à cet effet.</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  {(() => {
                    const maxPhotos = getMaxPhotosAllowed(profile?.subscription_plan);
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Photos (Max {maxPhotos}) *</label>
                          {maxPhotos < 6 && (
                            <Link to="/subscription" style={{ fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '800' }}>
                              ⚡ Débloquer + de photos →
                            </Link>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                          {previews.map((src, index) => (
                            <div key={index} style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '16px', overflow: 'hidden', background: '#F1F5F9', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                              <img src={src} alt={`preview ${index}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button onClick={() => removeImage(index)} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>✕</button>
                            </div>
                          ))}
                          
                          {previews.length < maxPhotos && (
                            <label 
                              className="active-scale touch-target" 
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '16px', border: `2px dashed ${isDragging ? 'var(--primary)' : '#CBD5E1'}`, background: isDragging ? 'var(--primary-light)' : '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transition: 'all 0.2s' }}
                            >
                              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: 'var(--primary)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 28, 49, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Ajouter photo</span>
                              </div>
                              <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                            </label>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Option Vidéo Reels Pro */}
                <div style={{
                  marginTop: '1.5rem',
                  marginBottom: '1.5rem',
                  background: 'linear-gradient(135deg, #09090B 0%, #172554 40%, #BE123C 100%)',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  color: '#FFFFFF',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  boxShadow: '0 4px 20px rgba(190, 18, 60, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🎬</span>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Vidéo Reel TikTok Pro</span>
                    </div>
                    <span style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000', fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '10px' }}>FORFAIT PRO / VIP</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#CBD5E1', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                    👑 <strong>Forfait VIP (10 000F)</strong> : Reels Vidéo <strong>ILLIMITÉS</strong> pendant 1 mois.
                    <br />
                    🔥 <strong>Forfait Pro (5 000F)</strong> : <strong>3 Reels Vidéo</strong> inclus par mois.
                    <br />
                    ⚡ <strong>Non Abonné</strong> : Option <strong>Boost Reel à 1 500 FCFA / 1 Semaine</strong> (7 jours).
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                    <label className="active-scale touch-target" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'rgba(255,255,255,0.15)',
                      border: '1.5px dashed rgba(255,255,255,0.4)',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      backdropFilter: 'blur(8px)'
                    }}>
                      <span>📱</span> Importer une Vidéo ou 3 Photos depuis mon téléphone
                      <input 
                        type="file" 
                        accept="video/*,image/*" 
                        multiple 
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          const firstFile = files[0];
                          if (firstFile.type.startsWith('video/')) {
                            if (firstFile.size > 50 * 1024 * 1024) {
                              toast.error('La vidéo ne doit pas dépasser 50 Mo.');
                              return;
                            }
                            setVideoFile(firstFile);
                            const previewUrl = URL.createObjectURL(firstFile);
                            setFormData(prev => ({ ...prev, video_url: previewUrl }));
                            toast.success('🎥 Vidéo chargée depuis le téléphone !');
                          } else {
                            const maxAllowed = getMaxPhotosAllowed(profile?.subscription_plan);
                            const remaining = maxAllowed - images.length;
                            if (remaining <= 0) {
                              toast.error(`Limite maximale de photos atteinte.`);
                              return;
                            }
                            const selectedImages = files.slice(0, remaining);
                            const newPreviews = selectedImages.map(file => URL.createObjectURL(file));
                            setPreviews(prev => [...prev, ...newPreviews]);
                            setImages(prev => [...prev, ...selectedImages]);
                            toast.success(`📸 ${selectedImages.length} photo(s) ajoutée(s) !`);
                          }
                        }} 
                        style={{ display: 'none' }} 
                      />
                    </label>

                    {formData.video_url && (
                      <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '14px', overflow: 'hidden', background: '#000' }}>
                        <video src={formData.video_url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, video_url: '' }))} 
                          style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >✕</button>
                      </div>
                    )}
                  </div>

                  <InputWrapper icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FDA4AF" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>}>
                    <FastInput 
                      type="url" 
                      name="video_url" 
                      placeholder="Ou collez un lien vidéo (MP4/TikTok)..." 
                      value={formData.video_url || ''} 
                      onChange={handleInputChange} 
                      style={{ flex: 1, padding: '0.8rem 0.8rem 0.8rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: '#FFFFFF' }} 
                    />
                  </InputWrapper>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '1.5rem' }}>
                  {category && category.fields.filter(field => {
                    if (['type', 'property_type', 'service_type', 'job_type'].includes(field.name)) return false;
                    if (!field.showIf) return true;
                    const dependentValue = formData[field.showIf.field];
                    return field.showIf.values.includes(dependentValue);
                  }).map((field) => {
                    const isHalfWidth = ['year', 'mileage', 'transmission', 'fuel', 'rooms', 'surface', 'gender', 'age', 'vaccinated'].includes(field.name);
                    
                    return (
                      <div key={field.name} style={{ width: isHalfWidth ? 'calc(50% - 8px)' : '100%' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: '600' }}>{field.label}</label>
                        {field.type === 'select' ? (
                          <div>
                            {(field.name === 'color' || field.name === 'size') ? (
                              /* Multi-select chips pour couleur et taille/pointure */
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {field.options.map((opt) => {
                                  const selectedValues = (formData[field.name] || '').split(', ').filter(Boolean);
                                  const isSelected = selectedValues.includes(opt);
                                  return (
                                    <button 
                                      type="button" 
                                      key={opt} 
                                      onClick={() => {
                                        let values = (formData[field.name] || '').split(', ').filter(Boolean);
                                        if (opt === 'Autre') {
                                          values = ['Autre'];
                                        } else {
                                          values = values.filter(v => v !== 'Autre');
                                          if (values.includes(opt)) {
                                            values = values.filter(v => v !== opt);
                                          } else {
                                            values.push(opt);
                                          }
                                        }
                                        setFormData({...formData, [field.name]: values.join(', ')});
                                      }} 
                                      className="active-scale touch-target" 
                                      style={{ minWidth: 'fit-content', padding: '8px 14px', minHeight: '42px', borderRadius: '20px', border: isSelected ? 'none' : '1px solid #E2E8F0', background: isSelected ? 'var(--primary)' : '#FAFAF9', color: isSelected ? 'white' : 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem', boxShadow: isSelected ? '0 4px 10px rgba(139, 28, 49, 0.2)' : 'none', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : field.options.length > 4 || field.name === 'brand' ? (
                              <div style={{ position: 'relative' }}>
                                <select 
                                  value={formData[field.name] || ''}
                                  onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                                  style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', background: '#FAFAF9', appearance: 'none', color: formData[field.name] ? 'var(--text-main)' : '#94A3B8' }}
                                >
                                  <option value="" disabled>Sélectionner</option>
                                  {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94A3B8' }}>▼</div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {field.options.map((opt) => (
                                  <button 
                                    type="button" 
                                    key={opt} 
                                    onClick={() => setFormData({...formData, [field.name]: opt})} 
                                    className="active-scale touch-target" 
                                    style={{ flex: 1, minWidth: 'fit-content', padding: '8px 12px', minHeight: '42px', borderRadius: '12px', border: formData[field.name] === opt ? 'none' : '1px solid #E2E8F0', background: formData[field.name] === opt ? 'var(--primary)' : '#FAFAF9', color: formData[field.name] === opt ? 'white' : 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem', boxShadow: formData[field.name] === opt ? '0 4px 10px rgba(139, 28, 49, 0.2)' : 'none', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {(formData[field.name] === 'Autre' || (formData[field.name] || '').split(', ').includes('Autre')) && (
                              <div style={{ marginTop: '8px', animation: 'fadeIn 0.2s ease-out' }}>
                                <FastInput 
                                  type="text" 
                                  name={`custom_${field.name}`} 
                                  placeholder={`Précisez...`}
                                  onChange={(e) => setFormData({...formData, [`custom_${field.name}`]: e.target.value})}
                                  value={formData[`custom_${field.name}`] || ''}
                                  style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', background: '#FAFAF9', boxSizing: 'border-box' }} 
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <FastInput type={field.type} name={field.name} placeholder={field.placeholder} onChange={handleInputChange} value={formData[field.name] || ''} style={{ width: '100%', padding: '14px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#FAFAF9', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <button onClick={nextStep} className="btn-primary active-scale" style={{ width: '100%', marginTop: '24px', padding: '1.1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  Continuer <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
              <div style={{ position: 'sticky', top: '100px' }}>
                {renderLivePreview()}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <style>{`
              .publish-layout {
                display: grid;
                grid-template-columns: 1fr;
                gap: 2.5rem;
                align-items: start;
              }
              @media (min-width: 1024px) {
                .publish-layout {
                  grid-template-columns: 1.6fr 1.1fr;
                }
              }
            `}</style>

            <div className="publish-layout">
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>Prix et Livraison</h2>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: '600' }}>Type de prix</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', width: '100%' }}>
                    {['Fixe', 'Négociable', 'Gratuit', 'Échange'].map(pt => (
                      <button type="button" key={pt} onClick={() => setFormData({...formData, price_type: pt})} className="active-scale touch-target" style={{ width: '100%', padding: '10px 4px', minHeight: '44px', borderRadius: '12px', border: formData.price_type === pt ? 'none' : '1px solid #E2E8F0', background: formData.price_type === pt ? 'var(--primary)' : '#FAFAF9', color: formData.price_type === pt ? 'white' : 'var(--text-main)', fontWeight: '700', fontSize: '0.82rem', textAlign: 'center', boxShadow: formData.price_type === pt ? '0 4px 12px rgba(139, 28, 49, 0.25)' : 'none', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>

                {(formData.price_type !== 'Gratuit' && formData.price_type !== 'Échange') && (
                  <InputWrapper label="Prix (FCFA)" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>}>
                    <FastInput type="number" name="price" placeholder="Ex: 15000" value={formData.price} onChange={handleInputChange} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '1px' }} />
                  </InputWrapper>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <InputWrapper label="Ville / Quartier" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>}>
                    <select name="location" onChange={handleInputChange} value={formData.location} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', appearance: 'none', cursor: 'pointer' }}>
                      {locations.map(loc => <option key={loc} value={loc} style={{ color: 'var(--text-main)' }}>{loc}</option>)}
                    </select>
                    <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
                  </InputWrapper>
                  {formData.location === 'Autre' && (
                    <div style={{ marginTop: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                      <FastInput 
                        type="text" 
                        name="custom_location" 
                        placeholder="Précisez votre ville / quartier"
                        onChange={(e) => setFormData({...formData, custom_location: e.target.value})}
                        value={formData.custom_location || ''}
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', background: '#FAFAF9' }} 
                      />
                    </div>
                  )}
                </div>

                <InputWrapper label="Options de livraison" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>}>
                  <select name="delivery" onChange={handleInputChange} value={formData.delivery} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', appearance: 'none', cursor: 'pointer' }}>
                    {deliveries.map(del => <option key={del} value={del} style={{ color: 'var(--text-main)' }}>{del}</option>)}
                  </select>
                  <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
                </InputWrapper>

                <div style={{ marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>Numéro WhatsApp <span style={{ opacity: 0.7 }}>(optionnel)</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden', background: '#FAFAF9', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F8FAFC', borderRight: '1px solid #E2E8F0', color: 'var(--text-main)', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0, height: '48px' }}>
                      <span style={{ color: '#94A3B8', marginRight: '6px', fontSize: '0.8rem' }}>SN</span> +221
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FastInput 
                        type="tel" 
                        name="contact_whatsapp" 
                        value={cleanPhone(formData.contact_whatsapp)} 
                        onChange={(e) => setFormData({ ...formData, contact_whatsapp: cleanPhone(e.target.value) })} 
                        placeholder="77 123 45 67" 
                        style={{ width: '100%', padding: '1rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', letterSpacing: '1px', boxSizing: 'border-box', fontWeight: '600' }} 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit} 
                  disabled={loading} 
                  className="active-scale" 
                  style={{
                    width: '100%',
                    marginTop: '24px',
                    marginBottom: '120px',
                    padding: '1.15rem',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '1.1rem',
                    color: 'white',
                    background: 'linear-gradient(135deg, #8A1C1C 0%, #B91C1C 100%)',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(139, 28, 49, 0.35)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  {loading ? 'Publication en cours...' : 'Publier mon annonce'}
                  {!loading && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>}
                </button>
              </div>
              <div className="hide-on-mobile" style={{ position: 'sticky', top: '100px' }}>
                {renderLivePreview()}
              </div>
            </div>
          </div>
        )}
        {/* Subcategory Mini-Sheet Modal */}
        {activeSubcatModal && (
          <div 
            onClick={() => setActiveSubcatModal(null)} 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{
                width: '100%',
                maxWidth: '520px',
                background: 'white',
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                padding: '24px 20px 32px 20px',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                maxHeight: '82vh',
                overflowY: 'auto'
              }}
            >
              {/* Handle bar */}
              <div style={{ width: '44px', height: '4px', background: '#CBD5E1', borderRadius: '2px', margin: '0 auto 16px auto' }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${activeSubcatModal.color}18`, color: activeSubcatModal.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    {activeSubcatModal.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', fontFamily: 'var(--font-heading)', color: '#0F172A' }}>
                      {activeSubcatModal.name}
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748B', fontWeight: '500' }}>
                      Sélectionnez la sous-catégorie
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveSubcatModal(null)} 
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', fontWeight: '800', fontSize: '1rem' }}
                >
                  ✕
                </button>
              </div>

              {/* Subcategories Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handlePickSubcategory('Toutes')}
                  className="touch-target active-scale"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    border: '1.5px solid #E2E8F0',
                    color: 'var(--text-main)',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>⚡ Tout dans {activeSubcatModal.name}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: '800' }}>➔</span>
                </button>

                {(() => {
                  const subField = activeSubcatModal.fields?.find(f => f.name === 'type' || f.name === 'subcategory') || activeSubcatModal.fields?.[0];
                  const options = subField?.options || [];
                  return options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handlePickSubcategory(opt)}
                      className="touch-target active-scale"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: '16px',
                        background: 'white',
                        border: '1.5px solid #E2E8F0',
                        color: 'var(--text-main)',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{opt}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '1.1rem' }}>+</span>
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Live Preview Modal Drawer */}
        {showMobilePreviewModal && (
          <div 
            onClick={() => setShowMobilePreviewModal(false)} 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{
                width: '100%',
                maxWidth: '520px',
                background: 'white',
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                padding: '24px 20px 32px 20px',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                maxHeight: '85vh',
                overflowY: 'auto'
              }}
            >
              {/* Handle bar */}
              <div style={{ width: '44px', height: '4px', background: '#CBD5E1', borderRadius: '2px', margin: '0 auto 16px auto' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                  👁️ Aperçu de votre Annonce
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowMobilePreviewModal(false)} 
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', fontWeight: '800' }}
                >
                  ✕
                </button>
              </div>

              {renderLivePreview()}
            </div>
          </div>
        )}
      </div>
      </>
    )}
    </>
    )}
    </div>
  );
};

export default PublishPage;
