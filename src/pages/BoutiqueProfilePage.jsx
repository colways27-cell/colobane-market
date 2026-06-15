import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import FavoriteButton from '../components/FavoriteButton';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const BoutiqueProfilePage = () => {
  const { boutiqueId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalogue');
  const [searchQuery, setSearchQuery] = useState('');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchBoutiqueData = async () => {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', boutiqueId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', boutiqueId)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Fetch reviews safely
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('boutique_reviews')
          .select('*')
          .eq('boutique_id', boutiqueId)
          .order('created_at', { ascending: false });

        if (!reviewsError && reviewsData && reviewsData.length > 0) {
          const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
          const { data: profilesData } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', reviewerIds);
          const profilesMap = {};
          if (profilesData) {
             profilesData.forEach(p => profilesMap[p.id] = p);
          }
          const richReviews = reviewsData.map(r => ({...r, reviewer: profilesMap[r.reviewer_id] || {}}));
          setReviews(richReviews);
        }

      } catch (err) {
        console.error('Error fetching boutique:', err);
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
      const { error } = await supabase.from('boutique_reviews').insert([{
        boutique_id: boutiqueId,
        reviewer_id: user.id,
        rating: newReview.rating,
        comment: newReview.comment
      }]);
      
      if (error) {
        if (error.code === '23505') { toast.error("Vous avez déjà laissé un avis."); }
        else { throw error; }
      } else {
        toast.success("Avis publié avec succès !");
        // Update local state directly for immediate feedback
        const { data: myProfile } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', user.id).single();
        setReviews([{
          id: Math.random().toString(),
          boutique_id: boutiqueId,
          reviewer_id: user.id,
          rating: newReview.rating,
          comment: newReview.comment,
          created_at: new Date().toISOString(),
          reviewer: myProfile || {}
        }, ...reviews]);
        setNewReview({ rating: 5, comment: '' });
      }
    } catch(err) {
      toast.error("Erreur lors de l'envoi.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;
  
  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

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
        <h2>Boutique introuvable</h2>
        <Link to="/boutiques" className="btn-primary" style={{ display: 'inline-block', marginTop: '2rem' }}>Retour aux boutiques</Link>
      </div>
    );
  }

  // WhatsApp Link Generation
  let whatsappNumber = profile.whatsapp_number || profile.phone_number;
  if (whatsappNumber) {
    whatsappNumber = whatsappNumber.replace(/\D/g, ''); 
  }
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Bonjour ! Je viens de visiter votre boutique sur ColobaneMarket.")}`;

  return (
    <div className="boutique-profile-page">
      {/* Bannière */}
      <div 
        className="boutique-banner" 
        style={{ 
          height: '280px', 
          background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%), url(${profile.banner_url || 'https://placehold.co/1200x400?text=Couverture+Boutique'})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          position: 'relative'
        }}
      ></div>

      <div className="section-container" style={{ position: 'relative', marginTop: '-60px' }}>
        <div className="boutique-header-card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* Logo et Infos Principales */}
          <div style={{ flex: '1', minWidth: '300px', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div 
              style={{ 
                width: '120px', height: '120px', borderRadius: '50%', background: 'white', 
                border: '4px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                backgroundImage: `url(${profile.avatar_url || 'https://placehold.co/150x150?text=Logo'})`,
                backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0
              }}
            ></div>
            <div>
              <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {profile.boutique_name || profile.full_name || 'Boutique Sans Nom'}
                {profile.is_verified && <span style={{ color: '#007aff', fontSize: '1.2rem' }}>✓</span>}
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1rem', lineHeight: '1.5' }}>
                {profile.boutique_description || 'Bienvenue dans notre boutique officielle sur ColobaneMarket.'}
              </p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                <span>📍 {profile.location || 'Sénégal'}</span>
                {profile.business_hours && <span>🕒 {profile.business_hours}</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setActiveTab('avis')}>
                  <span style={{ color: '#f59e0b', fontSize: '16px' }}>★</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{avgRating > 0 ? avgRating : 'Nouveau'}</span>
                  <span style={{ opacity: 0.8 }}>({reviews.length} avis)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons de Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '250px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a 
                href={whatsappNumber ? whatsappUrl : '#'} 
                onClick={(e) => { if (!whatsappNumber) { e.preventDefault(); toast.error("Cette boutique n'a pas renseigné son WhatsApp."); } }}
                target={whatsappNumber ? "_blank" : ""} 
                rel="noopener noreferrer" 
                className="btn-whatsapp active-scale touch-target" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: whatsappNumber ? '#25D366' : '#e2e8f0', color: whatsappNumber ? 'white' : '#94a3b8', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '1rem', cursor: whatsappNumber ? 'pointer' : 'not-allowed', border: 'none' }} 
              >
                WhatsApp
              </a>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Lien de la boutique copié !');
                }}
                className="btn-secondary active-scale touch-target" 
                style={{ width: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
              </button>
            </div>
            <a 
              href={profile.phone_number ? `tel:${profile.phone_number}` : '#'} 
              onClick={(e) => { if (!profile.phone_number) { e.preventDefault(); toast.error("Aucun numéro de téléphone renseigné."); } }}
              className="active-scale touch-target hide-on-mobile" 
              style={{ display: 'block', textAlign: 'center', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', background: 'white', border: '2px solid #e2e8f0', color: profile.phone_number ? 'var(--text-main)' : '#9ca3af', cursor: profile.phone_number ? 'pointer' : 'not-allowed', fontSize: '1rem' }}
            >
              Appeler la boutique
            </a>
          </div>
        </div>

        {/* Mobile Sticky Contact Bar */}
        <div className="hide-on-desktop" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'white', borderTop: '1px solid #E2E8F0', zIndex: 100, display: 'flex', gap: '12px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
          <a 
            href={profile.phone_number ? `tel:${profile.phone_number}` : '#'} 
            onClick={(e) => { if (!profile.phone_number) { e.preventDefault(); toast.error("Aucun numéro de téléphone renseigné."); } }}
            className="active-scale" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', color: 'var(--text-main)', borderRadius: '12px', fontWeight: '800', textDecoration: 'none' }}
          >
            📞 Appeler
          </a>
          <a 
            href={whatsappNumber ? whatsappUrl : '#'} 
            onClick={(e) => { if (!whatsappNumber) { e.preventDefault(); toast.error("Cette boutique n'a pas renseigné son WhatsApp."); } }}
            target={whatsappNumber ? "_blank" : ""} 
            rel="noopener noreferrer" 
            className="active-scale" 
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', color: 'white', borderRadius: '12px', fontWeight: '800', textDecoration: 'none', boxShadow: '0 4px 15px rgba(37,211,102,0.3)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            WhatsApp
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginTop: '3rem', marginBottom: '1.5rem', gap: '2rem' }}>
          <button onClick={() => setActiveTab('catalogue')} style={{ padding: '0 0 12px 0', border: 'none', background: 'transparent', fontSize: '1.1rem', fontWeight: activeTab === 'catalogue' ? '800' : '600', color: activeTab === 'catalogue' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'catalogue' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
            Catalogue ({products.length})
          </button>
          <button onClick={() => setActiveTab('avis')} style={{ padding: '0 0 12px 0', border: 'none', background: 'transparent', fontSize: '1.1rem', fontWeight: activeTab === 'avis' ? '800' : '600', color: activeTab === 'avis' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'avis' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
            Avis clients ({reviews.length})
          </button>
        </div>

        {/* Tab Content: Catalogue */}
        {activeTab === 'catalogue' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '0 12px', height: '48px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" placeholder="Rechercher dans cette boutique..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0 12px', fontSize: '0.95rem' }} />
              </div>
            </div>
            
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Aucun article trouvé.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {filteredProducts.map(product => {
                  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x400?text=No+Image';
                  const condition = product.condition || 'Occasion';

                  return (
                    <div key={product.id} onClick={() => window.location.href = `/product/${product.id}`} className="product-card active-scale" style={{ cursor: 'pointer', border: 'none', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#F1F5F9', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <img src={imageUrl} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        
                        <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(255,255,255,0.9)', color: 'var(--text-main)', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: 'var(--radius-pill)', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                          {condition}
                        </span>
                        
                        <FavoriteButton 
                          productId={product.id} 
                          style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', zIndex: 10 }} 
                        />
                      </div>

                      <div style={{ padding: '8px 4px 4px 4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.4', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-main)' }}>
                          {product.title}
                        </h3>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>
                          {product.price > 0 ? `${product.price.toLocaleString('fr-FR')} FCFA` : product.metadata?.price_type || 'Sur demande'}
                        </div>
                        <div className="text-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {product.location || 'Dakar'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Avis */}
        {activeTab === 'avis' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            
            {(!user || user.id !== boutiqueId) && (
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem' }}>Laisser un avis</h3>
                {!user ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Veuillez vous <Link to="/auth" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>connecter</Link> pour laisser un avis.</p>
                ) : (
                  <form onSubmit={submitReview}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button type="button" key={star} onClick={() => setNewReview({...newReview, rating: star})} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '24px', color: star <= newReview.rating ? '#f59e0b' : '#e2e8f0', padding: 0 }}>
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="Partagez votre expérience avec cette boutique..."
                      value={newReview.comment}
                      onChange={e => setNewReview({...newReview, comment: e.target.value})}
                      style={{ width: '100%', padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', minHeight: '100px', resize: 'vertical', marginBottom: '1rem', fontFamily: 'inherit' }}
                    ></textarea>
                    <button type="submit" disabled={submittingReview} className="btn-primary active-scale" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
                      {submittingReview ? 'Publication...' : 'Publier mon avis'}
                    </button>
                  </form>
                )}
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Avis récents</h3>
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Aucun avis pour le moment. Soyez le premier !</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {reviews.map(review => (
                    <div key={review.id} style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E2E8F0', backgroundImage: `url(${review.reviewer?.avatar_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{review.reviewer?.full_name || 'Utilisateur'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span style={{ color: '#f59e0b', fontSize: '12px' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: fr })}</span>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.5', paddingLeft: '52px' }}>{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BoutiqueProfilePage;
