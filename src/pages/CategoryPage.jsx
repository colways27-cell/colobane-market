import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { categories } from '../data/categories';
import { supabase } from '../lib/supabase';
import FavoriteButton from '../components/FavoriteButton';
import { Store } from 'lucide-react';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const category = categories.find((c) => c.id === categoryId);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', categoryId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCategoryProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  if (!category) {
    return <div className="page-header"><h1 className="page-title">Catégorie introuvable</h1></div>;
  }

  return (
    <div className="section-container" style={{ paddingBottom: '120px' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ margin: '0 auto 1rem', width: '80px', height: '80px', fontSize: '3rem', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {category.icon}
        </div>
        <h1 className="page-title">{category.name}</h1>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Chargement...</div>
      ) : categoryProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Aucun article dans cette catégorie pour le moment.</p>
          <Link to="/publish" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Soyez le premier à publier !</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3">
          {categoryProducts.map((product) => {
            const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x400?text=No+Image';
            return (
              <Link to={`/product/${product.id}`} key={product.id} className="product-card active-scale" style={{ textDecoration: 'none', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#F1F5F9' }}>
                  <img src={imageUrl} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <FavoriteButton 
                    productId={product.id} 
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', zIndex: 10 }} 
                  />
                </div>
                <div style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.4', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                    {product.title}
                  </h3>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)', marginBottom: 'auto' }}>
                    {(product.price || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
                {/* Bouton Contacter */}
                <div style={{ background: '#e30b3b', color: 'white', padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Store size={14} /> CONTACTER
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
