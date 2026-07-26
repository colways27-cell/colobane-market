import { useState, useEffect } from 'react';
import { categories } from '../data/categories';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const locations = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Saint-Louis', 'Touba', 'Kaolack', 'Ziguinchor', 'Mbour', 'Louga', 'Tambacounda', 'Autre'];
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
  emploi: ['emploi', 'travail', 'job', 'stage', 'cdi', 'cdd', 'recrutement', 'offre', 'salaire']
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

const FastInput = ({ value, onChange, ...props }) => {
  const [localVal, setLocalVal] = useState(value || '');
  useEffect(() => { setLocalVal(value || ''); }, [value]);
  return <input value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={e => onChange({ target: { name: props.name, value: localVal } })} {...props} />;
};

const FastTextarea = ({ value, onChange, ...props }) => {
  const [localVal, setLocalVal] = useState(value || '');
  useEffect(() => { setLocalVal(value || ''); }, [value]);
  return <textarea value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={e => onChange({ target: { name: props.name, value: localVal } })} {...props} />;
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
  const [isDragging, setIsDragging] = useState(false);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);

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

  const nextStep = () => {
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
      if (images.length === 0) {
        toast.error("Veuillez ajouter au moins une photo.");
        return;
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
    const uploadedUrls = [];
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, image);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      uploadedUrls.push(data.publicUrl);
    }
    return uploadedUrls;
  };

  const handleConfirmBoost = async (e) => {
    e.preventDefault();
    if (!paymentPhone.trim()) {
      toast.error('Veuillez entrer le numéro utilisé pour le paiement.');
      return;
    }
    
    setIsProcessingBoost(true);
    toast.loading('Envoi de la demande...', { id: 'boost-publish' });

    try {
      const { error } = await supabase.from('payment_requests').insert([{
        user_id: user.id,
        plan_type: `boost_product_${selectedBoost.days}d_${publishedProduct.id}`,
        amount: selectedBoost.price,
        phone_used: paymentPhone,
        status: 'pending'
      }]);

      if (error) throw error;
      
      const adminNumber = "221773713175";
      const text = encodeURIComponent(`Nouvelle demande de Boost ! L'utilisateur ${profile?.full_name || user.id} a payé ${selectedBoost.price}F pour booster l'annonce "${publishedProduct.title}" avec le numéro ${paymentPhone}. Vérifiez Wave et activez le boost.`);
      window.open(`https://wa.me/${adminNumber}?text=${text}`, '_blank');
      
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
    setLoading(true);
    setErrorMsg('');

    try {
      const { error: profileError } = await supabase.from('profiles').upsert([{ id: user.id }], { onConflict: 'id' });
      if (profileError && profileError.code !== '23505') console.warn('Profile sync issue:', profileError);

      const imageUrls = await uploadImages();
      const { title, description, price, price_type, location, delivery, contact_whatsapp, ...metadata } = formData;
      
      let finalPrice = 0;
      if (price_type !== 'Gratuit' && price_type !== 'Échange') {
        finalPrice = typeof price === 'string' ? parseFloat(price.replace(/\s/g, '')) : parseFloat(price);
      }

      // Handle "Autre" custom fields
      const processedMetadata = { ...metadata, price_type, delivery, contact_whatsapp };
      Object.keys(processedMetadata).forEach(key => {
        if (processedMetadata[key] === 'Autre' && processedMetadata[`custom_${key}`]) {
          processedMetadata[key] = processedMetadata[`custom_${key}`];
        }
        if (key.startsWith('custom_')) {
          delete processedMetadata[key];
        }
      });

      const { data: insertedData, error: insertError } = await supabase.from('products').insert([{
        seller_id: user.id,
        title: title || 'Sans titre',
        description: description || '',
        price: isNaN(finalPrice) ? 0 : finalPrice,
        location: (location === 'Autre' && formData.custom_location) ? formData.custom_location : (location || 'Sénégal'),
        category: selectedCategory,
        images: imageUrls,
        metadata: processedMetadata,
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
                        onClick={() => window.open('https://pay.wave.com/m/M_sn_DDpGp25B76P7/c/sn/?src=d', '_blank')}
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
                      Multipliez vos vues par 10 et vendez votre article en un temps record !
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button type="button" onClick={() => setSelectedBoost({ price: 500, days: 2 })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', background: '#FAFAF9', color: '#f59e0b', border: '1.5px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <span>⚡ 2 Jours</span>
                        <span style={{ fontWeight: '800' }}>500 FCFA</span>
                      </button>
                      <button type="button" onClick={() => setSelectedBoost({ price: 1500, days: 7 })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', background: '#FAFAF9', color: '#f59e0b', border: '1.5px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <span>⚡ 7 Jours</span>
                        <span style={{ fontWeight: '800' }}>1500 FCFA</span>
                      </button>
                      <button type="button" onClick={() => setSelectedBoost({ price: 2500, days: 15 })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', background: '#FAFAF9', color: '#f59e0b', border: '1.5px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <span>⚡ 15 Jours</span>
                        <span style={{ fontWeight: '800' }}>2500 FCFA</span>
                      </button>
                      <button type="button" onClick={() => setSelectedBoost({ price: 5000, days: 30 })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', background: '#FAFAF9', color: '#f59e0b', border: '1.5px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <span>⚡ Mensuel (30 Jours)</span>
                        <span style={{ fontWeight: '800' }}>5000 FCFA</span>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '360px' }}>
            <button onClick={() => navigate(`/product/${publishedProduct.id}`)} className="active-scale" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '1.05rem', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(139, 28, 49, 0.2)' }}>
              Voir mon annonce
            </button>
            <button onClick={() => navigate('/')} className="active-scale" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '1.05rem', background: '#F1F5F9', color: 'var(--text-main)', border: 'none', cursor: 'pointer' }}>
              Retour aux annonces
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

      <div style={{ padding: '12px 20px' }}>
        {errorMsg && <div style={{ color: '#e74c3c', background: '#fdf0ed', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>{errorMsg}</div>}
        
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Que vendez-vous ?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.95rem' }}>Sélectionnez la catégorie qui correspond le mieux à votre article.</p>
            
            {/* Barre de recherche de catégorie */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
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

            {/* Quick Helper Suggestion Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', marginBottom: '16px' }}>
              {[
                { label: '🍲 Restauration & Traiteur', catId: 'alimentation' },
                { label: '👚 Friperie & Balles', catId: 'friperie' },
                { label: '📱 iPhone & Samsung', catId: 'telephones_tablettes' },
                { label: '👗 Robes & Baskets', catId: 'habillement' },
                { label: '🚗 Voitures & Motos', catId: 'vehicules' },
                { label: '💻 Ordinateurs & PC', catId: 'informatique' },
                { label: '💄 Parfums & Soins', catId: 'beaute_sante' },
                { label: '🏠 Meubles & Lits', catId: 'maison_jardin' },
                { label: '🐑 Moutons & Animaux', catId: 'animaux' }
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(pill.catId);
                    setCategorySearch('');
                    const selectedCatObj = categories.find((c) => c.id === pill.catId);
                    const subcat = getSubcategoryField(selectedCatObj);
                    if (subcat) setStep(2);
                    else setStep(3);
                  }}
                  className="active-scale"
                  style={{ flexShrink: 0, padding: '8px 14px', borderRadius: '20px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  {pill.label}
                </button>
              ))}
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
                          <div style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Catégorie suggérée</div>
                          <div style={{ fontSize: '1rem', fontWeight: '900', color: '#1E3A8A' }}>{filtered[0].name}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(filtered[0].id);
                          setCategorySearch('');
                          const subcat = getSubcategoryField(filtered[0]);
                          if (subcat) setStep(2);
                          else setStep(3);
                        }}
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
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {filtered.map((cat) => (
                    <button 
                      key={cat.id}
                      onClick={() => { 
                        setSelectedCategory(cat.id); 
                        setCategorySearch('');
                        setTimeout(() => {
                          const selectedCatObj = categories.find((c) => c.id === cat.id);
                          const subcat = getSubcategoryField(selectedCatObj);
                          if (subcat) setStep(2);
                          else setStep(3);
                        }, 300); 
                      }}
                      className="touch-target active-scale"
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: selectedCategory === cat.id ? 'var(--primary)' : '#FAFAF9', border: selectedCategory === cat.id ? 'none' : '1px solid #E2E8F0', borderRadius: '20px', padding: '18px 10px', gap: '8px', boxShadow: selectedCategory === cat.id ? '0 8px 20px rgba(139, 28, 49, 0.2)' : 'none', transition: 'all 0.2s' }}
                    >
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: selectedCategory === cat.id ? 'rgba(255,255,255,0.2)' : `${cat.color}15`, color: selectedCategory === cat.id ? 'white' : cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
                        {cat.icon}
                      </div>
                      <span style={{ fontWeight: selectedCategory === cat.id ? '800' : '700', color: selectedCategory === cat.id ? 'white' : 'var(--text-main)', textAlign: 'center', fontSize: '0.92rem' }}>
                        {cat.name}
                      </span>
                      {categorySubExamples[cat.id] && (
                        <span style={{ fontSize: '0.72rem', color: selectedCategory === cat.id ? 'rgba(255,255,255,0.85)' : '#64748B', textAlign: 'center', fontWeight: '500', lineHeight: '1.2' }}>
                          {categorySubExamples[cat.id]}
                        </span>
                      )}
                    </button>
                  ))}
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>Détails et Photos</h2>
                
                <InputWrapper label="Titre de l'annonce" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>}>
                  <FastInput type="text" name="title" placeholder="Ex: iPhone 14 Pro Max 256Go" value={formData.title} onChange={handleInputChange} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} />
                </InputWrapper>

                <InputWrapper label="Description" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '14px' }}><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="14" y1="18" x2="3" y2="18"></line></svg>}>
                  <FastTextarea name="description" rows="4" placeholder="État, accessoires inclus, raison de la vente..." value={formData.description} onChange={handleInputChange} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', resize: 'vertical' }}></FastTextarea>
                </InputWrapper>

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
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>Glisser ou cliquer</span>
                              </div>
                              <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                            </label>
                          )}
                        </div>
                      </>
                    );
                  })()}
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
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: '500' }}>Type de prix</label>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                    {['Fixe', 'Négociable', 'Gratuit', 'Échange'].map(pt => (
                      <button type="button" key={pt} onClick={() => setFormData({...formData, price_type: pt})} className="active-scale touch-target" style={{ flexShrink: 0, padding: '0 20px', minHeight: '44px', borderRadius: '12px', border: formData.price_type === pt ? 'none' : '1px solid #E2E8F0', background: formData.price_type === pt ? 'var(--primary)' : '#FAFAF9', color: formData.price_type === pt ? 'white' : 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem', boxShadow: formData.price_type === pt ? '0 4px 12px rgba(139, 28, 49, 0.2)' : 'none', transition: 'all 0.2s' }}>
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
                    <select name="location" onChange={handleInputChange} value={formData.location} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', appearance: 'none' }}>
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
                  <select name="delivery" onChange={handleInputChange} value={formData.delivery} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', appearance: 'none' }}>
                    {deliveries.map(del => <option key={del} value={del} style={{ color: 'var(--text-main)' }}>{del}</option>)}
                  </select>
                  <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
                </InputWrapper>

                <div style={{ marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Numéro WhatsApp <span style={{ opacity: 0.7 }}>(optionnel)</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', background: '#FAFAF9', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F8FAFC', borderRight: '1px solid #E2E8F0', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem', flexShrink: 0 }}>
                      <span style={{ color: '#94A3B8', marginRight: '6px', fontSize: '0.8rem' }}>SN</span> +221
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FastInput 
                        type="tel" 
                        name="contact_whatsapp" 
                        value={cleanPhone(formData.contact_whatsapp)} 
                        onChange={(e) => setFormData({ ...formData, contact_whatsapp: cleanPhone(e.target.value) })} 
                        placeholder="77 123 45 67" 
                        style={{ width: '100%', padding: '1rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', letterSpacing: '1px', boxSizing: 'border-box' }} 
                      />
                    </div>
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={loading} className="btn-primary active-scale" style={{ width: '100%', marginTop: '32px', padding: '1.1rem', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(139, 28, 49, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {loading ? 'Publication en cours...' : 'Publier mon annonce'}
                  {!loading && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>}
                </button>
              </div>
              <div className="hide-on-mobile" style={{ position: 'sticky', top: '100px' }}>
                {renderLivePreview()}
              </div>
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
