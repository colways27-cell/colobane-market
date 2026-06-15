import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

const FavoritesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchFavorites = async () => {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            product_id,
            products (*, profiles:seller_id (account_type, boutique_name, is_verified))
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Extraire uniquement les produits des favoris
        const validProducts = data
          .map(fav => fav.products)
          .filter(p => p !== null);
          
        setFavorites(validProducts);
      } catch (err) {
        console.error('Erreur lors du chargement des favoris:', err);
        toast.error("Impossible de charger les favoris");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, navigate]);

  const handleRemoveFavorite = async (e, productId) => {
    e.stopPropagation(); // Évite de cliquer sur la carte entière
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      
      // Mettre à jour l'état local
      setFavorites(prev => prev.filter(p => p.id !== productId));
      toast.success("Retiré des favoris", { duration: 2000 });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="home-page" style={{ paddingTop: '2rem' }}>
        <h1 style={{ padding: '0 16px', fontSize: '1.5rem', fontWeight: '800' }}>Mes Favoris</h1>
        <section className="section-container" style={{ marginTop: '1rem' }}>
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home-page" style={{ paddingTop: '1rem', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div style={{ padding: '0 16px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)} className="touch-target active-scale" style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Mes Favoris ❤️</h1>
      </div>

      {favorites.length === 0 ? (
        <div style={{ padding: '3rem 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🤍</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Aucun favori pour le moment</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Sauvegardez les annonces qui vous plaisent en cliquant sur le petit cœur !
          </p>
          <Link to="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.8rem 1.5rem', borderRadius: '12px' }}>
            Explorer les annonces
          </Link>
        </div>
      ) : (
        <section className="section-container" style={{ margin: '0', padding: '0 16px' }}>
          <div className="grid grid-cols-2">
            {favorites.map((product) => {
              const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/hero.png';
              
              return (
                <div key={product.id} onClick={() => navigate(`/product/${product.id}`)} className="product-card active-scale" style={{ cursor: 'pointer', border: 'none', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                  
                  {/* Bouton pour retirer des favoris superposé sur l'image */}
                  <button 
                    onClick={(e) => handleRemoveFavorite(e, product.id)}
                    style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', color: '#e74c3c' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>

                  <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#F1F5F9', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                      <img src={imageUrl} alt={product.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>

                  <div style={{ padding: '10px 8px 12px 8px' }}>
                    <div className="product-price" style={{ fontSize: '15px', fontWeight: '800', marginBottom: '2px', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                      {(product.price || 0).toLocaleString('fr-FR')} FCFA
                    </div>
                    
                    <h3 className="product-title" style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '500', marginBottom: '6px', opacity: 0.9 }}>
                      {product.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default FavoritesPage;
