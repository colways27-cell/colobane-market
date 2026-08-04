import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import ReportModal from '../components/ReportModal';
import SocialSEO from '../components/SocialSEO';
import { shareProduct, copyToClipboard } from '../utils/socialShare';
import toast from 'react-hot-toast';
import { Shield, Tag, Gauge, Settings, Fuel, MapPin, Share2, AlertTriangle, MoreVertical } from 'lucide-react';
import { categories } from '../data/categories';

const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [sameItemSellers, setSameItemSellers] = useState([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [sellerRating, setSellerRating] = useState(null);
  const [sellerReviewCount, setSellerReviewCount] = useState(0);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleShare = async () => {
    setShowShareMenu(false);
    await shareProduct(product);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            profiles:seller_id (
              id, full_name, pseudo, avatar_url, phone_number, whatsapp_number, 
              account_type, boutique_name, is_verified
            )
          `)
          .eq('id', productId)
          .single();

        if (error) throw error;
        setProduct(data);
        
        // Déduplication des vues avec sessionStorage : s'incrémente uniquement lors de la première visite de session
        const viewKey = `viewed_${productId}`;
        if (!sessionStorage.getItem(viewKey) && (!user || user.id !== data.seller_id)) {
          sessionStorage.setItem(viewKey, 'true');
          const newViews = (data.views_count || 0) + 1;
          supabase
            .from('products')
            .update({ views_count: newViews })
            .eq('id', productId)
            .then(() => {})
            .catch(console.error);
        }

        // Tokenisation pour la recherche de vendeurs du même produit
        const titleTokens = (data.title || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !['de','du','des','le','la','les','en','pour','avec','sans','un','une','vends','vend'].includes(w));
        const searchKeyword = titleTokens[0] || '';

        // Exécution en parallèle de toutes les requêtes secondaires avec Promise.all()
        const [similarRes, sameItemRes, favRes, reviewsRes] = await Promise.all([
          // 1. Produit similaires (même catégorie)
          supabase
            .from('products')
            .select('*')
            .eq('category', data.category)
            .neq('id', data.id)
            .limit(4),

          // 2. Vendeurs du même produit
          searchKeyword
            ? supabase
                .from('products')
                .select(`*, profiles:seller_id (id, full_name, pseudo, boutique_name, whatsapp_number, phone_number)`)
                .neq('id', data.id)
                .ilike('title', `%${searchKeyword}%`)
                .limit(5)
            : Promise.resolve({ data: [] }),

          // 3. Statut favori de l'utilisateur
          user
            ? supabase
                .from('favorites')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .maybeSingle()
            : Promise.resolve({ data: null }),

          // 4. Avis du vendeur
          data.seller_id
            ? supabase
                .from('boutique_reviews')
                .select('*')
                .eq('boutique_id', data.seller_id)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [] })
        ]);

        setSimilarProducts(similarRes.data || []);
        setSameItemSellers(sameItemRes.data || []);
        if (favRes.data) setIsFavorite(true);

        const reviewsData = reviewsRes.data || [];
        setSellerReviews(reviewsData);
        if (reviewsData.length > 0) {
          const avg = reviewsData.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewsData.length;
          setSellerRating(avg.toFixed(1));
          setSellerReviewCount(reviewsData.length);
        } else {
          setSellerRating(null);
          setSellerReviewCount(0);
        }

      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [productId, user]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour ajouter aux favoris');
      navigate('/auth');
      return;
    }

    try {
      if (isFavorite) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
        setIsFavorite(false);
        toast.success('Retiré des favoris');
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
        setIsFavorite(true);
        toast.success('Ajouté aux favoris ❤️');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'ajout aux favoris');
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Connectez-vous pour laisser un avis'); return; }
    if (product && user.id === product.seller_id) { toast.error('Vous ne pouvez pas noter votre propre profil'); return; }
    if (!newReviewComment.trim()) { toast.error('Veuillez écrire un commentaire'); return; }

    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('boutique_reviews').insert([{
        boutique_id: product.seller_id,
        reviewer_id: user.id,
        rating: newReviewRating,
        comment: newReviewComment.trim()
      }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Vous avez déjà laissé un avis sur ce vendeur.');
        } else {
          throw error;
        }
      } else {
        toast.success('Votre avis a été publié avec succès ! ⭐');
        setNewReviewComment('');
        setShowReviewForm(false);
        const updated = [{
          id: Date.now().toString(),
          rating: newReviewRating,
          comment: newReviewComment.trim(),
          created_at: new Date().toISOString()
        }, ...sellerReviews];
        setSellerReviews(updated);
        const avg = updated.reduce((acc, r) => acc + (r.rating || 0), 0) / updated.length;
        setSellerRating(avg.toFixed(1));
        setSellerReviewCount(updated.length);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi de votre avis');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h2>Chargement...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>Annonce introuvable</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '2rem' }}>Retour aux annonces</Link>
      </div>
    );
  }

  const imageUrl = product.images && product.images.length > 0 ? product.images[activeImage] : '/hero.png';
  const hasVideo = !!(product.metadata?.video_url || product.video_url);
  const videoUrl = product.metadata?.video_url || product.video_url;
  const rawPhone = product.profiles?.phone_number || product.profiles?.whatsapp_number || product.metadata?.contact_whatsapp || product.contact || '';
  const phoneNumber = rawPhone.replace(/[^\d+]/g, '');

  const canonicalUrl = `https://colobanemarket.vercel.app/product/${productId}`;
  const schemaProduct = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": product.images && product.images.length > 0 ? product.images : [imageUrl],
    "description": product.description || product.title,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "XOF",
      "price": product.price || 0,
      "availability": "https://schema.org/InStock",
      "url": canonicalUrl,
      "seller": {
        "@type": "Organization",
        "name": product.profiles?.boutique_name || product.profiles?.full_name || "Colobane Market"
      }
    }
  };

  return (
    <div className="product-page" style={{ paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', background: 'var(--bg-color)', minHeight: '100vh', position: 'relative' }}>
      
      <SocialSEO
        title={`${product.title} - ${(product.price || 0).toLocaleString('fr-FR')} FCFA`}
        description={product.description?.substring(0, 160) || `Annonce disponible à ${product.location || 'Dakar'} sur ColobaneMarket.`}
        image={imageUrl}
        url={canonicalUrl}
        price={product.price}
        type="product"
      />

      {/* Top Bar Floating */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
        <button onClick={() => navigate(-1)} className="touch-target active-scale" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Menu contextuel discret Partage & Signalement */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowShareMenu(v => !v)} 
              className="touch-target active-scale" 
              style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>

            {showShareMenu && (
              <div 
                style={{
                  position: 'absolute', top: '48px', right: 0,
                  background: 'white', borderRadius: '14px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                  border: '1px solid #E2E8F0',
                  minWidth: '160px', zIndex: 999, overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                <div 
                  onClick={handleShare} 
                  style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}
                >
                  <Share2 size={16} />
                  <span>Partager</span>
                </div>
                <div style={{ height: '1px', background: '#F1F5F9' }} />
                <div 
                  onClick={() => { setShowShareMenu(false); setShowReportModal(true); }}
                  style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', color: '#EF4444' }}
                >
                  <AlertTriangle size={16} />
                  <span>Signaler</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={toggleFavorite} className="touch-target active-scale" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFavorite ? '#e74c3c' : '#94A3B8' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>

      {/* Instagram Stories Style Gallery */}
      <div 
        style={{ 
          width: '100%', 
          height: '420px', 
          position: 'relative', 
          background: '#09090B', 
          overflow: 'hidden',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        {/* Story Segment Bars Top */}
        {product.images && product.images.length > 1 && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', gap: '4px', zIndex: 30 }}>
            {product.images.map((_, idx) => (
              <div 
                key={idx} 
                onClick={(e) => { e.stopPropagation(); setActiveImage(idx); }}
                style={{ 
                  flex: 1, 
                  height: '3px', 
                  borderRadius: '2px', 
                  background: idx === activeImage ? '#FFFFFF' : idx < activeImage ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', 
                  transition: 'background 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                }} 
              />
            ))}
          </div>
        )}

        {/* Current Image or Video */}
        {hasVideo && activeImage === 0 ? (
          <video 
            src={videoUrl} 
            poster={imageUrl}
            controls 
            autoPlay 
            muted 
            loop 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <img 
            src={imageUrl} 
            alt={`${product.title} ${activeImage + 1}`} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.25s ease-out' }} 
          />
        )}

        {/* Tap Navigation Overlays (Story Left / Right) */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (activeImage > 0) setActiveImage(a => a - 1);
          }}
          style={{ position: 'absolute', top: 0, left: 0, width: '35%', height: '100%', zIndex: 20, cursor: 'pointer' }}
        />
        <div 
          onClick={(e) => {
            e.stopPropagation();
            const total = product.images?.length || 1;
            if (activeImage < total - 1) setActiveImage(a => a + 1);
            else setIsLightboxOpen(true);
          }}
          style={{ position: 'absolute', top: 0, right: 0, width: '65%', height: '100%', zIndex: 20, cursor: 'pointer' }}
        />

        {/* Story Counter Badge & Expand Fullscreen Pill */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 30, pointerEvents: 'none' }}>
          {(product.condition || (product.metadata && product.metadata.condition)) && (
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', color: 'white', padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              ✨ {product.condition || (product.metadata && product.metadata.condition)}
            </div>
          )}

          {product.images && product.images.length > 1 && (
            <div 
              onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
              style={{ pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.75)', color: 'white', padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <span>📷 {activeImage + 1}/{product.images.length}</span>
              <span style={{ opacity: 0.6, fontSize: '10px' }}>• Plein écran 🔍</span>
            </div>
          )}
        </div>
      </div>

      {/* Instagram Story Fullscreen Modal */}
      {isLightboxOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: '#050505', 
            zIndex: 99999, 
            display: 'flex', 
            flexDirection: 'column', 
            justify: 'space-between',
            animation: 'fadeIn 0.2s ease-out' 
          }}
        >
          {/* Story Top Progress & Seller Badge */}
          <div style={{ padding: '16px 16px 0 16px', background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)', zIndex: 100000 }}>
            {product.images && product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                {product.images.map((_, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    style={{ flex: 1, height: '3px', borderRadius: '2px', background: idx === activeImage ? '#FFFFFF' : idx < activeImage ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)', cursor: 'pointer' }} 
                  />
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #BE123C, #F43F5E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px' }}>
                  {(product.profiles?.boutique_name || product.profiles?.full_name || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{product.profiles?.boutique_name || product.profiles?.full_name || 'Vendeur Colobane'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Photo {activeImage + 1} sur {product.images?.length || 1}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsLightboxOpen(false)} 
                className="active-scale touch-target" 
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Fullscreen Story Main Image */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img 
              src={imageUrl} 
              alt={product.title} 
              style={{ maxWidth: '100%', maxHeight: '82vh', objectFit: 'contain', transition: 'transform 0.2s ease' }} 
            />
            {/* Story Tap Navigation Left / Right */}
            <div 
              onClick={() => {
                if (activeImage > 0) setActiveImage(a => a - 1);
              }}
              style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', cursor: 'pointer' }}
            />
            <div 
              onClick={() => {
                const total = product.images?.length || 1;
                if (activeImage < total - 1) setActiveImage(a => a + 1);
                else setIsLightboxOpen(false);
              }}
              style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Story Thumbnails Bar Bottom */}
          {product.images && product.images.length > 1 && (
            <div style={{ padding: '16px', background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)', display: 'flex', justifyContent: 'center', gap: '8px', overflowX: 'auto', zIndex: 100000 }}>
              {product.images.map((img, idx) => (
                <img 
                  key={idx} 
                  src={img} 
                  onClick={() => setActiveImage(idx)}
                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '10px', border: activeImage === idx ? '2px solid white' : '2px solid transparent', opacity: activeImage === idx ? 1 : 0.4, cursor: 'pointer', transition: 'all 0.2s' }} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reel Video Promotion Banner */}
      {hasVideo && (
        <div 
          onClick={() => navigate('/reels')}
          className="hover-lift active-scale"
          style={{
            margin: '12px 16px 0 16px',
            background: 'linear-gradient(135deg, #09090B 0%, #172554 40%, #BE123C 100%)',
            borderRadius: '16px',
            padding: '12px 16px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            boxShadow: '0 4px 16px rgba(190, 18, 60, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🎬</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>Vidéo Reel TikTok disponible !</div>
              <div style={{ fontSize: '11px', color: '#FDA4AF' }}>Regarder ce produit en vidéo HD plein écran</div>
            </div>
          </div>
          <span style={{ background: '#E11D48', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>
            Voir Reel ▶️
          </span>
        </div>
      )}

      {/* Main Info */}
      <div style={{ background: 'white', padding: '20px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', lineHeight: '1.4', color: 'var(--text-main)' }}>{product.title}</h1>
        <div className="text-muted-small" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span>Publié le {new Date(product.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(' à ', ' à ')}</span>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginTop: '12px' }}>
          <a 
            href={`https://wa.me/${(product.contact || product.profiles?.whatsapp_number || '').replace(/\+/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre article "${product.title}" sur Colobane Market.`)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => {
              try {
                const sellerId = product.seller_id || product.profiles?.id;
                const key = `colobane_stats_${sellerId}`;
                const current = JSON.parse(localStorage.getItem(key) || '{"views":0,"whatsapp":0,"calls":0}');
                current.whatsapp = (current.whatsapp || 0) + 1;
                localStorage.setItem(key, JSON.stringify(current));

                const notifKey = `colobane_notifs_${sellerId}`;
                const notifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
                const newNotif = {
                  id: 'notif_' + Date.now(),
                  title: '💬 Nouveau prospect WhatsApp !',
                  message: `Un client a pris contact pour votre annonce "${product.title}".`,
                  created_at: new Date().toISOString(),
                  read: false
                };
                localStorage.setItem(notifKey, JSON.stringify([newNotif, ...notifs.slice(0, 19)]));
                } catch (_e) {
                  // Ignore localStorage error
                }
            }}
            className="active-scale" 
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '16px',
              color: 'white',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '0.9rem',
              boxShadow: '0 4px 14px rgba(37,211,102,0.35)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            WhatsApp
          </a>

          <a 
            href={phoneNumber ? `tel:${phoneNumber}` : '#'}
            onClick={(e) => {
              if (!phoneNumber) {
                e.preventDefault();
                toast.error("Aucun numéro de téléphone disponible.");
              } else {
                try {
                  const sellerId = product.seller_id || product.profiles?.id;
                  const key = `colobane_stats_${sellerId}`;
                  const current = JSON.parse(localStorage.getItem(key) || '{"views":0,"whatsapp":0,"calls":0}');
                  current.calls = (current.calls || 0) + 1;
                  localStorage.setItem(key, JSON.stringify(current));

                  const notifKey = `colobane_notifs_${sellerId}`;
                  const notifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
                  const newNotif = {
                    id: 'notif_' + Date.now(),
                    title: '📞 Nouvel appel téléphonique !',
                    message: `Un client a cliqué pour vous appeler au sujet de "${product.title}".`,
                    created_at: new Date().toISOString(),
                    read: false
                  };
                  localStorage.setItem(notifKey, JSON.stringify([newNotif, ...notifs.slice(0, 19)]));
                } catch (_err) {
                  // Ignore localStorage error
                }
              }
            }}
            className="active-scale" 
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '16px',
              color: 'white',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '0.9rem',
              boxShadow: '0 4px 14px rgba(59,130,246,0.35)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Appel
          </a>

          <button 
            onClick={() => setShowFlyerModal(true)}
            className="active-scale hover-lift" 
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px',
              padding: '12px 14px',
              borderRadius: '16px',
              border: '1.5px solid #10B981',
              color: '#047857',
              background: '#F0FDF4',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '0.88rem',
              boxShadow: '0 4px 12px rgba(16,185,129,0.15)'
            }}
          >
            📲 Statut WhatsApp
          </button>
        </div>
      </div>

      {/* Modal Flyer Statut WhatsApp */}
      {showFlyerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '28px', width: '100%', maxWidth: '420px', padding: '24px', position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <button onClick={() => setShowFlyerModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>✕</button>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', margin: '0 0 14px 0', fontFamily: 'var(--font-heading)' }}>
              📸 Aperçu Affiche Statut WhatsApp
            </h3>

            {/* Flyer Design Card */}
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', borderRadius: '20px', padding: '18px', marginBottom: '20px', textAlign: 'left', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 30px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800', color: '#fde68a' }}>
                  <span>🏪</span> {product.profiles?.boutique_name || product.profiles?.pseudo || 'Vendeur Certifié'}
                </div>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' }}>
                  COLOBANEMARKET
                </div>
              </div>

              <div style={{ height: '180px', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px', background: '#000' }}>
                <img src={product.images?.[0] || '/hero.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ fontWeight: '800', fontSize: '1.1rem', lineHeight: '1.3', marginBottom: '8px' }}>
                {product.title}
              </div>

              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#4ade80' }}>
                {(product.price || 0).toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            <button 
              onClick={() => {
                const text = `🔥 *${product.title}*\n💰 Prix: ${(product.price || 0).toLocaleString('fr-FR')} FCFA\n📍 ${product.location || 'Dakar'}\n\n👉 Commandez directement ici: ${window.location.href}`;
                navigator.clipboard.writeText(text);
                toast.success('Texte d\'annonce copié ! Ouverture de WhatsApp...');
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                setShowFlyerModal(false);
              }}
              className="active-scale"
              style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: 'white', border: 'none', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,211,102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              📲 Copier & Publier en Statut WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Seller Mini Profile & Security */}
      <div style={{ margin: '12px 0' }}>
        <div 
          onClick={() => navigate(`/boutique/${product.seller_id}`)}
          className="active-scale" 
          style={{ background: 'white', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {product.profiles?.boutique_name ? '🏪' : '👤'}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {product.profiles?.boutique_name || product.profiles?.pseudo || product.profiles?.full_name || 'Vendeur'}
                {product.profiles?.is_verified && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15 8L22 9L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9L9 8L12 2Z" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </div>
              <div className="text-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'linear-gradient(135deg, #d97706, #92400e)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <MapPin size={9} strokeWidth={3} />
                </span>
                {product.location || 'Dakar'} 
                {product.profiles?.is_verified && (
                  <> • <span style={{ color: '#25D366', fontWeight: '600' }}>Certifié 🛡️</span></>
                )}
                {sellerRating && (
                  <span style={{ marginLeft: '4px', background: '#FFFBEB', color: '#B45309', border: '1px solid #FCD34D', padding: '1px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    ⭐ {sellerRating} ({sellerReviewCount})
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '14px' }}>Voir le profil</div>
        </div>

        {/* Security Banner */}
        <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '8px', padding: '12px', margin: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ color: '#EA580C', marginTop: '2px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#9A3412', marginBottom: '4px' }}>Conseil de sécurité</div>
            <div style={{ fontSize: '12px', color: '#9A3412', lineHeight: '1.4' }}>Ne payez jamais à l'avance par mobile money (Wave, Orange Money). Privilégiez toujours le paiement à la livraison.</div>
          </div>
        </div>

        {/* Trust Badges & Seller Reviews */}
        <div style={{ background: 'white', padding: '16px', margin: '12px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          {/* Trust Badges Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: product.profiles?.is_verified ? '#F0FDF4' : '#F8FAFC', border: product.profiles?.is_verified ? '1px solid #DCFCE7' : '1px solid #E2E8F0', padding: '10px 6px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', marginBottom: '2px' }}>{product.profiles?.is_verified ? '🛡️' : '🏪'}</div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: product.profiles?.is_verified ? '#166534' : '#1E293B' }}>{product.profiles?.is_verified ? 'Vendeur Certifié' : 'Compte Vendeur'}</div>
              <div style={{ fontSize: '10px', color: product.profiles?.is_verified ? '#15803D' : '#64748B' }}>{product.profiles?.is_verified ? 'Profil Vérifié' : 'Non Certifié'}</div>
            </div>
            <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '10px 6px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', marginBottom: '2px' }}>⚡</div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#166534' }}>Réponse rapide</div>
              <div style={{ fontSize: '10px', color: '#15803D' }}>En ~10 min</div>
            </div>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 6px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', marginBottom: '2px' }}>⭐</div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#92400E' }}>{sellerRating || '5.0'} / 5</div>
              <div style={{ fontSize: '10px', color: '#B45309' }}>{sellerReviewCount} avis</div>
            </div>
          </div>

          {/* Header & Add Review Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
              Évaluations du Vendeur ({sellerReviewCount})
            </h3>
            <button 
              onClick={() => setShowReviewForm(v => !v)}
              className="active-scale touch-target"
              style={{ background: 'var(--primary-light, #FFF1F2)', color: 'var(--primary, #BE123C)', border: '1px solid var(--primary-border, #FECDD3)', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              {showReviewForm ? 'Annuler' : '✍️ Noter le vendeur'}
            </button>
          </div>

          {/* Add Review Form */}
          {showReviewForm && (
            <form onSubmit={handleAddReview} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#334155' }}>Votre note pour ce vendeur :</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    type="button" 
                    onClick={() => setNewReviewRating(star)}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: star <= newReviewRating ? 1 : 0.3, transition: 'transform 0.1s' }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <textarea 
                rows="3"
                value={newReviewComment}
                onChange={e => setNewReviewComment(e.target.value)}
                placeholder="Ex: Vendeur très honnête, produit conforme et livraison ponctuelle !"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontFamily: 'inherit', resize: 'none', marginBottom: '10px' }}
              />
              <button 
                type="submit" 
                disabled={submittingReview}
                className="btn-primary active-scale"
                style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '800' }}
              >
                {submittingReview ? 'Publication en cours...' : 'Publier mon avis ⭐'}
              </button>
            </form>
          )}

          {/* Reviews List */}
          {sellerReviews.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '12px 0' }}>
              Aucun avis pour l'instant. Soyez le premier à donner votre avis !
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sellerReviews.slice(0, 3).map((rev, idx) => (
                <div key={rev.id || idx} style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>
                      Acheteur Colobane {'⭐'.repeat(rev.rating || 5)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString('fr-FR') : 'Récemment'}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                    "{rev.comment}"
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Détails du véhicule */}
      {product.category === 'vehicules' && (
        <div style={{ background: 'white', padding: '20px 16px', margin: '12px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '20px', color: 'var(--text-main)' }}>Détails du véhicule</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            
            {(product.brand || product.metadata?.brand) && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 18%', minWidth: '60px', gap: '6px' }}>
                <div style={{ color: '#64748B' }}><Shield size={28} strokeWidth={1.5} /></div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Constructeur</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textAlign: 'center' }}>{product.brand || product.metadata?.brand}</div>
              </div>
            )}

            {(product.model || product.metadata?.model) && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 18%', minWidth: '60px', gap: '6px' }}>
                <div style={{ color: '#64748B' }}><Tag size={28} strokeWidth={1.5} /></div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Modèle</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textAlign: 'center' }}>{product.model || product.metadata?.model} {product.year || product.metadata?.year}</div>
              </div>
            )}

            {(product.metadata?.mileage) && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 18%', minWidth: '60px', gap: '6px' }}>
                <div style={{ color: '#64748B' }}><Gauge size={28} strokeWidth={1.5} /></div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Kilométrage</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textAlign: 'center' }}>{product.metadata.mileage}</div>
              </div>
            )}

            {(product.metadata?.transmission) && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 18%', minWidth: '60px', gap: '6px' }}>
                <div style={{ color: '#64748B' }}><Settings size={28} strokeWidth={1.5} /></div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Transmission</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textAlign: 'center' }}>{product.metadata.transmission}</div>
              </div>
            )}

            {(product.metadata?.fuel) && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 18%', minWidth: '60px', gap: '6px' }}>
                <div style={{ color: '#64748B' }}><Fuel size={28} strokeWidth={1.5} /></div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Carburant</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', textAlign: 'center' }}>{product.metadata.fuel}</div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Description */}
      <div style={{ background: 'white', padding: '20px 16px', margin: '12px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Description</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {product.description || "Aucune description fournie par le vendeur."}
        </p>
      </div>

      {/* Caractéristiques Tableau */}
      {product.category !== 'vehicules' && (
      <div style={{ background: 'white', padding: '20px 16px', margin: '12px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Caractéristiques</h2>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {(() => {
            const catInfo = categories.find(c => c.id === product.category);
            const fieldsToDisplay = [];
            
            if (catInfo && catInfo.fields) {
              catInfo.fields.forEach(field => {
                const value = product[field.name] || (product.metadata && product.metadata[field.name]);
                if (value) {
                  fieldsToDisplay.push({ label: field.label, value });
                }
              });
            } else {
              if (product.brand || product?.metadata?.brand) fieldsToDisplay.push({ label: 'Marque', value: product.brand || product.metadata.brand });
              if (product.condition) fieldsToDisplay.push({ label: 'État', value: product.condition });
              if (product.color || product?.metadata?.color) fieldsToDisplay.push({ label: 'Couleur', value: product.color || product.metadata.color });
              if (product.material || product?.metadata?.material) fieldsToDisplay.push({ label: 'Matière', value: product.material || product.metadata.material });
            }
            
            // Ensure condition is shown if it wasn't captured in category fields
            if (product.condition && !fieldsToDisplay.find(f => f.label === 'État' || f.label === catInfo?.fields?.find(cf => cf.name === 'condition')?.label)) {
              fieldsToDisplay.push({ label: 'État', value: product.condition });
            }

            if (fieldsToDisplay.length === 0) {
              return <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>Aucune caractéristique renseignée</div>;
            }

            return fieldsToDisplay.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', padding: '12px', borderBottom: idx < fieldsToDisplay.length - 1 ? '1px solid var(--border-color)' : 'none', background: idx % 2 === 1 ? '#F8FAFC' : 'white' }}>
                <div style={{ width: '40%', color: 'var(--text-muted)', fontSize: '14px' }}>{item.label}</div>
                <div style={{ width: '60%', fontWeight: '600', fontSize: '14px' }}>{item.value}</div>
              </div>
            ));
          })()}
        </div>
      </div>
      )}

      {/* Price Comparator Section: Vendeurs proposant le même article */}
      {sameItemSellers.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '16px', padding: '16px', margin: '16px 12px 24px', boxShadow: '0 4px 15px rgba(245,158,11,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.3rem' }}>🛍️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#92400E', fontFamily: 'var(--font-heading)' }}>
                Comparez les prix ({sameItemSellers.length} autre(s) vendeur(s))
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#B45309' }}>
                Autres vendeurs proposant le même type d'article
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sameItemSellers.map(sellerProd => {
              const diff = (sellerProd.price || 0) - (product.price || 0);
              const sellerName = sellerProd.profiles?.boutique_name || sellerProd.profiles?.pseudo || sellerProd.profiles?.full_name || 'Vendeur';

              return (
                <div key={sellerProd.id} style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1px solid #FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <img src={sellerProd.images?.[0] || '/hero.png'} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {sellerName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #d97706, #92400e)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                          <MapPin size={8} strokeWidth={3} />
                        </span>
                        {sellerProd.location || 'Dakar'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '900', fontSize: '0.98rem', color: 'var(--primary)' }}>
                      {(sellerProd.price || 0).toLocaleString('fr-FR')} FCFA
                    </div>
                    {diff < 0 ? (
                      <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: '800' }}>
                        🔥 {Math.abs(diff).toLocaleString('fr-FR')} F moins cher !
                      </div>
                    ) : diff > 0 ? (
                      <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: '700' }}>
                        +{diff.toLocaleString('fr-FR')} FCFA
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>
                        Même prix
                      </div>
                    )}
                  </div>

                  <Link to={`/product/${sellerProd.id}`} className="active-scale" style={{ background: 'var(--primary)', color: 'white', padding: '8px 12px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    Voir →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Annonces Similaires */}
      {similarProducts.length > 0 && (
        <div style={{ padding: '20px 16px', margin: '12px 0 30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Ceci pourrait vous intéresser</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {similarProducts.map((simProd) => (
              <Link to={`/product/${simProd.id}`} key={simProd.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div style={{ height: '140px', width: '100%', background: '#f1f5f9' }}>
                    <img src={simProd.images?.[0] || '/hero.png'} style={{ width: '100%', height: '100%', objectFit: 'cover', imageOrientation: 'from-image' }} />
                  </div>
                  <div style={{ padding: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                      {(simProd.price || 0).toLocaleString('fr-FR')} FCFA
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {simProd.title}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Fixed Bottom Action Bar (Sticky Title + CTA) */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1, paddingRight: '12px' }}>
            {product.title}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
            {(product.price || 0).toLocaleString('fr-FR')} FCFA
          </div>
        </div>
        {user && user.id === product.seller_id ? (
          <Link 
            to={`/edit-product/${product.id}`}
            className="btn-primary active-scale touch-target"
            style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '14px', borderRadius: '12px', fontWeight: '700' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Modifier mon annonce
          </Link>
        ) : (
          <a 
            href={`https://wa.me/${(product.contact || product.profiles?.whatsapp_number || '').replace(/\+/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre article "${product.title}" sur Colobane Market.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-whatsapp active-scale touch-target"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            Contacter sur WhatsApp
          </a>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        productId={productId} 
      />
    </div>
  );
};

export default ProductPage;
