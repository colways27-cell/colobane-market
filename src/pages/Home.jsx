import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories } from '../data/categories';
import { products as mockProducts } from '../data/products';
import { supabase } from '../lib/supabase';
import SkeletonCard from '../components/SkeletonCard';
import FavoriteButton from '../components/FavoriteButton';
import toast from 'react-hot-toast';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const navigate = useNavigate();

  const fetchProducts = async (currentPage, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:seller_id (account_type, boutique_name, is_verified)
        `)
        .order('is_boosted', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        if (isLoadMore) {
          setProducts(prev => [...prev, ...data]);
        } else {
          setProducts(data);
        }
        if (data.length < PAGE_SIZE) setHasMore(false);
      } else {
        if (!isLoadMore) setProducts(mockProducts);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      if (!isLoadMore) setProducts(mockProducts);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProducts(0);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  if (loading) {
    return (
      <div className="home-page">
        <section className="section-container" style={{ marginTop: '2rem' }}>
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home-page" style={{ paddingTop: '0.5rem', paddingBottom: '6rem' }}>
      
      {/* Sticky Search Bar */}
      <section className="sticky-search">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input 
            type="text" 
            placeholder="Rechercher un article, une marque..." 
            className="form-control"
            style={{ paddingLeft: '44px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', background: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', minHeight: '48px', fontSize: '14px' }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim() !== '') {
                navigate(`/explore?q=${encodeURIComponent(e.target.value.trim())}`);
              }
            }}
          />
        </div>
        
        {/* Quick Filter Chips */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', padding: '12px 0 4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', margin: '0 -16px', paddingLeft: '16px', paddingRight: '16px' }}>
          {['Nouveautés', 'Moins de 10.000F', 'Téléphones', 'Chaussures', 'Véhicules'].map(filter => (
            <button key={filter} className="active-scale" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Categories Horizontal Scroll */}
      <section style={{ marginBottom: '1.5rem', padding: '0 16px' }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '0.5rem', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', margin: '0 -16px', paddingLeft: '16px', paddingRight: '16px' }}>
          <button onClick={() => navigate(`/boutiques`)} className="touch-target active-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'transparent', border: 'none', flexShrink: 0, gap: '8px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#8b1c3115', color: '#8b1c31', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
              🏪
            </div>
            <span className="text-muted-small" style={{ fontWeight: '800', color: 'var(--primary)', maxWidth: '80px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', whiteSpace: 'normal', lineHeight: '1.2' }}>
              Boutiques
            </span>
          </button>
          
          {categories.map(cat => (
            <button key={cat.id} onClick={() => navigate(`/category/${cat.id}`)} className="touch-target active-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'transparent', border: 'none', flexShrink: 0, gap: '8px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `${cat.color}15`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                {cat.icon}
              </div>
              <span className="text-muted-small" style={{ fontWeight: '500', maxWidth: '80px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', whiteSpace: 'normal', lineHeight: '1.2' }}>
                {cat.name}
              </span>
            </button>
          ))}
          {/* Spacer */}
          <div style={{ width: '1px', flexShrink: 0 }}></div>
        </div>
      </section>

      {/* Hero Banner */}
      <section style={{ padding: '0 16px', marginBottom: '1.5rem' }}>
        <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' }}>
          <img src="/image banniere.jpg" alt="Colobane Market" loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', minHeight: '140px', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.1) 100%)', display: 'flex', alignItems: 'center', padding: '1.5rem' }}>
            <div>
              <h1 className="hero-title" style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.25rem', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: '1.3' }}>En un clic,<br/>Vendez, Achetez<br/>Simplement.</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="section-container" style={{ margin: '0', padding: '0 16px' }}>
        <div className="grid grid-cols-2">
          {products.map((product) => {
            const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/hero.png';
            const condition = product.condition || 'Occasion';

            return (
              <div key={product.id} onClick={() => navigate(`/product/${product.id}`)} className="product-card active-scale" style={{ cursor: 'pointer', border: product.is_boosted ? '2px solid #fbbf24' : '1px solid transparent', background: product.is_boosted ? '#fffdf0' : 'var(--card-bg)', borderRadius: 'var(--radius-md)', boxShadow: product.is_boosted ? '0 4px 15px rgba(251, 191, 36, 0.2)' : 'none', overflow: 'hidden' }}>
                {/* Image 1:1 Swipeable */}
                <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {(product.images && product.images.length > 0 ? product.images.slice(0, 4) : ['/hero.png']).map((img, i) => (
                      <div key={i} style={{ flex: '0 0 100%', height: '100%', scrollSnapAlign: 'start', position: 'relative' }}>
                        <img src={img} alt={`${product.title} ${i+1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>

                  {/* Dots indicator */}
                  {product.images && product.images.length > 1 && (
                    <div style={{ position: 'absolute', bottom: '8px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '4px', zIndex: 10 }}>
                      {product.images.slice(0, 4).map((_, i) => (
                        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                      ))}
                    </div>
                  )}

                  {product.is_boosted && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#fbbf24', color: '#78350f', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: 'var(--radius-pill)', zIndex: 11, boxShadow: '0 2px 5px rgba(251, 191, 36, 0.4)' }}>
                      ⭐ Sponsorisé
                    </span>
                  )}

                  {/* Condition Badge Pill */}
                  <span style={{ position: 'absolute', top: product.is_boosted ? '32px' : '8px', left: '8px', background: 'rgba(255,255,255,0.9)', color: 'var(--text-main)', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: 'var(--radius-pill)', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                    {condition}
                  </span>
                  
                  {/* Favorite button */}
                  <FavoriteButton 
                    productId={product.id} 
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', zIndex: 10 }} 
                  />
                </div>

                {/* Details */}
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.4', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-main)' }}>
                    {product.title}
                  </h3>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
                    {product.price.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontSize: '11px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px', color: 'var(--text-muted)' }}>{product.profiles?.boutique_name || product.profiles?.full_name || 'Vendeur'}</span>
                    <span>•</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.location || 'Dakar'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              onClick={handleLoadMore} 
              disabled={loadingMore}
              className="btn-secondary active-scale"
              style={{ padding: '0 32px', borderRadius: 'var(--radius-pill)' }}
            >
              {loadingMore ? 'Chargement...' : 'Voir plus'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
