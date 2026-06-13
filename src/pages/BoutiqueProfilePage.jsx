import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import FavoriteButton from '../components/FavoriteButton';
import toast from 'react-hot-toast';

const BoutiqueProfilePage = () => {
  const { boutiqueId } = useParams();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error('Error fetching boutique:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoutiqueData();
  }, [boutiqueId]);

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
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⭐ Avis bientôt disponibles</span>
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

        {/* Catalogue */}
        <div style={{ marginTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}>
              <span>🛍️</span> Catalogue ({products.length} articles)
            </h2>
          </div>
          
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <p style={{ color: 'var(--text-muted)' }}>Cette boutique n'a pas encore publié d'articles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {products.map(product => {
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

      </div>
    </div>
  );
};

export default BoutiqueProfilePage;
