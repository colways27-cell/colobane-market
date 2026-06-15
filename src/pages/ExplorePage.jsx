import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { categories } from '../data/categories';
import FavoriteButton from '../components/FavoriteButton';

const locations = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Saint-Louis', 'Touba', 'Kaolack', 'Ziguinchor', 'Mbour', 'Louga', 'Tambacounda', 'Autre'];

const ExplorePage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || location.state?.category || 'all';
  const initialSearch = searchParams.get('q') || '';
  const initialSubcategory = searchParams.get('subcategory') || 'all';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, price_asc, price_desc
  const [activeSubcategory, setActiveSubcategory] = useState(initialSubcategory);
  const [conditionFilter, setConditionFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*');

      // 1. Filtre par Catégorie
      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      // 1b. Filtre par Sous-catégorie
      if (activeSubcategory !== 'all') {
        const cat = categories.find(c => c.id === activeCategory);
        const subcategoriesField = cat?.fields?.find(f => f.type === 'select' && ['type', 'property_type', 'service_type', 'species', 'sector', 'contract_type', 'brand'].includes(f.name));
        if (subcategoriesField) {
          query = query.contains('metadata', { [subcategoriesField.name]: activeSubcategory });
        } else {
          // Fallback old subcategory
          query = query.contains('metadata', { subcategory: activeSubcategory });
        }
      }

      // 2. Recherche Textuelle (titre)
      if (searchQuery.trim() !== '') {
        query = query.ilike('title', `%${searchQuery.trim()}%`);
      }

      // 3. Filtre de Prix Min
      if (minPrice !== '') {
        query = query.gte('price', parseInt(minPrice));
      }

      // 4. Filtre de Prix Max
      if (maxPrice !== '') {
        query = query.lte('price', parseInt(maxPrice));
      }
      
      // 5. Filtre Etat
      if (conditionFilter !== 'all') {
        query = query.eq('condition', conditionFilter);
      }

      // 6. Filtre Localisation
      if (locationFilter !== 'all') {
        query = query.eq('location', locationFilter);
      }

      // 7. Tri
      query = query.order('is_boosted', { ascending: false, nullsFirst: false });
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des annonces:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeSubcategory, searchQuery, minPrice, maxPrice, conditionFilter, locationFilter, sortBy]);

  // Synchronize state with URL search params if they change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('category')) setActiveCategory(params.get('category'));
    if (params.get('subcategory')) setActiveSubcategory(params.get('subcategory'));
    if (params.get('q')) setSearchQuery(params.get('q'));
  }, [location.search]);

  // Déclencher la recherche au chargement ou quand les filtres automatiques changent
  useEffect(() => {
    fetchProducts();
  }, [activeCategory, activeSubcategory, conditionFilter, locationFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setActiveCategory('all');
    setActiveSubcategory('all');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setConditionFilter('all');
    setLocationFilter('all');
    setSortBy('newest');
    setTimeout(() => fetchProducts(), 0);
  };

  return (
    <div className="section-container" style={{ margin: '2rem auto' }}>
      
      {/* En-tête avec barre de recherche principale */}
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Que recherchez-vous ?</h1>
          <p style={{ color: 'var(--text-muted)' }}>Des milliers d'articles et de services au bout des doigts.</p>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%', maxWidth: '800px' }}>
          <input 
            type="text" 
            placeholder="Ex: Toyota Corolla, iPhone 13, Appartement Almadies..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: '1 1 200px', minWidth: 0, padding: '1rem 1.5rem', fontSize: '1rem', borderRadius: '50px', border: '1px solid var(--border-color)', outline: 'none' }}
          />
          <button type="submit" className="btn-primary active-scale" style={{ flex: '1 1 auto', borderRadius: '50px', padding: '1rem 2rem', fontSize: '1rem', justifyContent: 'center' }}>
            🔍 Rechercher
          </button>
        </form>
      </div>

      <div className="explore-layout">
        
        {/* Sidebar des Filtres */}
        <div className="explore-sidebar" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Filtres</h3>
            <button onClick={handleResetFilters} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>Réinitialiser</button>
          </div>

          <form onSubmit={handleSearchSubmit}>
            {/* Prix */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.5px' }}>Budget (FCFA)</h4>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="form-control" 
                  style={{ padding: '0.5rem', flex: 1, minWidth: 0 }}
                />
                <span>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="form-control" 
                  style={{ padding: '0.5rem', flex: 1, minWidth: 0 }}
                />
              </div>
              <button type="submit" className="btn-secondary" style={{ width: '100%', marginTop: '0.8rem', padding: '0.5rem' }}>Appliquer le budget</button>
            </div>
          </form>

          {/* État */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.5px' }}>État de l'article</h4>
            <select 
              value={conditionFilter} 
              onChange={(e) => setConditionFilter(e.target.value)}
              className="form-control"
              style={{ padding: '0.8rem', width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-body)' }}
            >
              <option value="all">Tous les états</option>
              <option value="Neuf">Neuf (scellé)</option>
              <option value="Venant">Venant (importé)</option>
              <option value="Occasion">Occasion</option>
            </select>
          </div>

          {/* Localisation */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.5px' }}>Localisation</h4>
            <select 
              value={locationFilter} 
              onChange={(e) => setLocationFilter(e.target.value)}
              className="form-control"
              style={{ padding: '0.8rem', width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-body)' }}
            >
              <option value="all">Toutes les régions</option>
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          {/* Catégories */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.5px' }}>Catégories</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li>
                <button 
                  onClick={() => { setActiveCategory('all'); setActiveSubcategory('all'); }}
                  style={{ 
                    width: '100%', textAlign: 'left', padding: '0.6rem 1rem', 
                    background: activeCategory === 'all' ? 'var(--primary-light)' : 'transparent',
                    color: activeCategory === 'all' ? 'var(--primary)' : 'var(--text-main)',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: activeCategory === 'all' ? '600' : '500',
                    transition: 'all 0.2s'
                  }}
                >
                  🌐 Toutes les catégories
                </button>
              </li>
              {categories.map(cat => {
                const subcategoriesField = cat.fields?.find(f => f.type === 'select' && ['type', 'property_type', 'service_type', 'species', 'sector', 'contract_type', 'brand'].includes(f.name));
                const subcategories = subcategoriesField?.options ? subcategoriesField.options.filter(o => o !== 'Autre') : [];
                const isActive = activeCategory === cat.id;

                return (
                  <li key={cat.id}>
                    <button 
                      onClick={() => { setActiveCategory(cat.id); setActiveSubcategory('all'); }}
                      style={{ 
                        width: '100%', textAlign: 'left', padding: '0.6rem 1rem', 
                        background: isActive ? 'var(--primary-light)' : 'transparent',
                        color: isActive ? 'var(--primary)' : 'var(--text-main)',
                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: isActive ? '600' : '500',
                        transition: 'all 0.2s',
                        display: 'flex', gap: '0.5rem',
                        alignItems: 'center', justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </div>
                      {subcategories.length > 0 && (
                        <span style={{ fontSize: '0.8rem', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                      )}
                    </button>
                    
                    {/* Sous-catégories (Accordion) */}
                    {isActive && subcategories.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: '0.5rem 0 0.5rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', animation: 'fadeIn 0.2s' }}>
                        <li>
                          <button
                            onClick={() => setActiveSubcategory('all')}
                            style={{
                              width: '100%', textAlign: 'left', padding: '0.4rem 0.5rem',
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: activeSubcategory === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                              fontWeight: activeSubcategory === 'all' ? '600' : 'normal',
                              fontSize: '0.9rem'
                            }}
                          >
                            Tout voir
                          </button>
                        </li>
                        {subcategories.map(sub => (
                          <li key={sub}>
                            <button
                              onClick={() => setActiveSubcategory(sub)}
                              style={{
                                width: '100%', textAlign: 'left', padding: '0.4rem 0.5rem',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: activeSubcategory === sub ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: activeSubcategory === sub ? '600' : 'normal',
                                fontSize: '0.9rem'
                              }}
                            >
                              {sub}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

        </div>

        {/* Grille de Résultats */}
        <div className="explore-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontWeight: '500', minWidth: '200px' }}>
              <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.2rem' }}>{products.length}</span> résultat(s) trouvé(s)
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Trier par :</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="newest">Les plus récents</option>
                <option value="price_asc">Prix croissant (Moins cher)</option>
                <option value="price_desc">Prix décroissant (Plus cher)</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>⏳</span>
              Chargement des annonces...
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)', borderRadius: '16px', border: '1px solid var(--border-color)', margin: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Aucune annonce ne correspond</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '400px', lineHeight: '1.5', marginBottom: '2rem' }}>
                Nous n'avons pas trouvé de résultat pour votre recherche. Essayez avec d'autres mots-clés ou réinitialisez vos filtres.
              </p>
              <button onClick={handleResetFilters} className="btn-primary active-scale" style={{ padding: '0.8rem 2rem', borderRadius: 'var(--radius-pill)', fontWeight: '600' }}>
                Effacer les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
              {products.map(product => {
                const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x400?text=No+Image';
                return (
                  <Link to={`/product/${product.id}`} key={product.id} className="product-card active-scale" style={{ textDecoration: 'none', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'block', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#F1F5F9' }}>
                      <img src={imageUrl} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      {product.is_urgent && (
                        <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#e74c3c', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', zIndex: 10 }}>URGENT</span>
                      )}
                      <FavoriteButton 
                        productId={product.id} 
                        style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', zIndex: 10 }} 
                      />
                    </div>
                    <div style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.4', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                        {product.title}
                      </h3>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>
                        {(product.price || 0).toLocaleString('fr-FR')} {product.currency || 'FCFA'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', gap: '4px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>📍 {product.location}</span>
                        <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{new Date(product.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
