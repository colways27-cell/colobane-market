import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { isBoutiqueExpired, getTrialDaysRemaining } from '../utils/boutiqueHelpers';
import { 
  requestNotificationPermission, 
  sendSystemNotification, 
  getNotificationPermissionState 
} from '../utils/pushNotifications';
import { openWavePayment } from '../config/paymentConfig';
import VendorAnalyticsDashboard from '../components/vendor/VendorAnalyticsDashboard';
import OneSignal from 'react-onesignal';

import { locationsList as locations } from '../data/locations';

const InputWrapper = ({ label, icon, children }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>{label}</label>
    <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', background: '#FAFAF9' }}>
      <div style={{ padding: '0 12px', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
        {icon}
      </div>
      {children}
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

const isRealEmail = (email) => {
  if (!email) return false;
  const lower = String(email).toLowerCase().trim();
  if (
    lower.includes('@colobane.com') ||
    lower.includes('@colobanemarket.com') ||
    lower.includes('@example.com') ||
    lower.includes('@placeholder') ||
    lower.includes('@test') ||
    lower.includes('aucun') ||
    lower.startsWith('phone_') ||
    lower.startsWith('user_')
  ) {
    return false;
  }
  return true;
};

const formatPhone = (num) => {
  if (!num) return '';
  const clean = String(num).replace(/\D/g, '');
  if (clean.length === 9) {
    return `+221 ${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)}`;
  }
  if (clean.length === 12 && clean.startsWith('221')) {
    return `+221 ${clean.slice(3, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 10)} ${clean.slice(10, 12)}`;
  }
  return num.startsWith('+') ? num : `+221 ${num}`;
};

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('annonces');
  
  // Wave Payment States for Boost
  const [showBoostMarketingModal, setShowBoostMarketingModal] = useState(false);
  const [productToBoostMarketing, setProductToBoostMarketing] = useState(null);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedProductToBoost, setSelectedProductToBoost] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [certPending, setCertPending] = useState(false);
  const [profileNotifications, setProfileNotifications] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    pseudo: '',
    phone_number: '',
    whatsapp_number: '',
    city: '',
    email: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        const [
          { data: profileData, error: profileError },
          { data: productsData, error: productsError },
          { data: certReq },
          { data: payReqs },
          { data: certReqs },
          { data: buyerReqs }
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
          supabase.from('certification_requests').select('id, status').eq('user_id', user.id).eq('status', 'pending').maybeSingle(),
          supabase.from('payment_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('certification_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('buyer_requests').select('*').order('created_at', { ascending: false }).limit(10)
        ]);

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        if (profileData) {
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || '',
            pseudo: profileData.pseudo || '',
            phone_number: profileData.phone_number || '',
            whatsapp_number: profileData.whatsapp_number || '',
            city: profileData.city || 'Dakar',
            email: isRealEmail(profileData.email) ? profileData.email : ''
          });
        }

        if (productsError) throw productsError;
        
        let productsWithFavs = productsData || [];
        if (productsWithFavs.length > 0) {
          const productIds = productsWithFavs.map(p => p.id);
          const { data: favsData } = await supabase
            .from('favorites')
            .select('product_id')
            .in('product_id', productIds);
            
          if (favsData) {
            const favCounts = favsData.reduce((acc, curr) => {
              acc[curr.product_id] = (acc[curr.product_id] || 0) + 1;
              return acc;
            }, {});
            productsWithFavs = productsWithFavs.map(p => ({
              ...p,
              favorites_count: favCounts[p.id] || 0
            }));
          }
        }
        
        setMyProducts(productsWithFavs);

        if (certReq) setCertPending(true);

        const combinedNotifs = [];

        if (payReqs) {
          payReqs.forEach(req => {
            let title = '';
            let message = '';
            let type = 'info';
            let icon = '🔔';
            let link = '/reels';
            if (req.plan_type === 'boost_reel_7j') {
              link = '/reels';
            } else {
              link = '/subscription';
            }
            
            if (req.status === 'approved' || req.status === 'validated') {
              title = '⚡ Boost Reel / Plan Activé !';
              message = `Votre demande pour le ${req.plan_type === 'boost_reel_7j' ? 'Boost Reel 7 jours (1 500 F)' : 'forfait'} a été approuvée par l'admin !`;
              type = 'success';
              icon = '✅';
            } else if (req.status === 'rejected') {
              title = '❌ Demande de Boost / Plan Refusée';
              message = `Votre transfert de ${req.amount} FCFA pour le ${req.plan_type === 'boost_reel_7j' ? 'Boost Reel' : 'forfait'} a été rejeté par l'admin. Veuillez contacter le support.`;
              type = 'danger';
              icon = '❌';
            } else {
              title = '⏳ Boost / Plan en attente';
              message = `Votre transfert de ${req.amount} FCFA pour le ${req.plan_type === 'boost_reel_7j' ? 'Boost Reel' : 'forfait'} est en cours de vérification par l'admin.`;
              type = 'warning';
              icon = '⏳';
            }

            combinedNotifs.push({
              id: `pay-${req.id}`,
              title,
              message,
              type,
              icon,
              created_at: req.created_at,
              link
            });
          });
        }

        if (certReqs) {
          certReqs.forEach(req => {
            let title = '';
            let message = '';
            let type = 'info';
            let icon = '👑';
            
            if (req.status === 'approved') {
              title = '👑 Certification Validée !';
              message = `Félicitations ! Votre demande de certification pour la boutique "${req.boutique_name}" a été approuvée. Vous êtes désormais vendeur de confiance.`;
              type = 'success';
              icon = '✅';
            } else if (req.status === 'rejected') {
              title = '❌ Certification Refusée';
              message = `Votre demande de certification pour la boutique "${req.boutique_name}" a été rejetée. Note admin: ${req.admin_note || 'Aucune note'}`;
              type = 'danger';
              icon = '❌';
            } else {
              title = '⏳ Certification en cours...';
              message = `Votre demande de certification officielle pour "${req.boutique_name}" est en cours d'examen par notre équipe.`;
              type = 'warning';
              icon = '⏳';
            }

            combinedNotifs.push({
              id: `cert-${req.id}`,
              title,
              message,
              type,
              icon,
              created_at: req.created_at,
              link: '/certification'
            });
          });
        }

        if (profileData && profileData.subscription_end_date) {
          const endDate = new Date(profileData.subscription_end_date);
          const now = new Date();
          const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 3) {
            combinedNotifs.push({
              id: `sub-expire`,
              title: '⏳ Expiration de Forfait',
              message: `Votre forfait ${profileData.subscription_plan || 'Pro'} expire dans ${diffDays} jour(s). Réabonnez-vous pour garder l'illimité.`,
              type: 'warning',
              icon: '⏳',
              created_at: new Date().toISOString(),
              link: '/subscription'
            });
          }
        }

        if (buyerReqs) {
          buyerReqs.forEach(req => {
            combinedNotifs.push({
              id: `buyer-${req.id}`,
              title: '🙋‍♂️ Nouvelle demande Wutal Ma',
              message: `Un acheteur recherche activement: "${req.title}" à ${req.location}. Budget: ${req.budget} F. Cliquez pour proposer vos articles.`,
              type: 'opportunity',
              icon: '💬',
              created_at: req.created_at,
              link: '/wutal-ma'
            });
          });
        }

        combinedNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setProfileNotifications(combinedNotifs);

      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      toast.loading("Mise à jour du profil...", { id: 'updateProfile' });
      const payload = { 
        id: user.id,
        full_name: formData.full_name,
        pseudo: formData.pseudo,
        phone_number: formData.phone_number,
        whatsapp_number: formData.whatsapp_number,
        city: formData.city,
        email: formData.email,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert([payload], { onConflict: 'id' });

      if (error) throw error;

      setProfile(prev => ({ 
        ...prev, 
        ...payload
      }));
      setEditingProfile(false);
      toast.success("Profil mis à jour avec succès !", { id: 'updateProfile' });
    } catch (err) {
      toast.error("Erreur lors de la mise à jour.", { id: 'updateProfile' });
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Mise à jour de la couverture...", { id: 'bannerUpload' });
      let fileToUpload = file;

      try {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: false };
        fileToUpload = await imageCompression(file, options);
      } catch (cErr) {
        console.warn('Image compression fallback:', cErr);
      }

      const reader = new FileReader();
      reader.readAsDataURL(fileToUpload);
      reader.onloadend = async () => {
        const base64Url = reader.result;
        let finalBannerUrl = base64Url;

        try {
          const fileName = `banner_${user.id}_${Date.now()}.jpg`;
          const { error: storageError } = await supabase.storage.from('products').upload(fileName, fileToUpload, { upsert: true });
          if (!storageError) {
            const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) finalBannerUrl = publicUrlData.publicUrl;
          }
        } catch (sErr) {
          console.warn('Storage upload fallback:', sErr);
        }

        const { error: dbError } = await supabase
          .from('profiles')
          .upsert([{ id: user.id, banner_url: finalBannerUrl }], { onConflict: 'id' });

        if (dbError) {
          console.warn('DB upsert error:', dbError);
        }

        setProfile(prev => ({ ...prev, banner_url: finalBannerUrl }));
        toast.success("Photo de couverture mise à jour !", { id: 'bannerUpload' });
      };
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'upload.", { id: 'bannerUpload' });
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Mise à jour de la photo de profil...", { id: 'avatarUpload' });
      let fileToUpload = file;

      try {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 500, useWebWorker: false };
        fileToUpload = await imageCompression(file, options);
      } catch (cErr) {
        console.warn('Image compression fallback:', cErr);
      }

      const reader = new FileReader();
      reader.readAsDataURL(fileToUpload);
      reader.onloadend = async () => {
        const base64Url = reader.result;
        let finalAvatarUrl = base64Url;

        try {
          const fileName = `avatar_${user.id}_${Date.now()}.jpg`;
          const { error: storageError } = await supabase.storage.from('products').upload(fileName, fileToUpload, { upsert: true });
          if (!storageError) {
            const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) finalAvatarUrl = publicUrlData.publicUrl;
          }
        } catch (sErr) {
          console.warn('Storage upload fallback:', sErr);
        }

        const { error: dbError } = await supabase
          .from('profiles')
          .upsert([{ id: user.id, avatar_url: finalAvatarUrl }], { onConflict: 'id' });

        if (dbError) {
          console.warn('DB upsert error:', dbError);
        }

        setProfile(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
        toast.success("Photo de profil mise à jour !", { id: 'avatarUpload' });
      };
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'upload.", { id: 'avatarUpload' });
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      setMyProducts(myProducts.filter(p => p.id !== productId));
      toast.success("Annonce supprimée.");
    } catch (err) {
      toast.error("Erreur lors de la suppression.");
      console.error(err);
    }
  };

  const handleDeleteMyAccount = async () => {
    if (!window.confirm("⚠️ ATTENTION : Êtes-vous vraiment sûr de vouloir SUPPRIMER DÉFINITIVEMENT votre compte Colobane Market ?\n\nToutes vos annonces seront effacées. Cette action est irréversible.")) {
      return;
    }
    toast.loading("Suppression du compte...", { id: 'del-account' });
    try {
      if (user) {
        await supabase.from('products').delete().eq('seller_id', user.id);
        await supabase.from('payment_requests').delete().eq('user_id', user.id);
        await supabase.from('certification_requests').delete().eq('user_id', user.id);
        await supabase.from('buyer_requests').delete().eq('user_id', user.id);
        await supabase.from('favorites').delete().eq('user_id', user.id);
        await supabase.from('reviews').delete().eq('seller_id', user.id);

        const { error } = await supabase.from('profiles').delete().eq('id', user.id);
        if (error) {
          await supabase.from('profiles').update({
            full_name: 'Compte Supprimé',
            boutique_name: null,
            phone_number: null,
            whatsapp_number: null,
            is_verified: false,
            subscription_plan: 'none'
          }).eq('id', user.id);
        }
        await signOut();
        toast.success("Votre compte a été supprimé avec succès.", { id: 'del-account' });
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      await signOut();
      toast.success("Compte désactivé et déconnecté.", { id: 'del-account' });
      navigate('/');
    }
  };

  const openBoostMarketing = (productId, productTitle) => {
    setProductToBoostMarketing({ id: productId, title: productTitle });
    setShowBoostMarketingModal(true);
  };

  const initiateBoost = (productId, productTitle, price, days) => {
    setShowBoostMarketingModal(false);
    setSelectedProductToBoost({ id: productId, title: productTitle, price: price, days: days });
    setShowBoostModal(true);
    openWavePayment();
  };

  const confirmBoost = async (e) => {
    e.preventDefault();
    if (!paymentPhone.trim()) {
      toast.error('Veuillez entrer le numéro utilisé pour le paiement.');
      return;
    }
    
    setIsProcessing(true);
    toast.loading('Envoi de la demande...', { id: 'boost' });

    try {
      const { error } = await supabase.from('payment_requests').insert([{
        user_id: user.id,
        plan_type: `boost_product_${selectedProductToBoost.days}d_${selectedProductToBoost.id}`,
        amount: selectedProductToBoost.price,
        phone_used: paymentPhone,
        status: 'pending'
      }]);

      if (error) throw error;
      
      const adminNumber = "221773713175";
      const text = encodeURIComponent(`Nouvelle demande de Boost ! L'utilisateur ${profile?.full_name || user.id} a payé ${selectedProductToBoost.price}F pour booster l'annonce "${selectedProductToBoost.title}" avec le numéro ${paymentPhone}. Vérifiez Wave et activez le boost.`);
      window.open(`https://wa.me/${adminNumber}?text=${text}`, '_blank');
      
      toast.success('Demande envoyée ! Le boost sera activé après vérification.', { id: 'boost', duration: 5000 });
      setShowBoostModal(false);
      setPaymentPhone('');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi de la demande.', { id: 'boost' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }


  return (
    <div className="profile-page-container" style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '120px' }}>
      {/* Immersive Banner */}
      <div className="profile-banner animate-fade-in-up" style={{ height: '260px', background: profile?.banner_url ? `url(${profile.banner_url}) center/cover no-repeat` : 'linear-gradient(135deg, var(--primary) 0%, #4a0e1b 100%)', position: 'relative' }}>
        {!profile?.banner_url && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', opacity: 0.1 }}></div>}
        {/* Upload Couverture */}
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <label className="hover-lift glass-panel" style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '10px 20px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '700', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            Modifier couverture
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
          </label>
        </div>
      </div>

      <div className="section-container" style={{ position: 'relative', marginTop: '-80px', padding: '0 16px' }}>
        
        {/* Main Profile Card */}
        <div className="glass-panel animate-fade-in-up stagger-1" style={{ background: 'rgba(255, 255, 255, 0.85)', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', marginBottom: '2.5rem', backdropFilter: 'blur(20px)' }}>
          {editingProfile ? (
            <div style={{ animation: 'fadeIn 0.3s' }}>
               <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '2rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>Modifier mon profil</h2>
               <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '0 2.5rem' }}>
                  {/* Pseudo : uniquement pour les anciens comptes sans pseudo */}
                  {!profile?.pseudo && (
                    <>
                      <InputWrapper label="Choisissez votre pseudo (nom visible sur le marketplace)" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path></svg>}>
                        <FastInput type="text" name="pseudo" value={formData.pseudo} onChange={(e) => setFormData({...formData, pseudo: e.target.value})} placeholder="Ex: Boutique_Aminata" style={{ flex: 1, padding: '1.2rem 1.2rem 1.2rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }} />
                      </InputWrapper>
                      <p style={{ fontSize: '0.78rem', color: '#f59e0b', gridColumn: 'span 2', marginTop: '-1rem', marginBottom: '0.5rem' }}>
                        👁️ Ce pseudo sera visible par tous. Vous ne pourrez plus le changer après.
                      </p>
                    </>
                  )}

                  <InputWrapper label="Nom complet (privé — sécurité)" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}>
                    <FastInput type="text" name="full_name" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} style={{ flex: 1, padding: '1.2rem 1.2rem 1.2rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }} />
                  </InputWrapper>
                  
                  <InputWrapper label="Téléphone principal" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>}>
                    <FastInput type="tel" name="phone_number" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} style={{ flex: 1, padding: '1.2rem 1.2rem 1.2rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }} />
                  </InputWrapper>
                  
                  <InputWrapper label="Numéro WhatsApp" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>}>
                    <FastInput type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})} style={{ flex: 1, padding: '1.2rem 1.2rem 1.2rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }} />
                  </InputWrapper>

                  <InputWrapper label="Ville" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>}>
                    <select value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} style={{ flex: 1, padding: '1.2rem 1.2rem 1.2rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', appearance: 'none', color: 'var(--text-main)', fontWeight: '500' }}>
                      <option value="" disabled>Sélectionnez une ville</option>
                      {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
                  </InputWrapper>

                  <InputWrapper label="Email" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>}>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="exemple@email.com" style={{ flex: 1, padding: '1.2rem 1.2rem 1.2rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }} />
                  </InputWrapper>
               </div>
               
               <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', justifyContent: 'flex-end' }}>
                 <button onClick={() => setEditingProfile(false)} className="btn-secondary active-scale hover-lift" style={{ padding: '1rem 2rem', borderRadius: '16px', border: '2px solid #E2E8F0', background: 'white', fontWeight: '700' }}>Annuler</button>
                 <button onClick={handleUpdateProfile} disabled={isSaving} className="btn-primary active-scale hover-lift" style={{ padding: '1rem 2.5rem', borderRadius: '16px', fontWeight: '800' }}>{isSaving ? "Enregistrement..." : "Enregistrer"}</button>
               </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'center', animation: 'fadeIn 0.3s' }}>
              <div className="hover-lift" style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '900', border: '6px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', transform: 'rotate(-3deg)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profile?.boutique_name ? profile.boutique_name.charAt(0).toUpperCase() : (profile?.pseudo || profile?.full_name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                {/* Upload Avatar */}
                <label className="hover-lift" style={{ position: 'absolute', bottom: '0', right: '-5px', width: '36px', height: '36px', background: 'var(--primary-gradient)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(190,18,60,0.3)', border: '2px solid white' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </label>
              </div>
              
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '900', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                  {profile?.pseudo || profile?.full_name || 'Utilisateur sans nom'}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.5rem' }}>
                  <span className="glass-panel" style={{ padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}>📍 {profile?.city || profile?.location || 'Sénégal'}</span>
                  {isRealEmail(profile?.email) && (
                    <span className="glass-panel" style={{ padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}>📧 {profile.email}</span>
                  )}
                  {(profile?.whatsapp_number || profile?.phone_number) && (
                    <span className="glass-panel" style={{ padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}>📱 {formatPhone(profile?.whatsapp_number || profile?.phone_number)}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px' }}>
                <button onClick={() => setEditingProfile(true)} className="btn-secondary active-scale touch-target hover-lift" style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '2px solid #E2E8F0', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                  Modifier mon profil
                </button>

                <button onClick={handleDeleteMyAccount} className="active-scale touch-target hover-lift" style={{ width: '100%', padding: '0.8rem', borderRadius: '16px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  🗑️ Supprimer mon compte
                </button>



                {profile?.account_type === 'boutique' ? (
                  <>
                    <Link to={`/boutique/${profile.id}`} className="active-scale touch-target hover-lift" style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: 'var(--primary-gradient)', color: 'white', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                      Voir ma vitrine 🏪
                    </Link>
                    {profile.is_verified && (
                      <div style={{ width: '100%', padding: '0.8rem', borderRadius: '16px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: '800', fontSize: '0.85rem', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                        🛡️ Vendeur Certifié
                      </div>
                    )}
                    
                    {/* Trial & Subscription Status */}
                    {isBoutiqueExpired(profile) ? (
                       <div style={{ background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: '20px', padding: '20px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
                         <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🔒</div>
                         <h4 style={{ color: '#991B1B', fontSize: '1.1rem', fontWeight: '900', margin: '0 0 6px 0' }}>
                           Période d'essai 15 jours expirée
                         </h4>
                         <p style={{ color: '#7F1D1D', fontSize: '0.85rem', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                           Votre boutique n'est plus accessible au public. Abonnez-vous (5 000F ou 10 000F/mois) pour réactiver votre vitrine.
                         </p>
                         <Link to="/subscription" className="active-scale hover-lift" style={{ background: '#DC2626', color: 'white', padding: '12px 20px', borderRadius: '14px', fontSize: '0.9rem', textAlign: 'center', textDecoration: 'none', fontWeight: '800', display: 'inline-block', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }}>
                           💳 Activer mon Abonnement →
                         </Link>
                       </div>
                    ) : profile?.account_type === 'boutique' && profile?.subscription_plan === 'none' ? (
                       <Link to="/subscription" className="active-scale hover-lift" style={{ background: '#ecfdf5', color: '#10b981', padding: '12px', borderRadius: '16px', fontSize: '0.9rem', textAlign: 'center', textDecoration: 'none', fontWeight: '800', border: '2px solid #a7f3d0', display: 'block', width: '100%', boxSizing: 'border-box' }}>
                         🚀 Essai boutique gratuit : {getTrialDaysRemaining(profile)} jours restants
                       </Link>
                    ) : null}

                    {profile?.subscription_plan && profile?.subscription_plan !== 'none' && (
                      <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '700', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#64748B' }}>
                          Forfait : <strong style={{ color: 'var(--primary)' }}>{profile.subscription_plan.toUpperCase()}</strong>
                        </span>
                        {profile.subscription_end_date && (
                          <span style={{ fontSize: '0.8rem', color: (new Date(profile.subscription_end_date) - new Date() < 86400000 * 3) ? '#EF4444' : '#10B981' }}>
                            {new Date(profile.subscription_end_date) - new Date() < 86400000 * 3 
                              ? `⚠️ Expire bientôt : ${new Date(profile.subscription_end_date).toLocaleDateString('fr-FR')}` 
                              : `Expire le : ${new Date(profile.subscription_end_date).toLocaleDateString('fr-FR')}`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Certification Badge */}
                    {profile?.is_verified ? (
                       <div style={{ background: '#E0F2FE', color: '#0284C7', padding: '12px', borderRadius: '16px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '800', border: '2px solid #BAE6FD' }}>
                         ✅ Boutique Certifiée
                       </div>
                    ) : certPending ? (
                       <div style={{ background: '#FFFBEB', color: '#B45309', padding: '12px', borderRadius: '16px', fontSize: '0.88rem', textAlign: 'center', fontWeight: '800', border: '2px solid #FDE68A' }}>
                         ⏳ Certification en cours d'examen
                       </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Link to="/create-boutique" className="active-scale touch-target hover-lift glass-button" style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: 'white', color: 'var(--primary)', border: '2px dashed var(--primary)', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                      Créer ma Boutique 🏪
                    </Link>
                    
                    {profile?.subscription_plan && profile?.subscription_plan !== 'none' ? (
                      <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '700', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', boxSizing: 'border-box' }}>
                        <span style={{ color: '#64748B' }}>
                          Forfait : <strong style={{ color: 'var(--primary)' }}>{profile.subscription_plan.toUpperCase()}</strong>
                        </span>
                        {profile.subscription_end_date && (
                          <span style={{ fontSize: '0.8rem', color: (new Date(profile.subscription_end_date) - new Date() < 86400000 * 3) ? '#EF4444' : '#10B981' }}>
                            {new Date(profile.subscription_end_date) - new Date() < 86400000 * 3 
                              ? `⚠️ Expire bientôt : ${new Date(profile.subscription_end_date).toLocaleDateString('fr-FR')}` 
                              : `Expire le : ${new Date(profile.subscription_end_date).toLocaleDateString('fr-FR')}`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Link to="/subscription" className="active-scale touch-target hover-lift" style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: '#FEF3C7', color: '#B45309', border: '2px solid #FDE68A', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                        ⭐ Abonnez-vous
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modernized Navigation Tabs */}
        {!editingProfile && (
          <div style={{ display: 'flex', gap: '2rem', borderBottom: '2px solid #E2E8F0', marginBottom: '2.5rem', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            <button 
              onClick={() => setActiveTab('annonces')} 
              style={{ background: 'none', border: 'none', padding: '0 0 16px 0', fontSize: '1.15rem', fontWeight: activeTab === 'annonces' ? '800' : '600', color: activeTab === 'annonces' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'annonces' ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
            >
              📦 Mes Annonces <span style={{ background: activeTab === 'annonces' ? 'var(--primary-light)' : '#f1f5f9', color: activeTab === 'annonces' ? 'var(--primary)' : '#64748b', padding: '2px 10px', borderRadius: '12px', fontSize: '0.9rem', marginLeft: '8px' }}>{myProducts.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('reels')} 
              style={{ background: 'none', border: 'none', padding: '0 0 16px 0', fontSize: '1.15rem', fontWeight: activeTab === 'reels' ? '800' : '600', color: activeTab === 'reels' ? '#E11D48' : 'var(--text-muted)', borderBottom: activeTab === 'reels' ? '3px solid #E11D48' : '3px solid transparent', marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
            >
              🎬 Mes Reels & Analytics
            </button>
            <button 
              onClick={() => setActiveTab('stats')} 
              style={{ background: 'none', border: 'none', padding: '0 0 16px 0', fontSize: '1.15rem', fontWeight: activeTab === 'stats' ? '800' : '600', color: activeTab === 'stats' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'stats' ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
            >
              📊 Statistiques Vendeur
            </button>
            <button 
              onClick={() => setActiveTab('notifications')} 
              style={{ background: 'none', border: 'none', padding: '0 0 16px 0', fontSize: '1.15rem', fontWeight: activeTab === 'notifications' ? '800' : '600', color: activeTab === 'notifications' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'notifications' ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
            >
              🔔 Mes Alertes
            </button>
            <button 
              onClick={() => navigate('/favorites')} 
              style={{ background: 'none', border: 'none', padding: '0 0 16px 0', fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-muted)', borderBottom: '3px solid transparent', marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
            >
              ❤️ Mes Favoris
            </button>
            <button 
              onClick={() => setActiveTab('parametres')} 
              style={{ background: 'none', border: 'none', padding: '0 0 16px 0', fontSize: '1.15rem', fontWeight: activeTab === 'parametres' ? '800' : '600', color: activeTab === 'parametres' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'parametres' ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
            >
              ⚙️ Paramètres
            </button>
          </div>
        )}

        {/* Tab Content */}
        {!editingProfile && (
          <div>
            
            {activeTab === 'annonces' && (
              <div className="animate-fade-in-up stagger-2">
                {myProducts.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '5rem 2rem', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100px', height: '100px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', color: 'var(--primary)', fontSize: '2.5rem' }}>
                      📦
                    </div>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Votre boutique est vide</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '400px', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                      Vous n'avez pas encore publié d'annonce. Commencez à vendre vos articles dès aujourd'hui et touchez des milliers d'acheteurs.
                    </p>
                    <Link to="/publish" className="btn-primary active-scale hover-lift" style={{ padding: '1.2rem 2.5rem', borderRadius: '16px', fontWeight: '800', fontSize: '1.1rem' }}>
                      Vendre mon premier article
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ gap: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                    {myProducts.map((product, index) => {
                      const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x400?text=No+Image';
                      
                      return (
                        <div key={product.id} className={`product-card animate-fade-in-up stagger-${(index % 4) + 1} hover-lift`} style={{ padding: 0, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                          <div style={{ position: 'relative', paddingTop: '100%', background: '#F8FAFC' }}>
                            <img src={imageUrl} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            
                            {/* Badge En Ligne (Haut Gauche) */}
                            <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, background: 'rgba(16, 185, 129, 0.95)', color: 'white', padding: '3px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800', backdropFilter: 'blur(4px)', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                              ● En ligne
                            </div>
                            
                            {/* Quick Action Icons (Bas Droite de l'image) */}
                            <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 10, display: 'flex', gap: '5px' }}>
                              <Link to={`/product/${product.id}`} title="Voir" className="active-scale" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', textDecoration: 'none' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              </Link>
                              <Link to={`/edit-product/${product.id}`} title="Modifier" className="active-scale" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', textDecoration: 'none' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </Link>
                              <button onClick={() => handleDeleteProduct(product.id)} title="Supprimer" className="active-scale" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(254, 242, 242, 0.95)', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ padding: '1rem 1rem 0.8rem 1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: (product.price || 0) > 999999 ? '0.95rem' : '1.15rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '4px', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {product.price > 0 ? `${product.price.toLocaleString('fr-FR')} FCFA` : product.metadata?.price_type || 'Sur demande'}
                            </div>
                            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.35', marginBottom: '8px' }}>
                              {product.title}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', marginBottom: '8px' }}>
                              <span>{new Date(product.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                {(product.views_count > 0 || product.views_count === 0) && <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> {product.views_count || 0}</span>}
                                {product.favorites_count > 0 && <span style={{ color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> {product.favorites_count}</span>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Powerful High-Converting Booster CTA Button */}
                          <div style={{ padding: '0 8px 8px 8px', background: 'white' }}>
                            {!product.is_boosted ? (
                              <button 
                                onClick={() => openBoostMarketing(product.id, product.title)} 
                                className="active-scale hover-lift" 
                                style={{ width: '100%', padding: '10px 8px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '12px', cursor: 'pointer', color: 'white', fontSize: '0.82rem', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)', whiteSpace: 'nowrap' }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                                ⚡ BOOSTER (+10x vues)
                              </button>
                            ) : (
                              <div style={{ width: '100%', padding: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '12px', color: 'white', fontSize: '0.78rem', fontWeight: '800', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                ⚡ SPONSORISÉ (ACTIF)
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── REELS & ANALYTICS VENDEUR ────────────────────────────────────── */}
            {activeTab === 'reels' && (() => {
              const sellerReels = myProducts.filter(p => p.metadata?.video_url || p.video_url);
              const totalReelViews = sellerReels.reduce((sum, r) => sum + (r.views_count || 0), 0);
              const plan = profile?.subscription_plan || 'free';
              const isVip = plan === 'premium' || profile?.account_type === 'vip';
              const isPro = plan === 'basique' || profile?.account_type === 'pro' || profile?.account_type === 'boutique';
              const reelsThisMonth = sellerReels.length;

              return (
                <div className="animate-fade-in">
                  {/* Overview Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #09090B 0%, #172554 100%)', color: 'white', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                      <div style={{ fontSize: '12px', color: '#93C5FD', fontWeight: '700' }}>TOTAL REELS PUBLIÉS</div>
                      <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>🎬 {sellerReels.length}</div>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', color: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(16,185,129,0.2)' }}>
                      <div style={{ fontSize: '12px', color: '#A7F3D0', fontWeight: '700' }}>CUMUL DES VUES REELS</div>
                      <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>👁️ {totalReelViews.toLocaleString()}</div>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #BE123C 0%, #E11D48 100%)', color: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(225,29,72,0.2)' }}>
                      <div style={{ fontSize: '12px', color: '#FECDD3', fontWeight: '700' }}>FORFAIT REELS</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', marginTop: '4px' }}>
                        {isVip ? '👑 VIP (Illimité)' : isPro ? `🔥 Pro (${reelsThisMonth}/3 ce mois)` : '⚡ Pay-Per-Reel (1 500F)'}
                      </div>
                    </div>
                  </div>

                  {/* Reel List Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      Vos Vidéos Reels en Ligne ({sellerReels.length})
                    </h3>
                    <Link to="/reels" style={{ background: 'linear-gradient(135deg, #E11D48, #BE123C)', color: '#FFF', padding: '8px 16px', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '13px' }}>
                      ➕ NOUVEAU REEL
                    </Link>
                  </div>

                  {sellerReels.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#F8FAFC', borderRadius: '20px', border: '2px dashed #CBD5E1' }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎬</div>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: '16px' }}>Aucun Reel publié pour le moment</h4>
                      <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 16px 0' }}>Postez des vidéos courtes pour captiver les acheteurs et booster vos ventes !</p>
                      <Link to="/reels" style={{ background: '#E11D48', color: '#FFF', padding: '10px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, display: 'inline-block' }}>
                        ➕ Publier mon premier Reel Express
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                      {sellerReels.map(reel => (
                        <div key={reel.id} style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
                          <div style={{ position: 'relative', height: '180px', background: '#09090B' }}>
                            <video src={reel.metadata?.video_url || reel.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.75)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, backdropFilter: 'blur(4px)' }}>
                              👁️ {reel.views_count || 0} vues
                            </div>
                            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(16, 185, 129, 0.9)', color: 'white', padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 800 }}>
                              ● REEL ACTIF
                            </div>
                          </div>
                          <div style={{ padding: '16px' }}>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 800, color: '#1E293B', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {reel.title}
                            </h4>
                            <div style={{ color: '#10B981', fontWeight: 900, fontSize: '16px', marginBottom: '12px' }}>
                              {reel.price ? `${Number(reel.price).toLocaleString()} FCFA` : 'Sur demande'}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Link to={`/product/${reel.id}`} style={{ flex: 1, textAlign: 'center', background: '#F1F5F9', color: '#334155', padding: '8px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '12px' }}>
                                Voir le Reel
                              </Link>
                              <button onClick={() => handleDeleteProduct(reel.id)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── STATISTIQUES VENDEUR ────────────────────────────────────────── */}
            {activeTab === 'stats' && (
              <VendorAnalyticsDashboard user={user} userProfile={profile} myProducts={myProducts} />
            )}

            {/* ── CENTRE DE NOTIFICATIONS ────────────────────────────────────────── */}
            {activeTab === 'notifications' && (
              <div className="glass-panel animate-fade-in-up stagger-2" style={{ background: 'white', borderRadius: '24px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔔 Centre de Notifications & Alertes Vendeur
                </h3>

                <div style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#1E293B' }}>🔔 Notifications Push Navigateur / PWA</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                      Statut : {getNotificationPermissionState() === 'granted' ? '✅ Activées sur cet appareil' : '⚠️ Non activées'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {getNotificationPermissionState() !== 'granted' ? (
                      <button
                        onClick={() => requestNotificationPermission(user?.id)}
                        style={{ padding: '8px 14px', background: 'var(--primary, #8a1c1c)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Activer les Notifications 🔔
                      </button>
                    ) : (
                      <button
                        onClick={() => sendSystemNotification("🔔 Test Notification Push !", { body: "Vos notifications système ColobaneMarket fonctionnent parfaitement !", url: "/profile" })}
                        style={{ padding: '8px 14px', background: '#0284C7', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Tester l'envoi 🚀
                      </button>
                    )}
                  </div>
                </div>

                {(() => {
                  const localNotifs = JSON.parse(localStorage.getItem(`colobane_notifs_${user?.id}`) || '[]');
                  const allNotifsMap = new Map();
                  
                  localNotifs.forEach(n => {
                    allNotifsMap.set(n.id, {
                      id: n.id,
                      title: n.title,
                      message: n.message,
                      type: n.type || 'info',
                      icon: n.icon || '🔔',
                      created_at: n.created_at || n.date || new Date().toISOString(),
                      link: n.link || '#'
                    });
                  });

                  profileNotifications.forEach(n => {
                    allNotifsMap.set(n.id, n);
                  });

                  const displayNotifs = Array.from(allNotifsMap.values());
                  displayNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                  if (displayNotifs.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748B', fontSize: '14px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                        Aucune notification pour le moment.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {displayNotifs.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => n.link && n.link !== '#' && navigate(n.link)}
                          style={{ 
                            background: n.type === 'success' ? '#F0FDF4' : 
                                        n.type === 'warning' ? '#FFFBEB' :
                                        n.type === 'danger' ? '#FEF2F2' :
                                        n.type === 'opportunity' ? '#EEF2FF' : '#F8FAFC', 
                            padding: '16px 20px', 
                            borderRadius: '16px', 
                            border: n.type === 'success' ? '1px solid #DCFCE7' : 
                                    n.type === 'warning' ? '1px solid #FDE68A' :
                                    n.type === 'danger' ? '1px solid #FCA5A5' :
                                    n.type === 'opportunity' ? '1px solid #C7D2FE' : '1px solid #E2E8F0', 
                            display: 'flex', 
                            gap: '14px', 
                            alignItems: 'flex-start',
                            cursor: n.link && n.link !== '#' ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                          }}
                          className={n.link && n.link !== '#' ? "active-scale hover-lift" : ""}
                        >
                          <div style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '50%', 
                            background: n.type === 'success' ? '#DCFCE7' : 
                                        n.type === 'warning' ? '#FEF3C7' :
                                        n.type === 'danger' ? '#FEE2E2' :
                                        n.type === 'opportunity' ? '#E0E7FF' : '#F1F5F9', 
                            color: n.type === 'success' ? '#166534' : 
                                   n.type === 'warning' ? '#92400E' :
                                   n.type === 'danger' ? '#991B1B' :
                                   n.type === 'opportunity' ? '#3730A3' : '#475569', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '1.2rem', 
                            flexShrink: 0 
                          }}>
                            {n.icon || '🔔'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '800', fontSize: '1.02rem', color: '#0F172A', marginBottom: '4px' }}>{n.title}</div>
                            <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.4' }}>{n.message}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '6px', fontWeight: '600' }}>
                              {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'parametres' && (
              <div className="glass-panel animate-fade-in-up stagger-2" style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '2rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>Paramètres du compte</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div className="hover-lift" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '2px solid #E2E8F0', borderRadius: '16px', background: '#FAFAF9' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontWeight: '800', fontSize: '1.1rem' }}>Notifications Email</h4>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Recevoir un email pour chaque nouveau message</p>
                    </div>
                    <div style={{ width: '50px', height: '28px', background: 'var(--primary-gradient)', borderRadius: '14px', position: 'relative', cursor: 'pointer', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                      <div style={{ width: '24px', height: '24px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                    </div>
                  </div>

                  <div className="hover-lift" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '2px solid #E2E8F0', borderRadius: '16px', background: '#FAFAF9' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontWeight: '800', fontSize: '1.1rem' }}>Notifications Push</h4>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Recevoir des alertes sur le téléphone même si le site est fermé</p>
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          await OneSignal.Slidedown.promptPush();
                          if (window.Notification && Notification.permission === 'granted') {
                             await OneSignal.User.PushSubscription.optIn();
                             alert("Notifications push activées avec succès ! Vérifiez OneSignal.");
                          }
                        } catch (e) {
                          console.error('OneSignal prompt error:', e);
                          await requestNotificationPermission(user?.id);
                        }
                      }}
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      Activer 🔔
                    </button>
                  </div>

                  <div className="hover-lift" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '2px solid #E2E8F0', borderRadius: '16px', background: '#FAFAF9' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontWeight: '800', fontSize: '1.1rem' }}>Boutique Officielle</h4>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Mettre à jour vos informations professionnelles</p>
                    </div>
                    {profile?.account_type === 'boutique' ? (
                      <span style={{ color: '#10b981', fontWeight: '800', fontSize: '1rem', background: '#ecfdf5', padding: '8px 16px', borderRadius: '12px' }}>Activé ✓</span>
                    ) : (
                      <Link to="/create-boutique" className="glass-button" style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1rem', textDecoration: 'none', padding: '8px 16px', border: '2px solid var(--primary)', borderRadius: '12px' }}>Créer</Link>
                    )}
                  </div>

                  <button onClick={handleLogout} className="btn-secondary active-scale hover-lift" style={{ background: '#fef2f2', color: '#ef4444', border: '2px solid #fecaca', padding: '1.2rem', borderRadius: '16px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '1.5rem', fontSize: '1.1rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
        
      </div>

      {/* Modal de Confirmation Wave pour Boost */}
      {showBoostModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '450px', position: 'relative', animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <button onClick={() => setShowBoostModal(false)} className="hover-lift" style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '15px', animation: 'float 3s ease-in-out infinite' }}>🚀</div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '900', margin: '0 0 12px 0', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>Booster l'annonce</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.5' }}>Avez-vous effectué l'envoi de <strong style={{ color: 'var(--primary)', fontSize: '1.15rem' }}>{selectedProductToBoost?.price} FCFA</strong> via le lien Wave ?</p>
            </div>
            <form onSubmit={confirmBoost}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', marginBottom: '10px', color: 'var(--text-main)' }}>Numéro Wave utilisé pour le paiement</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #E2E8F0', borderRadius: '16px', background: 'white', padding: '4px' }}>
                  <span style={{ padding: '0 12px', color: '#94A3B8', fontWeight: '700' }}>+221</span>
                  <input 
                    type="tel" 
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="77 123 45 67"
                    style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', outline: 'none', fontSize: '1.1rem', fontWeight: '600' }}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={isProcessing} className="btn-primary active-scale hover-lift" style={{ width: '100%', padding: '18px', borderRadius: '16px', fontWeight: '900', fontSize: '1.15rem', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', opacity: isProcessing ? 0.7 : 1, boxShadow: '0 8px 25px rgba(190,18,60,0.3)' }}>
                {isProcessing ? 'Envoi en cours...' : 'Confirmer mon paiement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Marketing Modal pour le Boost */}
      {showBoostMarketingModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
          <div className="glass-panel" style={{ background: 'white', borderRadius: '24px', padding: '24px 18px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', animation: 'scaleUp 0.3s ease-out', border: '2px solid #F59E0B', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setShowBoostMarketingModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#FEF3C7', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#B45309' }}>
              ✕
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '10px' }}>
              <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', padding: '4px 16px', borderRadius: '20px', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                ⚡ VISIBILITÉ MAXIMALE
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '12px 0 4px 0', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>Propulsez votre annonce</h3>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#D97706' }}>
                Choisissez votre formule
              </div>
            </div>
            
            <ul style={{ listStyle: 'none', margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '10px', background: '#FEF3C7', padding: '14px', borderRadius: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#92400E', fontSize: '0.9rem' }}>
                <span style={{ background: '#F59E0B', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>✓</span>
                10x plus de vues sur votre annonce
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#92400E', fontSize: '0.9rem' }}>
                <span style={{ background: '#F59E0B', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>✓</span>
                Apparaissez en tête des résultats
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#92400E', fontSize: '0.9rem' }}>
                <span style={{ background: '#F59E0B', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>✓</span>
                Vendez beaucoup plus rapidement
              </li>
            </ul>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => initiateBoost(productToBoostMarketing.id, productToBoostMarketing.title, 500, 2)} className="active-scale" style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', fontWeight: '800', fontSize: '0.95rem', background: 'white', color: '#B45309', border: '1.5px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span>⚡ Boost 2 Jours</span>
                <span style={{ background: '#FEF3C7', padding: '3px 10px', borderRadius: '10px', fontWeight: '900', color: '#B45309' }}>500 FCFA</span>
              </button>
              <button onClick={() => initiateBoost(productToBoostMarketing.id, productToBoostMarketing.title, 1500, 7)} className="active-scale" style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', fontWeight: '800', fontSize: '0.95rem', background: 'white', color: '#B45309', border: '1.5px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span>⚡ Boost 7 Jours</span>
                <span style={{ background: '#FEF3C7', padding: '3px 10px', borderRadius: '10px', fontWeight: '900', color: '#B45309' }}>1 500 FCFA</span>
              </button>
              <button onClick={() => initiateBoost(productToBoostMarketing.id, productToBoostMarketing.title, 2500, 15)} className="active-scale" style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', fontWeight: '800', fontSize: '0.95rem', background: 'white', color: '#B45309', border: '1.5px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span>⚡ Boost 15 Jours</span>
                <span style={{ background: '#FEF3C7', padding: '3px 10px', borderRadius: '10px', fontWeight: '900', color: '#B45309' }}>2 500 FCFA</span>
              </button>
              <button onClick={() => initiateBoost(productToBoostMarketing.id, productToBoostMarketing.title, 5000, 30)} className="active-scale" style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', fontWeight: '900', fontSize: '1rem', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
                <span>⚡ Mensuel (30 Jours)</span>
                <span style={{ background: 'rgba(255,255,255,0.25)', padding: '3px 10px', borderRadius: '10px' }}>5 000 FCFA</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
