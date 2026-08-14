import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import SocialSEO from '../components/SocialSEO';
import { shareBoutique } from '../utils/socialShare';
import { supabase } from '../lib/supabase';
import FavoriteButton from '../components/FavoriteButton';
import ReportModal from '../components/ReportModal';
import BoutiqueQRCodeModal from '../components/BoutiqueQRCodeModal';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Store, BadgeCheck, MapPin, Star, QrCode } from 'lucide-react';
import { isBoutiqueExpired } from '../utils/boutiqueHelpers';
import FollowButton from '../components/FollowButton';

const BoutiqueProfilePage = () => {
  const { boutiqueId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalogue');
  const [searchQuery, setSearchQuery] = useState('');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showVendorMenu, setShowVendorMenu] = useState(false);
  const [showReportVendorModal, setShowReportVendorModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);

  useEffect(() => {
    const fetchBoutiqueData = async () => {
      try {
        const [profileRes, productsRes, reviewsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', boutiqueId).single(),
          supabase.from('products').select('*').eq('seller_id', boutiqueId).order('created_at', { ascending: false }),
          supabase.from('boutique_reviews')
            .select('*, reviewer:reviewer_id (id, full_name, avatar_url)')
            .eq('boutique_id', boutiqueId)
            .order('created_at', { ascending: false })
            .limit(30)
        ]);

        if (profileRes.error) throw profileRes.error;
        setProfile(profileRes.data);

        if (productsRes.error) throw productsRes.error;
        setProducts(productsRes.data || []);

        if (!reviewsRes.error && reviewsRes.data) {
          setReviews(reviewsRes.data);
        }
      } catch (err) {
        console.error('Error fetching boutique:', err);
        setError(err.message || 'network');
      } finally {
        setLoading(false);
      }
    };

    fetchBoutiqueData();
  }, [boutiqueId]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error("Connectez-vous pour laisser un avis"); return; }
    if (user.id === boutiqueId) { toast.error("Vous ne pouvez pas noter votre propre boutique"); return; }
    if (!newReview.rating) { toast.error("Veuillez sélectionner une note"); return; }
    
    setSubmittingReview(true);
    try {
      const { data: richReview, error } = await supabase
        .from('boutique_reviews')
        .insert([{
          boutique_id: boutiqueId,
          reviewer_id: user.id,
          rating: newReview.rating,
          comment: newReview.comment
        }])
        .select('*, reviewer:reviewer_id (id, full_name, avatar_url)')
        .single();
      
      if (error) {
        if (error.code === '23505') { toast.error("Vous avez déjà laissé un avis."); }
        else { throw error; }
      } else {
        toast.success("Avis publié avec succès !");
        // Update local state directly for immediate feedback
        setReviews([richReview, ...reviews]);
        setNewReview({ rating: 5, comment: '' });
      }
    } catch(err) {
      toast.error("Erreur lors de l'envoi.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;
  
  const filteredProducts = useMemo(() => {
    const normalize = (str) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const targetQuery = normalize(searchQuery);
    return products.filter(p => normalize(p.title).includes(targetQuery));
  }, [products, searchQuery]);

  if (loading) {
    return (
      <div className="section-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Chargement de la boutique...</h2>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="section-container" style={{ minHeight: '60vh', textAlign: 'center', paddingTop: '4rem' }}>
        {error ? (
          <>
            <h2>Erreur de réseau</h2>
            <p>{error}</p>
          </>
        ) : (
          <h2>Boutique introuvable</h2>
        )}
        <Link to="/boutiques" className="btn-primary" style={{ display: 'inline-block', marginTop: '2rem' }}>Retour aux boutiques</Link>
      </div>
    );
  }

  if (profile && isBoutiqueExpired(profile) && user?.id !== boutiqueId) {
    return (
      <div className="section-container" style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '12px' }}>
          Boutique temporairement suspendue
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px' }}>
          La période d'essai gratuite de 15 jours de cette boutique est arrivée à son terme. Le catalogue sera de nouveau accessible dès le renouvellement de son abonnement vendeur.
        </p>
        <Link to="/boutiques" className="btn-primary active-scale" style={{ padding: '12px 24px', borderRadius: '16px', textDecoration: 'none', fontWeight: '800' }}>
          🏪 Découvrir les autres boutiques →
        </Link>
      </div>
    );
  }

  // WhatsApp Link Generation
  let whatsappNumber = profile.whatsapp_number || profile.phone_number;
  if (whatsappNumber) {
    whatsappNumber = whatsappNumber.replace(/\D/g, ''); 
  }
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Bonjour ! Je viens de visiter votre boutique sur ColobaneMarket.")}`;

  let callNumber = profile.phone_number || profile.whatsapp_number || '';
  if (callNumber) {
    callNumber = callNumber.replace(/[^\d+]/g, '');
  }

  const boutiqueName = profile.boutique_name || profile.full_name || 'Boutique';
  const canonicalUrl = `https://colobanemarket.vercel.app/boutique/${boutiqueId}`;
  const schemaStore = {
    "@context": "https://schema.org/",
    "@type": "Store",
    "name": boutiqueName,
    "image": profile.avatar_url || profile.banner_url || "https://colobanemarket.vercel.app/hero.png",
    "description": profile.boutique_description || `Boutique officielle ${boutiqueName} sur Colobane Market.`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": profile.location || profile.region || "Dakar",
      "addressCountry": "SN"
    },
    "url": canonicalUrl
  };

  return (
    <div className="boutique-profile-page animate-fade-in-up" style={{ paddingBottom: '140px' }}>
      <SocialSEO
        title={`${boutiqueName} — Boutique Officielle sur ColobaneMarket`}
        description={profile.boutique_description?.substring(0, 160) || `Découvrez tous les produits et la vitrine officielle de ${boutiqueName} à ${profile.location || 'Dakar'} sur ColobaneMarket.`}
        image={profile.avatar_url || profile.banner_url}
        url={canonicalUrl}
        type="profile"
      />

      {/* Immersive Banner */}
      <div 
        className="boutique-banner" 
        style={{ 
          height: '320px', 
          background: profile.banner_url 
            ? `linear-gradient(to bottom, rgba(15,23,42,0) 0%, rgba(15,23,42,0.85) 100%), url(${profile.banner_url}) center/cover no-repeat` 
            : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #831843 100%)', 
          position: 'relative'
        }}
      ></div>

      <div className="section-container" style={{ position: 'relative' }}>
        <div className="boutique-profile-card glass-panel" style={{ marginTop: '-80px', position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.95)', borderRadius: '28px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
          
          {/* Menu discret 3 points en haut à droite */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 20 }}>
            <button 
              onClick={() => setShowVendorMenu(v => !v)} 
              className="touch-target active-scale"
              style={{
                background: '#F1F5F9', border: 'none',
                borderRadius: '50%', width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '1.2rem', color: '#64748B', fontWeight: '800'
              }}
            >
              ⋮
            </button>

            {showVendorMenu && (
              <div 
                style={{
                  position: 'absolute', top: '44px', right: 0,
                  background: 'white', borderRadius: '14px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                  border: '1px solid #E2E8F0', minWidth: '180px', zIndex: 999,
                  overflow: 'hidden', animation: 'fadeIn 0.15s ease-out'
                }}
              >
                <div 
                  onClick={() => { setShowVendorMenu(false); setShowReportVendorModal(true); }}
                  style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', color: '#EF4444' }}
                >
                  <span>🚩</span>
                  <span>Signaler ce vendeur</span>
                </div>
              </div>
            )}
          </div>

          {/* Logo et Infos Principales */}
          <div className="boutique-profile-info">
            <div 
              className="boutique-profile-avatar hover-lift"
              style={{ 
                width: '120px',
                height: '120px',
                borderRadius: '30px',
                border: '4px solid white',
                boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.boutique_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '900', fontFamily: 'var(--font-heading)' }}>
                  {(profile.boutique_name || profile.full_name || 'B').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="boutique-profile-details">
              <h1 style={{ fontSize: '2.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)', fontWeight: '900', color: 'var(--text-main)' }}>
                {profile.boutique_name || profile.full_name || 'Boutique Sans Nom'}
                {profile.is_verified && <span style={{ color: '#0ea5e9', display: 'flex', alignItems: 'center' }}><BadgeCheck size={28} strokeWidth={3} /></span>}
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.05rem', lineHeight: '1.6', maxWidth: '600px' }}>
                {profile.boutique_description || 'Bienvenue dans notre boutique officielle sur ColobaneMarket.'}
              </p>
              <div className="boutique-profile-badges" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '1rem' }}>
                <span className="boutique-badge" style={{ padding: '8px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: 'var(--text-main)', borderRadius: '14px', fontSize: '0.88rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color="var(--primary)" /> {profile.location || profile.region || 'Sénégal'}
                </span>
                {profile.business_hours && (
                  <span className="boutique-badge" style={{ padding: '8px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: 'var(--text-main)', borderRadius: '14px', fontSize: '0.88rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    🕒 {profile.business_hours}
                  </span>
                )}
                <div className="boutique-badge boutique-badge-rating hover-lift" style={{ cursor: 'pointer', padding: '8px 14px', background: '#FFFBEB', border: '1px solid #FCD34D', color: '#B45309', borderRadius: '14px', fontSize: '0.88rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => setActiveTab('avis')}>
                  <Star size={15} fill="#f59e0b" color="#f59e0b" />
                  <span>{avgRating > 0 ? avgRating : 'Nouveau'}</span>
                  <span style={{ fontWeight: '600', opacity: 0.8 }}>({reviews.length} avis)</span>
                </div>
                {profile.is_verified && (
                  <span style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', borderRadius: '14px', fontSize: '0.85rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
                    🛡️ Vendeur Certifié
                  </span>
                )}
              </div>


            </div>
          </div>

          {/* Boutons de Contact et Abonnement */}
          <div className="boutique-profile-actions" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <FollowButton 
                boutiqueId={boutiqueId} 
                boutiqueName={boutiqueName} 
                size="lg" 
              />
              <a 
                href={whatsappNumber ? whatsappUrl : '#'} 
                onClick={(e) => { if (!whatsappNumber) { e.preventDefault(); toast.error("Cette boutique n'a pas renseigné son WhatsApp."); } }}
                target={whatsappNumber ? "_blank" : ""} 
                rel="noopener noreferrer" 
                className={`active-scale touch-target hover-lift ${whatsappNumber ? 'btn-whatsapp' : ''}`}
                style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', background: whatsappNumber ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' : '#e2e8f0', color: whatsappNumber ? 'white' : '#94a3b8', padding: '0.9rem 1.4rem', borderRadius: '18px', textDecoration: 'none', fontWeight: '800', fontSize: '1rem', cursor: whatsappNumber ? 'pointer' : 'not-allowed', border: 'none', boxShadow: whatsappNumber ? '0 8px 20px rgba(37, 211, 102, 0.3)' : 'none' }} 
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                Contacter par WhatsApp
              </a>
              {callNumber && (
                <a 
                  href={`tel:${callNumber}`} 
                  className="active-scale touch-target hover-lift" 
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.9rem 1.2rem', borderRadius: '18px', textDecoration: 'none', fontWeight: '800', background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: 'var(--text-main)', fontSize: '0.95rem' }}
                >
                  📞 Appeler ({callNumber})
                </a>
              )}
              <button 
                onClick={() => setShowQRCodeModal(true)}
                className="btn-secondary active-scale touch-target hover-lift" 
                style={{ height: '48px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#FFFBEB', color: '#B45309', border: '1.5px solid #FCD34D', borderRadius: '18px', cursor: 'pointer', fontWeight: 800, fontSize: '0.88rem' }}
                title="Afficher et télécharger le QR Code Officiel"
              >
                <QrCode size={18} /> QR Code
              </button>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Lien de la boutique copié !');
                }}
                className="btn-secondary active-scale touch-target hover-lift" 
                style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: 'var(--text-main)', border: '1.5px solid #E2E8F0', borderRadius: '18px', cursor: 'pointer' }}
                title="Partager le lien de la boutique"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
              </button>
            </div>
          </div>
        </div>

        <BoutiqueQRCodeModal
          isOpen={showQRCodeModal}
          onClose={() => setShowQRCodeModal(false)}
          boutiqueProfile={profile}
        />

        {/* Mobile Sticky Contact Bar */}
        <div className="hide-on-desktop" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(226, 232, 240, 0.6)', zIndex: 100, display: 'flex', gap: '12px', boxShadow: '0 -10px 30px rgba(0,0,0,0.05)' }}>
          <a 
            href={callNumber ? `tel:${callNumber}` : '#'} 
            onClick={(e) => { if (!callNumber) { e.preventDefault(); toast.error("Aucun numéro de téléphone renseigné."); } }}
            className="active-scale" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '2px solid #E2E8F0', color: 'var(--text-main)', borderRadius: '16px', fontWeight: '800', textDecoration: 'none' }}
          >
            📞 Appeler
          </a>
          <a 
            href={whatsappNumber ? whatsappUrl : '#'} 
            onClick={(e) => { if (!whatsappNumber) { e.preventDefault(); toast.error("Cette boutique n'a pas renseigné son WhatsApp."); } }}
            target={whatsappNumber ? "_blank" : ""} 
            rel="noopener noreferrer" 
            className="active-scale" 
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: 'white', borderRadius: '16px', fontWeight: '800', textDecoration: 'none', boxShadow: '0 8px 20px rgba(37,211,102,0.3)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            WhatsApp
          </a>
        </div>

        {/* Tabs Modernized */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginTop: '3.5rem', marginBottom: '2rem', gap: '2.5rem' }}>
          <button onClick={() => setActiveTab('catalogue')} style={{ padding: '0 0 16px 0', border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: activeTab === 'catalogue' ? '800' : '600', color: activeTab === 'catalogue' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'catalogue' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.3s', marginBottom: '-2px' }}>
            Catalogue <span style={{ background: activeTab === 'catalogue' ? 'var(--primary-light)' : '#f1f5f9', color: activeTab === 'catalogue' ? 'var(--primary)' : '#64748b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem', marginLeft: '6px' }}>{products.length}</span>
          </button>
          <button onClick={() => setActiveTab('avis')} style={{ padding: '0 0 16px 0', border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: activeTab === 'avis' ? '800' : '600', color: activeTab === 'avis' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'avis' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.3s', marginBottom: '-2px' }}>
            Avis clients <span style={{ background: activeTab === 'avis' ? 'var(--primary-light)' : '#f1f5f9', color: activeTab === 'avis' ? 'var(--primary)' : '#64748b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem', marginLeft: '6px' }}>{reviews.length}</span>
          </button>
        </div>

        {/* Tab Content: Catalogue */}
        {activeTab === 'catalogue' && (
          <div className="animate-fade-in-up stagger-1">
            <div style={{ marginBottom: '2rem' }}>
              <div className="search-input-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '16px', border: '2px solid #E2E8F0', padding: '0 16px', height: '56px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" placeholder="Rechercher dans cette boutique..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0 12px', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: '500' }} />
              </div>
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🔍</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '600' }}>Aucun article trouvé pour cette recherche.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ gap: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {filteredProducts.map((product, index) => {
                  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x400?text=No+Image';
                  const condition = product.condition || 'Occasion';

                  return (
                    <Link to={`/product/${product.id}`} key={product.id} className={`product-card active-scale animate-fade-in-up stagger-${(index % 4) + 1}`} style={{ textDecoration: 'none', cursor: 'pointer', border: '1px solid rgba(226, 232, 240, 0.6)', background: 'var(--card-bg)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#F8FAFC', overflow: 'hidden' }}>
                        <img src={imageUrl} alt={product.title} className="product-image" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        
                        <span className="glass-panel" style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--text-main)', fontSize: '11px', fontWeight: '800', padding: '6px 10px', borderRadius: '12px', zIndex: 10, border: '1px solid rgba(255,255,255,0.5)' }}>
                          {condition}
                        </span>
                        
                        <FavoriteButton 
                          productId={product.id} 
                          style={{ position: 'absolute', top: '10px', right: '10px', width: '36px', height: '36px', zIndex: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }} 
                        />
                      </div>

                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                          {product.price > 0 ? `${product.price.toLocaleString('fr-FR')} FCFA` : product.metadata?.price_type || 'Sur demande'}
                        </div>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', lineHeight: '1.4', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-main)' }}>
                          {product.title}
                        </h3>
                        <div className="text-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto', paddingTop: '8px', fontWeight: '600', color: '#94A3B8' }}>
                          <MapPin size={14} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.location || 'Dakar'}</span>
                        </div>
                      </div>
                      {/* Bouton Contacter */}
                      <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderTop: '1px solid rgba(190, 18, 60, 0.1)' }}>
                        <Store size={16} strokeWidth={2.5} /> CONTACTER
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Avis */}
        {activeTab === 'avis' && (
          <div className="animate-fade-in-up stagger-1">
            
            {(!user || user.id !== boutiqueId) && (
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', marginBottom: '3rem', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Laissez votre avis</h3>
                {!user ? (
                  <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>Veuillez vous connecter pour laisser un avis sur cette boutique.</p>
                    <Link to="/auth" className="btn-primary" style={{ textDecoration: 'none' }}>Se connecter</Link>
                  </div>
                ) : (
                  <form onSubmit={submitReview}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button type="button" key={star} onClick={() => setNewReview({...newReview, rating: star})} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '32px', color: star <= newReview.rating ? '#f59e0b' : '#e2e8f0', padding: 0, transition: 'transform 0.2s' }} className="hover-lift">
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="Partagez votre expérience avec cette boutique..."
                      value={newReview.comment}
                      onChange={e => setNewReview({...newReview, comment: e.target.value})}
                      style={{ width: '100%', padding: '1.2rem', border: '2px solid #E2E8F0', borderRadius: '16px', outline: 'none', fontSize: '1rem', minHeight: '120px', resize: 'vertical', marginBottom: '1.5rem', fontFamily: 'inherit', background: 'white', transition: 'border-color 0.3s' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    ></textarea>
                    <button type="submit" disabled={submittingReview} className="btn-primary active-scale hover-lift" style={{ padding: '1rem 2rem', borderRadius: '16px', fontWeight: '800', border: 'none', cursor: 'pointer', fontSize: '1.05rem' }}>
                      {submittingReview ? 'Publication...' : 'Publier mon avis'}
                    </button>
                  </form>
                )}
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '2rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>Avis récents</h3>
              {reviews.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
                  <h4 style={{ fontWeight: '800', fontSize: '1.2rem' }}>Aucun avis pour le moment</h4>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Soyez le premier à partager votre expérience !</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {reviews.map((review, index) => (
                    <div key={review.id} className={`animate-fade-in-up stagger-${(index % 4) + 1} glass-panel`} style={{ padding: '1.25rem 1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '0.8rem' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#F1F5F9', backgroundImage: review.reviewer?.avatar_url ? `url(${review.reviewer.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--primary)', flexShrink: 0 }}>
                          {!review.reviewer?.avatar_url && (review.reviewer?.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0F172A' }}>{review.reviewer?.full_name || review.reviewer?.pseudo || 'Acheteur'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748B', marginTop: '2px' }}>
                            <span style={{ color: '#f59e0b', fontSize: '14px', letterSpacing: '2px' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                            <span>•</span>
                            <span style={{ fontWeight: '500' }}>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: fr })}</span>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <div style={{ margin: '0.6rem 0 0 0', fontSize: '1.05rem', color: '#0F172A', fontWeight: '700', lineHeight: '1.5', background: '#F8FAFC', padding: '12px 16px', borderRadius: '14px', borderLeft: '4px solid var(--primary)', wordBreak: 'break-word' }}>
                          "{review.comment}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Report Vendor Modal */}
      <ReportModal 
        isOpen={showReportVendorModal} 
        onClose={() => setShowReportVendorModal(false)} 
        vendorId={boutiqueId} 
      />
    </div>
  );
};

export default BoutiqueProfilePage;
