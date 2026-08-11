import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { categories } from '../data/categories';
import { supabase } from '../lib/supabase';
import FavoriteButton from '../components/FavoriteButton';
import { Store, Filter } from 'lucide-react';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  // Resolution de la catégorie selon ID ou alias (ex: friperie, restauration, alimentation, etc.)
  const category = categories.find((c) => {
    if (!c) return false;
    const cleanParam = (categoryId || '').toLowerCase().replace(/-/g, '_');
    if (c.id === cleanParam) return true;
    if (['restauration', 'cuisine', 'traiteur', 'nourriture'].includes(cleanParam) && c.id === 'alimentation') return true;
    if (['friperie', 'fripe', 'balles'].includes(cleanParam) && c.id === 'friperie') return true;
    return false;
  });

  const [categoryProducts, setCategoryProducts] = useState([]);
  const [selectedSubcat, setSelectedSubcat] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const catTargetId = category?.id || categoryId;
        let query = supabase
          .from('products')
          .select('*')
          .order('is_boosted', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });

        if (['alimentation', 'restauration', 'cuisine', 'traiteur'].includes(catTargetId)) {
          query = query.in('category', ['alimentation', 'restauration', 'cuisine', 'traiteur']);
        } else if (['friperie', 'fripe', 'balles'].includes(catTargetId)) {
          query = query.in('category', ['friperie', 'fripe', 'balles']);
        } else {
          query = query.eq('category', catTargetId);
        }

        const { data, error } = await query;
        if (error) throw error;
        setCategoryProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, category]);

  if (!category) {
    return (
      <div className="section-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '12px' }}>Catégorie introuvable</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>La catégorie demandée n'existe pas ou a été déplacée.</p>
        <button onClick={() => navigate('/explore')} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '16px' }}>
          Découvrir les annonces →
        </button>
      </div>
    );
  }

  // Sous-catégories trouvées dans les champs
  const subcatField = category.fields.find(f => ['type', 'property_type', 'service_type', 'job_type'].includes(f.name));
  const subcatOptions = subcatField?.options || [];

  const filteredProducts = selectedSubcat === 'all' 
    ? categoryProducts 
    : categoryProducts.filter(p => {
        const typeVal = p.metadata?.type || p.metadata?.sub_category || '';
        return typeVal.toLowerCase().includes(selectedSubcat.toLowerCase());
      });

  return (
    <div className="section-container" style={{ paddingBottom: '120px', paddingTop: '1rem' }}>
      {/* Fil d'ariane & En-tête */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Accueil</Link>
        <span>›</span>
        <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{category.name}</span>
      </div>

      <div className="page-header hover-lift" style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', borderRadius: '24px', padding: '24px', textAlign: 'center', marginBottom: '2rem', border: '1.5px solid #FCD34D', boxShadow: '0 4px 15px rgba(245,158,11,0.1)' }}>
        <div style={{ margin: '0 auto 12px', width: '70px', height: '70px', fontSize: '2.5rem', background: `${category.color}20`, color: category.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {category.icon}
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#78350F', margin: '0 0 6px 0', fontFamily: 'var(--font-heading)' }}>{category.name}</h1>
        <p style={{ color: '#B45309', margin: 0, fontSize: '0.92rem', fontWeight: '600' }}>
          {categoryProducts.length} article{categoryProducts.length > 1 ? 's' : ''} disponible{categoryProducts.length > 1 ? 's' : ''} au Sénégal
        </p>
      </div>

      {/* Filtres par sous-catégories (Pills) */}
      {subcatOptions.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
            <Filter size={15} /> Sous-catégories :
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
            <button
              onClick={() => setSelectedSubcat('all')}
              className="active-scale"
              style={{ padding: '8px 16px', borderRadius: '20px', background: selectedSubcat === 'all' ? 'var(--primary)' : '#F1F5F9', color: selectedSubcat === 'all' ? 'white' : 'var(--text-main)', border: 'none', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 }}
            >
              Tout ({categoryProducts.length})
            </button>
            {subcatOptions.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcat(sub)}
                className="active-scale"
                style={{ padding: '8px 16px', borderRadius: '20px', background: selectedSubcat === sub ? 'var(--primary)' : '#F1F5F9', color: selectedSubcat === sub ? 'white' : 'var(--text-main)', border: 'none', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 }}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', fontWeight: '600' }}>Chargement des articles...</div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'white', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>Aucun article trouvé dans {category.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Soyez le premier vendeur à poster une annonce dans cette catégorie !</p>
          <Link to="/publish" className="btn-primary active-scale" style={{ padding: '12px 24px', borderRadius: '16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
            📢 Publier un article
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredProducts.map((product) => {
            const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x400?text=No+Image';
            return (
              <Link to={`/product/${product.id}`} key={product.id} className="product-card active-scale hover-lift" style={{ textDecoration: 'none', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#F1F5F9' }}>
                  <img src={imageUrl} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <FavoriteButton 
                    productId={product.id} 
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', zIndex: 10 }} 
                  />
                  {product.is_boosted && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontSize: '0.7rem', fontWeight: '800', padding: '3px 8px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                      ⚡ Sponsorisé
                    </span>
                  )}
                </div>
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div style={{ fontSize: (product.price || 0) > 999999 ? '0.95rem' : '1.1rem', fontWeight: '900', color: 'var(--primary)', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.price > 0 ? `${(product.price || 0).toLocaleString('fr-FR')} FCFA` : product.metadata?.price_type || 'Sur demande'}
                  </div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: '600', lineHeight: '1.35', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-main)', height: '2.4em' }}>
                    {product.title}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '500', marginTop: 'auto' }}>
                    📍 {product.location || 'Dakar'}
                  </div>
                </div>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '10px', textAlign: 'center', fontSize: '0.82rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Store size={14} /> Voir l'annonce
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
