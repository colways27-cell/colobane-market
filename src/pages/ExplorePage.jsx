import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { categories } from '../data/categories';
import FavoriteButton from '../components/FavoriteButton';
import ReportModal from '../components/ReportModal';
import AroundMeModal from '../components/AroundMeModal';
import { sortProductsByProximity } from '../utils/geolocation';
import { Store, MapPin, Compass } from 'lucide-react';

const locations = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Saint-Louis', 'Touba', 'Kaolack', 'Ziguinchor', 'Mbour', 'Louga', 'Tambacounda', 'Autre'];

const ExplorePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || location.state?.category || 'all';
  const initialSearch = searchParams.get('q') || '';
  const initialSubcategory = searchParams.get('subcategory') || 'all';
  const initialBoosted = searchParams.get('boosted') === 'true';

  const resultsRef = useRef(null);

  // Long press reporting state
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, productId: null });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportProductId, setReportProductId] = useState(null);

  const handlePressStart = (productId) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setContextMenu({ visible: true, productId });
    }, 500);
  };

  const handlePressEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const scrollToResults = useCallback(() => {
    if (resultsRef.current) {
      const yOffset = -20;
      const y = resultsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

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
  const [isBoostedOnly, setIsBoostedOnly] = useState(initialBoosted);
  const [groupedView, setGroupedView] = useState(false);
  const [selectedGroupModal, setSelectedGroupModal] = useState(null);

  // Géolocalisation & Proximité states
  const [showAroundMeModal, setShowAroundMeModal] = useState(false);
  const [activeUserCoords, setActiveUserCoords] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedQuartier, setSelectedQuartier] = useState('');

  // Smart Grouping logic for products
  const groupProducts = (prods) => {
    if (!prods || prods.length === 0) return [];
    const stopWords = new Set([
      'de', 'du', 'des', 'le', 'la', 'les', 'en', 'pour', 'avec', 'sans', 'a', 'au', 'aux',
      'un', 'une', 'taille', 'pointure', 'couleur', 'etat', 'neuf', 'bon', 'tres', 'vends',
      'vend', 'vendre', 'prix', 'dakar', 'sn', 'senegal', 'homme', 'femme'
    ]);

    const getTokens = (title) => {
      return (title || '').toLowerCase()
        .replace(/[^a-z0-9\u00e0-\u00fc]/gi, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !stopWords.has(w));
    };

    const getGroupKey = (p) => {
      const tokens = getTokens(p.title);
      if (tokens.length === 0) return (p.title || '').toLowerCase().trim();

      const keyBrands = ['iphone', 'samsung', 'nike', 'adidas', 'toyota', 'mercedes', 'bmw', 'casio', 'zara', 'macbook', 'ps5', 'ps4', 'xbox', 'airpods', 'hp', 'dell', 'lenovo', 'hyundai', 'kia', 'honda', 'peugeot', 'renault', 'robe', 'chemise', 'pantalon', 'chaussure', 'montre', 'sac', 'appartement', 'maison', 'terrain', 'scooter', 'moto'];
      
      const brandToken = tokens.find(t => keyBrands.includes(t));
      if (brandToken) {
        const otherToken = tokens.find(t => t !== brandToken) || '';
        return `${brandToken}_${otherToken}`;
      }

      return tokens.slice(0, 2).sort().join('_');
    };

    const groups = {};
    prods.forEach(p => {
      const key = getGroupKey(p);
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    return Object.values(groups).map(group => ({
      ...group[0],
      _count: group.length,
      _minPrice: Math.min(...group.map(p => p.price || 0)),
      _maxPrice: Math.max(...group.map(p => p.price || 0)),
      _group: group
    }));
  };

  const displayProducts = groupedView ? groupProducts(products) : products;

  // Suggestions autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const suggestionTimer = useRef(null);

  const handleSuggestionSearch = (value) => {
    clearTimeout(suggestionTimer.current);
    if (value.length < 2) { setSuggestions([]); setSuggestionsOpen(false); return; }
    suggestionTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('title, price, location')
        .ilike('title', `%${value}%`)
        .limit(6);
      if (data && data.length > 0) {
        setSuggestions(data);
        setSuggestionsOpen(true);
        setSuggestionIndex(-1);
      } else {
        setSuggestions([]);
        setSuggestionsOpen(false);
      }
    }, 250);
  };

  const handleSuggestionKeyDown = (e) => {
    if (!suggestionsOpen) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestionIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestionIndex(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && suggestionIndex >= 0) {
      e.preventDefault();
      setSearchQuery(suggestions[suggestionIndex].title);
      setSuggestionsOpen(false);
      setTimeout(fetchProducts, 0);
      setTimeout(scrollToResults, 150);
    } else if (e.key === 'Escape') { setSuggestionsOpen(false); }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*');

      // 1. Filtre par Catégorie
      if (activeCategory !== 'all') {
        const cleanCat = (activeCategory || '').toLowerCase().replace(/-/g, '_');
        if (['alimentation', 'restauration', 'cuisine', 'traiteur'].includes(cleanCat)) {
          query = query.in('category', ['alimentation', 'restauration', 'cuisine', 'traiteur']);
        } else if (['friperie', 'fripe', 'balles'].includes(cleanCat)) {
          query = query.in('category', ['friperie', 'fripe', 'balles']);
        } else {
          query = query.eq('category', activeCategory);
        }
      }

      // 1b. Filtre par Sous-catégorie
      if (activeSubcategory !== 'all') {
        const cat = categories.find(c => c.id === activeCategory);
        const subcategoriesField = cat?.fields?.find(f => f.type === 'select' && ['type', 'property_type', 'service_type', 'species', 'sector', 'contract_type', 'brand'].includes(f.name));
        if (subcategoriesField) {
          query = query.contains('metadata', { [subcategoriesField.name]: activeSubcategory });
        } else {
          // Fallback old subcategory
          query = query.or(`subcategory.eq."${activeSubcategory}",metadata->>subcategory.eq."${activeSubcategory}"`);
        }
      }

      // 2. Recherche par mot-clé (Titre ou Description)
      if (searchQuery.trim() !== '') {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
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

      // 6b. Filtre "Voir tout" pour les articles sponsorisés
      if (isBoostedOnly) {
        query = query.eq('is_boosted', true);
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
      
      let finalProducts = data || [];
      if (activeUserCoords) {
        finalProducts = sortProductsByProximity(activeUserCoords, finalProducts, selectedRadius);
      }

      setProducts(finalProducts);
    } catch (err) {
      console.error('Erreur lors de la récupération des annonces:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeSubcategory, searchQuery, minPrice, maxPrice, conditionFilter, locationFilter, sortBy, isBoostedOnly, activeUserCoords, selectedRadius]);

  // Synchronize state with URL search params if they change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('category')) setActiveCategory(params.get('category'));
    if (params.get('subcategory')) setActiveSubcategory(params.get('subcategory'));
    if (params.get('q')) setSearchQuery(params.get('q'));
    if (params.get('near') === 'me') setShowAroundMeModal(true);
    setIsBoostedOnly(params.get('boosted') === 'true');
  }, [location.search]);

  useEffect(() => {
    let active = true;
    const runFetch = async () => {
      if (active) await fetchProducts();
    };
    runFetch();
    return () => { active = false; };
  }, [fetchProducts]);

  // Défilement automatique vers les résultats lorsqu'un filtre est actif
  useEffect(() => {
    if (activeCategory !== 'all' || activeSubcategory !== 'all' || searchQuery !== '' || conditionFilter !== 'all' || locationFilter !== 'all' || sortBy !== 'newest' || isBoostedOnly) {
      const timeoutId = setTimeout(scrollToResults, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [activeCategory, activeSubcategory, searchQuery, conditionFilter, locationFilter, sortBy, isBoostedOnly, scrollToResults]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
    setTimeout(scrollToResults, 150);
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
    setIsBoostedOnly(false);
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

        {/* Barre de recherche intelligente */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Ex: Robe wax, iPhone 13, Appartement Almadies..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); handleSuggestionSearch(e.target.value); }}
                onKeyDown={handleSuggestionKeyDown}
                onFocus={() => searchQuery.length >= 2 && setSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                style={{ width: '100%', padding: '1rem 1.2rem 1rem 3rem', fontSize: '1rem', borderRadius: '50px', border: '2px solid var(--border-color)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', background: 'white' }}
                onFocusCapture={e => e.target.style.borderColor = 'var(--primary)'}
                onBlurCapture={e => e.target.style.borderColor = 'var(--border-color)'}
              />
              {/* Suggestions dropdown */}
              {suggestionsOpen && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'white', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #E2E8F0', zIndex: 999, overflow: 'hidden' }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => { setSearchQuery(s.title); setSuggestionsOpen(false); setTimeout(fetchProducts, 0); setTimeout(scrollToResults, 150); }}
                      style={{ padding: '0.9rem 1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: i === suggestionIndex ? '#FEF2F2' : 'white', borderBottom: i < suggestions.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = i === suggestionIndex ? '#FEF2F2' : 'white'}
                    >
                      <span style={{ fontSize: '1rem' }}>🏷️</span>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {s.title.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, j) =>
                            part.toLowerCase() === searchQuery.toLowerCase()
                              ? <mark key={j} style={{ background: 'rgba(138,28,28,0.12)', color: 'var(--primary)', borderRadius: '3px', padding: '0 2px' }}>{part}</mark>
                              : part
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.location} • {(s.price || 0).toLocaleString('fr-FR')} FCFA</div>
                      </div>
                    </div>
                  ))}
                  {suggestions.length > 0 && (
                    <div
                      onClick={() => { setSuggestionsOpen(false); fetchProducts(); setTimeout(scrollToResults, 150); }}
                      style={{ padding: '0.8rem 1.2rem', background: '#F8FAFC', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)' }}
                    >
                      Voir tous les résultats pour "{searchQuery}" →
                    </div>
                  )}
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary active-scale" style={{ borderRadius: '50px', padding: '1rem 2rem', fontSize: '1rem', whiteSpace: 'nowrap' }}>
              Rechercher
            </button>
          </form>
        </div>
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
        <div className="explore-content" ref={resultsRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontWeight: '500', minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span><span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.2rem' }}>{displayProducts.length}</span> résultat(s){groupedView ? ' groupé(s)' : ''}</span>
              {isBoostedOnly && (
                <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.8rem', fontWeight: '700', padding: '4px 10px', borderRadius: 'var(--radius-pill)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  ⚡ Annonces Sponsorisées
                  <button onClick={() => setIsBoostedOnly(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'inline-flex', marginLeft: '4px', color: '#92400e' }}>✕</button>
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
              {/* Bouton Proximité / Autour de moi */}
              <button
                onClick={() => setShowAroundMeModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: activeUserCoords ? '2px solid #10B981' : '1px solid var(--border-color)',
                  background: activeUserCoords ? '#ECFDF5' : 'white',
                  color: activeUserCoords ? '#047857' : 'var(--text-main)',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: activeUserCoords ? '0 2px 8px rgba(16,185,129,0.2)' : 'none'
                }}
              >
                <Compass size={16} color={activeUserCoords ? '#10B981' : 'currentColor'} />
                {activeUserCoords
                  ? `Autour de moi (${selectedRadius ? `${selectedRadius} km` : 'Tout'})`
                  : 'Autour de moi 🎯'
                }
              </button>

              {/* Toggle groupement */}
              <button
                onClick={() => setGroupedView(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', borderRadius: '20px', border: `2px solid ${groupedView ? 'var(--primary)' : 'var(--border-color)'}`, background: groupedView ? 'var(--primary-light)' : 'white', color: groupedView ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <span>{groupedView ? '🗂️' : '📋'}</span>
                {groupedView ? 'Groupé' : 'Tout afficher'}
              </button>
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
              {displayProducts.map(product => {
                const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x400?text=No+Image';
                const isMultiGroup = groupedView && product._count > 1;

                return (
                  <div 
                    key={product.id} 
                    onMouseDown={() => handlePressStart(product.id)}
                    onMouseUp={handlePressEnd}
                    onTouchStart={() => handlePressStart(product.id)}
                    onTouchEnd={handlePressEnd}
                    onClick={(e) => {
                      if (isLongPress.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      if (isMultiGroup) {
                        setSelectedGroupModal(product);
                      } else {
                        navigate(`/product/${product.id}`);
                      }
                    }}
                    className="product-card active-scale" 
                    style={{ cursor: 'pointer', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
                  >
                    <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#F1F5F9' }}>
                      <img src={imageUrl} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      {/* Badge nombre de vendeurs (mode groupé) */}
                      {isMultiGroup && (
                        <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', zIndex: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                          👥 {product._count} offres similaires
                        </span>
                      )}
                      {product.is_boosted && (
                        <span style={{ position: 'absolute', top: isMultiGroup ? '36px' : '8px', left: '8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '4px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.3px', boxShadow: '0 2px 6px rgba(217,119,6,0.4)', zIndex: 11 }}>
                          ⚡ Sponsorisé
                        </span>
                      )}
                      {product.is_urgent && (
                        <span style={{ position: 'absolute', top: product.is_boosted ? (isMultiGroup ? '60px' : '36px') : (isMultiGroup ? '36px' : '8px'), left: '8px', background: '#e74c3c', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', zIndex: 10 }}>URGENT</span>
                      )}
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
                        {isMultiGroup
                          ? `${(product._minPrice || 0).toLocaleString('fr-FR')} – ${(product._maxPrice || 0).toLocaleString('fr-FR')} FCFA`
                          : `${(product.price || 0).toLocaleString('fr-FR')} ${product.currency || 'FCFA'}`
                        }
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', gap: '4px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'linear-gradient(135deg, #d97706, #92400e)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                            <MapPin size={9} strokeWidth={3} />
                          </span>
                          {product.formattedDistance ? `À ${product.formattedDistance}` : product.location}
                        </span>
                        <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{new Date(product.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ background: isMultiGroup ? 'var(--primary)' : '#e30b3b', color: 'white', padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Store size={14} /> {isMultiGroup ? `VOIR LES ${product._count} OFFRES` : 'CONTACTER'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal pour afficher la liste des annonces groupées */}
      {selectedGroupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '580px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', animation: 'scaleUp 0.25s ease-out' }}>
            {/* Header Modal */}
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  🗂️ Offres similaires disponibles ({selectedGroupModal._group?.length || 0})
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {selectedGroupModal.title}
                </p>
              </div>
              <button 
                onClick={() => setSelectedGroupModal(null)} 
                style={{ background: '#E2E8F0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', color: '#475569' }}
              >
                ✕
              </button>
            </div>

            {/* List of Offers */}
            <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedGroupModal._group?.map((item, idx) => {
                const img = item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/400x400?text=No+Image';
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', background: '#F8FAFC', padding: '12px', borderRadius: '16px', border: '1px solid #E2E8F0', alignItems: 'center' }}>
                    <img src={img} alt="" style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.title}
                      </div>
                      <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.05rem', marginTop: '2px' }}>
                        {(item.price || 0).toLocaleString('fr-FR')} {item.currency || 'FCFA'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'linear-gradient(135deg, #d97706, #92400e)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                            <MapPin size={9} strokeWidth={3} />
                          </span>
                          {item.location || 'Dakar'}
                        </span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSelectedGroupModal(null); navigate(`/product/${item.id}`); }} 
                      className="active-scale" 
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Voir l'offre →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Menu contextuel discret sur appui long */}
      {contextMenu.visible && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
            zIndex: 9990, display: 'flex', alignItems: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
          }} 
          onClick={() => setContextMenu({ visible: false, productId: null })}
        >
          <div 
            style={{
              width: '100%', maxWidth: '500px', margin: '0 auto', background: 'white',
              borderRadius: '24px 24px 0 0', padding: '24px 20px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              onClick={() => { 
                const pid = contextMenu.productId; 
                setContextMenu({ visible: false, productId: null }); 
                setReportProductId(pid); 
                setShowReportModal(true); 
              }}
              className="touch-target active-scale"
              style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: '700', color: '#EF4444', cursor: 'pointer', background: '#FEF2F2', borderRadius: '16px', marginBottom: '12px' }}
            >
              🚩 Signaler cette annonce
            </div>
            <div 
              onClick={() => setContextMenu({ visible: false, productId: null })}
              className="touch-target active-scale"
              style={{ padding: '14px', textAlign: 'center', fontSize: '15px', fontWeight: '600', color: '#64748B', cursor: 'pointer', background: '#F1F5F9', borderRadius: '16px' }}
            >
              Annuler
            </div>
          </div>
        </div>
      )}

      {/* Modal de Signalement Unifié */}
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        productId={reportProductId} 
      />

      {/* Modal de Géolocalisation & Proximité */}
      <AroundMeModal
        isOpen={showAroundMeModal}
        onClose={() => setShowAroundMeModal(false)}
        activeUserCoords={activeUserCoords}
        setActiveUserCoords={setActiveUserCoords}
        selectedRadius={selectedRadius}
        setSelectedRadius={setSelectedRadius}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        selectedQuartier={selectedQuartier}
        setSelectedQuartier={setSelectedQuartier}
        onApply={() => fetchProducts()}
      />
    </div>
  );
};

export default ExplorePage;
