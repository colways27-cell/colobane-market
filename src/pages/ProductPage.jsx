import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { categories } from '../data/categories';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import toast from 'react-hot-toast';

const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            profiles:seller_id (
              id, full_name, avatar_url, phone_number, whatsapp_number, 
              account_type, boutique_name, is_verified
            )
          `)
          .eq('id', productId)
          .single();

        if (error) throw error;
        setProduct(data);

        // Check if favorite
        if (user) {
          const { data: favData } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();
          
          if (favData) setIsFavorite(true);
        }

      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
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
        <Link to="/" className="btn-primary" style={{ marginTop: '2rem' }}>Retour à l'accueil</Link>
      </div>
    );
  }

  const imageUrl = product.images && product.images.length > 0 ? product.images[activeImage] : '/hero.png';

  return (
    <div className="product-page" style={{ paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', background: 'var(--bg-color)', minHeight: '100vh', position: 'relative' }}>
      
      {/* Top Bar Floating */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
        <button onClick={() => navigate(-1)} className="touch-target active-scale" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <button onClick={toggleFavorite} className="touch-target active-scale" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFavorite ? '#e74c3c' : '#94A3B8' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>

      {/* Image Gallery Full Width */}
      <div style={{ width: '100%', height: '400px', position: 'relative', overflowX: 'auto', scrollSnapType: 'x mandatory', display: 'flex', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', background: '#F1F5F9' }}>
        {(product.images && product.images.length > 0 ? product.images : ['/hero.png']).map((img, idx) => (
          <div key={idx} style={{ flex: '0 0 100%', height: '100%', scrollSnapAlign: 'start', position: 'relative' }}>
            <img src={img} alt={`${product.title} ${idx + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
        {product.condition && (
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(255,255,255,0.95)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: '800', backdropFilter: 'blur(4px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            {product.condition}
          </div>
        )}
      </div>

      {/* Main Info */}
      <div style={{ background: 'white', padding: '20px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', lineHeight: '1.4', color: 'var(--text-main)' }}>{product.title}</h1>
        <div className="text-muted-small" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span>Il y a 2 heures</span>
          <span>•</span>
          <span>Vue 124 fois</span>
        </div>
        
        {/* Share Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              const text = `Regarde ça sur Colobane Market: ${product.title}`;
              const url = window.location.href;
              window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
            }}
            className="btn-secondary active-scale" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', borderRadius: '8px', color: '#25D366', borderColor: '#25D366', background: 'rgba(37,211,102,0.05)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            WhatsApp
          </button>
          <a 
            href={`tel:${product.profiles?.phone_number || product.contact || ''}`}
            className="btn-secondary active-scale" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-main)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Appeler
          </a>
        </div>
      </div>

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
                {product.profiles?.boutique_name || product.profiles?.full_name || 'Vendeur'}
                {(product.profiles?.boutique_name || product.profiles?.account_type === 'pro') && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15 8L22 9L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9L9 8L12 2Z" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </div>
              <div className="text-meta">
                📍 {product.location || 'Dakar'} 
                {(product.profiles?.boutique_name || product.profiles?.account_type === 'pro') && (
                  <> • <span style={{ color: '#25D366', fontWeight: '600' }}>Vérifié</span></>
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
      </div>

      {/* Description */}
      <div style={{ background: 'white', padding: '20px 16px', margin: '12px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Description</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {product.description || "Aucune description fournie par le vendeur."}
        </p>
      </div>

      {/* Caractéristiques Tableau */}
      <div style={{ background: 'white', padding: '20px 16px', margin: '12px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Caractéristiques</h2>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {product.brand && (
            <div style={{ display: 'flex', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '40%', color: 'var(--text-muted)', fontSize: '14px' }}>Marque</div>
              <div style={{ width: '60%', fontWeight: '600', fontSize: '14px' }}>{product.brand}</div>
            </div>
          )}
          {product.condition && (
            <div style={{ display: 'flex', padding: '12px', borderBottom: '1px solid var(--border-color)', background: '#F8FAFC' }}>
              <div style={{ width: '40%', color: 'var(--text-muted)', fontSize: '14px' }}>État</div>
              <div style={{ width: '60%', fontWeight: '600', fontSize: '14px' }}>{product.condition}</div>
            </div>
          )}
          {product.color && (
            <div style={{ display: 'flex', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '40%', color: 'var(--text-muted)', fontSize: '14px' }}>Couleur</div>
              <div style={{ width: '60%', fontWeight: '600', fontSize: '14px' }}>{product.color}</div>
            </div>
          )}
          {product.material && (
            <div style={{ display: 'flex', padding: '12px', background: '#F8FAFC' }}>
              <div style={{ width: '40%', color: 'var(--text-muted)', fontSize: '14px' }}>Matière</div>
              <div style={{ width: '60%', fontWeight: '600', fontSize: '14px' }}>{product.material}</div>
            </div>
          )}
        </div>
      </div>

      {/* Avis en cards horizontales */}
      <div style={{ padding: '20px 0 20px 16px', margin: '12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '16px', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Avis (84)</h2>
          <span style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600' }}>Tout voir</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {[1, 2, 3].map((_, i) => (
            <div key={i} style={{ flex: '0 0 260px', background: 'white', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👤</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700' }}>Client Modou</div>
                  <div style={{ color: '#F59E0B', fontSize: '10px' }}>★★★★★</div>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                "Super article, vendeur très réactif. Je recommande vivement !"
              </p>
            </div>
          ))}
          <div style={{ width: '1px', flexShrink: 0 }}></div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar (Sticky Title + CTA) */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1, paddingRight: '12px' }}>
            {product.title}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
            {product.price.toLocaleString('fr-FR')} FCFA
          </div>
        </div>
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
      </div>

    </div>
  );
};

export default ProductPage;
