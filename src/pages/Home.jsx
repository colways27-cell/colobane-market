import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories } from '../data/categories';
import { products as mockProducts } from '../data/products';
import { supabase } from '../lib/supabase';
import SkeletonCard from '../components/SkeletonCard';
import FavoriteButton from '../components/FavoriteButton';
import toast from 'react-hot-toast';
import { Store, ChevronDown, ChevronUp, Search } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [boostedProducts, setBoostedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [activeCategorySlide, setActiveCategorySlide] = useState(null);
  const [showPromoBanner, setShowPromoBanner] = useState(() => {
    try {
      return !localStorage.getItem('hidePromoBanner');
    } catch (e) {
      return true;
    }
  });
  const subcategoriesRef = useRef(null);
  const categoriesRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const PAGE_SIZE = 15;
  const navigate = useNavigate();

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      setActiveBanner(prev => (prev < 2 ? prev + 1 : 0));
    } else if (isRightSwipe) {
      setActiveBanner(prev => (prev > 0 ? prev - 1 : 2));
    }
  };

  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(bannerTimer);
  }, []);

  const handleScroll = () => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  const scroll = (direction) => {
    if (categoriesRef.current) {
      const scrollAmount = 240;
      categoriesRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (activeCategorySlide && subcategoriesRef.current) {
      setTimeout(() => {
        subcategoriesRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [activeCategorySlide]);

  // Initial scroll check and window resize listener
  useEffect(() => {
    const timer = setTimeout(handleScroll, 300);
    window.addEventListener('resize', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleScroll);
    };
  }, [products]);

  const fetchProducts = async (currentPage, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      // --- AUTOMATIC EXPIRATION CLEANUPS ---
      if (!isLoadMore && currentPage === 0) {
        try {
          const nowISO = new Date().toISOString();
          
          // 1. Boosts auto-cleanup
          const { data: expiredBoosts } = await supabase
            .from('products')
            .select('id')
            .eq('is_boosted', true)
            .lt('boost_end_date', nowISO);
            
          if (expiredBoosts && expiredBoosts.length > 0) {
            await supabase
              .from('products')
              .update({ is_boosted: false, boost_end_date: null })
              .in('id', expiredBoosts.map(b => b.id));
          }

          // 2. Subscriptions auto-cleanup
          const { data: expiredSubs } = await supabase
            .from('profiles')
            .select('id')
            .not('subscription_plan', 'eq', 'none')
            .not('subscription_plan', 'is', null)
            .lt('subscription_end_date', nowISO);

          if (expiredSubs && expiredSubs.length > 0) {
            await supabase
              .from('profiles')
              .update({ subscription_plan: 'none', subscription_end_date: null })
              .in('id', expiredSubs.map(u => u.id));
          }
        } catch (cleanupErr) {
          console.warn('Auto cleanup error:', cleanupErr);
        }
      }

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (!isLoadMore) {
        const { data: boostedData, error: boostedError } = await supabase
          .from('products')
          .select(`*, profiles:seller_id (account_type, boutique_name, is_verified, phone_number, whatsapp_number)`)
          .eq('is_boosted', true)
          .order('created_at', { ascending: false })
          .limit(10);
        if (!boostedError && boostedData && boostedData.length > 0) {
          // Filtre local de sécurité supplémentaire
          const now = new Date();
          const activeBoosted = boostedData.filter(p => !p.boost_end_date || new Date(p.boost_end_date) > now);
          setBoostedProducts(activeBoosted);
        } else {
          setBoostedProducts([]);
        }
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:seller_id (account_type, boutique_name, is_verified, phone_number, whatsapp_number)
        `)
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
      {/* Search Bar */}
      <section style={{ padding: '0 16px', marginTop: '1rem', marginBottom: '1rem', maxWidth: '1200px', margin: '1rem auto' }}>
        <form onSubmit={(e) => {
          e.preventDefault();
          const q = e.target.search.value;
          if (q.trim()) navigate(`/explore?q=${encodeURIComponent(q.trim())}`);
        }} className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F8FAFC', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ position: 'absolute', left: '16px', color: '#94A3B8', display: 'flex', pointerEvents: 'none' }}>
            <Search size={20} strokeWidth={2} />
          </div>
          <input 
            type="text" 
            name="search"
            placeholder="Lan nga bëgg wut ? (téléphones, voitures, habits...)" 
            style={{ flex: 1, padding: '16px 16px 16px 44px', border: 'none', background: 'transparent', fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} 
          />
          <button type="submit" className="active-scale" style={{ flexShrink: 0, background: 'var(--primary)', color: 'white', border: 'none', padding: '16px 20px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', height: '100%', whiteSpace: 'nowrap' }}>
            Wër 🔍
          </button>
        </form>
      </section>

      {/* Hero Banners Section */}
      <section style={{ marginBottom: '1.5rem', marginTop: '0.5rem', padding: '0 16px', maxWidth: '1200px', margin: '0.5rem auto 1.5rem auto' }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', height: '160px' }}>
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              display: 'flex',
              transform: `translateX(-${activeBanner * 100}%)`,
              transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
              height: '100%',
              width: '100%'
            }}
          >
            
            {/* Banner 1 — Localisation Premium */}
            <div style={{
              flex: '0 0 100%',
              width: '100%',
              height: '100%',
              position: 'relative',
              background: 'linear-gradient(135deg, #fff5f5 0%, #fff0f0 40%, #ffe4e6 100%)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              gap: '16px',
              border: '1px solid rgba(190,18,60,0.08)',
              boxSizing: 'border-box'
            }}>
              {/* Cercles décoratifs */}
              <div style={{ position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(190,18,60,0.05)', top: '-60px', left: '-40px' }} />
              <div style={{ position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(190,18,60,0.06)', bottom: '-30px', right: '20px' }} />

              {/* Icône pin 3D */}
              <div style={{ flexShrink: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Ombre / ring */}
                  <ellipse cx="32" cy="68" rx="16" ry="4" fill="#be123c" opacity="0.2"/>
                  {/* Corps du pin */}
                  <path d="M32 2C20.95 2 12 10.95 12 22C12 36.5 32 62 32 62C32 62 52 36.5 52 22C52 10.95 43.05 2 32 2Z" fill="url(#pinGrad)"/>
                  {/* Trou blanc */}
                  <circle cx="32" cy="22" r="9" fill="white"/>
                  {/* Reflet */}
                  <ellipse cx="26" cy="16" rx="5" ry="3.5" fill="white" opacity="0.3" transform="rotate(-25 26 16)"/>
                  <defs>
                    <radialGradient id="pinGrad" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#f43f5e"/>
                      <stop offset="100%" stopColor="#9f1239"/>
                    </radialGradient>
                  </defs>
                </svg>
              </div>

              {/* Texte */}
              <div style={{ flex: 1, zIndex: 1 }}>
                <p style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🇸🇳 Am na fi yépp
                </p>
                <h2 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: '800', lineHeight: '1.3', margin: '0 0 8px' }}>
                  Wut ay articles<br/>lu jege sa kër
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0, lineHeight: '1.4' }}>
                  Dakar · Thiès · Saint-Louis · Touba…
                </p>
              </div>
            </div>

            {/* Banner 2 */}
            <div style={{
              flex: '0 0 100%',
              width: '100%',
              height: '160px',
              overflow: 'hidden',
              position: 'relative',
              background: 'var(--primary)',
              boxSizing: 'border-box'
            }}>
              <img src="/hero-bg.jpg" alt="Colobane Market Promotion 2" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)', zIndex: 2 }}></div>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px', boxSizing: 'border-box' }}>
                <h1 style={{ color: 'white', fontSize: '1.4rem', fontWeight: '800', lineHeight: '1.3', textShadow: '0 2px 4px rgba(0,0,0,0.5)', margin: 0 }}>
                  Jaay ak Jënd,<br/>mu yomb lool.
                </h1>
              </div>
            </div>

            {/* Banner 3 — Créer boutique */}
            <div 
              onClick={() => navigate('/create-boutique')}
              style={{
                flex: '0 0 100%',
                width: '100%',
                height: '100%',
                position: 'relative',
                background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 40%, #e9d5ff 100%)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: '16px',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              {/* Cercles décoratifs */}
              <div style={{ position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(217,70,239,0.05)', top: '-60px', left: '-40px' }} />
              <div style={{ position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(217,70,239,0.06)', bottom: '-30px', right: '20px' }} />

              {/* Icône boutique 3D */}
              <div style={{ flexShrink: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="32" cy="58" rx="20" ry="4" fill="#a21caf" opacity="0.15"/>
                  <path d="M10 28 L32 10 L54 28 Z" fill="url(#roofGrad)"/>
                  <path d="M8 28 L56 28 L48 38 L16 38 Z" fill="#d946ef"/>
                  <path d="M16 28 L24 28 L20 38 L16 38 Z" fill="#fdf4ff"/>
                  <path d="M32 28 L40 28 L36 38 L32 38 Z" fill="#fdf4ff"/>
                  <path d="M14 38 H50 V56 H14 Z" fill="url(#storeGrad)"/>
                  <path d="M26 44 H38 V56 H26 Z" fill="white"/>
                  <defs>
                    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6"/>
                      <stop offset="100%" stopColor="#be185d"/>
                    </linearGradient>
                    <linearGradient id="storeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fae8ff"/>
                      <stop offset="100%" stopColor="#e879f9"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Texte */}
              <div style={{ flex: 1, zIndex: 1 }}>
                <p style={{ color: '#a21caf', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🏪 Tambalil léegi
                </p>
                <h2 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: '800', lineHeight: '1.3', margin: '0 0 8px' }}>
                  Ubbi sa boutique,<br/>jaay sa bagage!
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0, lineHeight: '1.4' }}>
                  Yomb na lool te amul frais.
                </p>
              </div>
            </div>

          </div>

          {/* Indicateurs (dots) */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            zIndex: 10
          }}>
            <button 
              onClick={() => setActiveBanner(0)}
              style={{
                width: activeBanner === 0 ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: activeBanner === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            />
            <button 
              onClick={() => setActiveBanner(1)}
              style={{
                width: activeBanner === 1 ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: activeBanner === 1 ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            />
            <button 
              onClick={() => setActiveBanner(2)}
              style={{
                width: activeBanner === 2 ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: activeBanner === 2 ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        </div>
      </section>

      {/* Categories Grid (CoinAfrique Style) */}
      <section style={{ marginBottom: '1.5rem', padding: '0 16px', maxWidth: '1200px', margin: '0 auto 1.5rem auto', position: 'relative' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem' }}>Que recherchez-vous ?</h2>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {/* Bouton Gauche */}
          <button 
            onClick={() => scroll('left')}
            className="touch-target active-scale"
            style={{
              position: 'absolute',
              left: '-10px',
              zIndex: 10,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              opacity: showLeftArrow ? 1 : 0,
              pointerEvents: showLeftArrow ? 'auto' : 'none',
              transition: 'opacity 0.2s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          {/* Container défilant */}
          <div 
            ref={categoriesRef}
            onScroll={handleScroll}
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '12px',
              padding: '4px 10px',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >


            {/* Boutiques */}
            <button 
              onClick={() => navigate(`/boutiques`)} 
              className="touch-target active-scale" 
              style={{
                flex: '0 0 80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '18px', 
                background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                border: '1.5px solid rgba(255,255,255,0.2)'
              }}>
                <Store size={28} strokeWidth={2} />
              </div>
              <span className="text-muted-small" style={{ fontWeight: '800', color: 'var(--text-main)', textAlign: 'center', lineHeight: '1.2', fontSize: '10.5px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Voir Boutiques
              </span>
            </button>

            {/* Catégories de categories.jsx */}
            {categories.map(cat => {
              const isActive = activeCategorySlide === cat.id;
              return (
                <button 
                  key={cat.id} 
                  onClick={() => {
                    if (isActive) setActiveCategorySlide(null);
                    else setActiveCategorySlide(cat.id);
                  }} 
                  className="touch-target active-scale" 
                  style={{
                    flex: '0 0 80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: isActive ? cat.color : `${cat.color}15`, color: isActive ? 'white' : cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    {cat.icon}
                  </div>
                  <span className="text-muted-small" style={{ fontWeight: isActive ? '700' : '500', color: isActive ? 'var(--primary)' : 'var(--text-main)', textAlign: 'center', lineHeight: '1.2', fontSize: '11px', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '26px' }}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bouton Droite */}
          <button 
            onClick={() => scroll('right')}
            className="touch-target active-scale"
            style={{
              position: 'absolute',
              right: '-10px',
              zIndex: 10,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              opacity: showRightArrow ? 1 : 0,
              pointerEvents: showRightArrow ? 'auto' : 'none',
              transition: 'opacity 0.2s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </section>

      {/* Sliding Subcategories */}
      {activeCategorySlide && (() => {
        const subcategoriesField = categories.find(c => c.id === activeCategorySlide)?.fields?.find(f => f.type === 'select' && ['type', 'property_type', 'service_type', 'species', 'sector', 'contract_type', 'brand'].includes(f.name));
        const subcategories = subcategoriesField?.options ? subcategoriesField.options.filter(o => o !== 'Autre') : [];
        
        return (
          <div ref={subcategoriesRef} style={{ animation: 'slideDown 0.3s ease-out', margin: '0 16px 1.5rem 16px', padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>Sous-catégories</span>
              <button onClick={() => navigate(`/category/${activeCategorySlide}`)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>Tout voir</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              {subcategories.length > 0 ? subcategories.map(opt => (
                <button key={opt} onClick={() => navigate(`/explore?category=${activeCategorySlide}&subcategory=${encodeURIComponent(opt)}`)} className="active-scale touch-target" style={{ flexShrink: 0, padding: '8px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  {opt}
                </button>
              )) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune sous-catégorie</span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Promo Banner - Design Premium */}
      {showPromoBanner && (
        <section style={{
          margin: '0 16px 1.5rem 16px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(138, 28, 28, 0.25)',
          position: 'relative',
          background: 'linear-gradient(135deg, #8A1C1C 0%, #C0392B 50%, #8A1C1C 100%)',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

          {/* Close button */}
          <button
            onClick={() => {
              setShowPromoBanner(false);
              try {
                localStorage.setItem('hidePromoBanner', 'true');
              } catch (e) {}
            }}
            style={{
              position: 'absolute', top: '14px', right: '14px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%', width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '13px', fontWeight: '700',
              lineHeight: 1, zIndex: 2,
            }}
            className="active-scale"
          >✕</button>

          <div style={{ padding: '22px 24px 20px 24px', position: 'relative', zIndex: 1 }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', flexShrink: 0,
              }}>📣</div>
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>ColobaneMarket</p>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'white', lineHeight: 1.2 }}>Besoin d'informations ?</h3>
              </div>
            </div>

            {/* Body text */}
            <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.92)', fontWeight: '400' }}>
              Pour toutes questions concernant nos <strong style={{ color: 'white' }}>offres</strong> ou toutes autres informations, contactez-nous directement :
            </p>

            {/* Phone numbers pills */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <a href="tel:+221773713175" style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '30px', padding: '8px 16px',
                color: 'white', textDecoration: 'none',
                fontSize: '0.88rem', fontWeight: '700',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'background 0.2s',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.1a16 16 0 0 0 5.61 5.61l.76-.76a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                77 371 31 75
              </a>
              <a href="tel:+221777671120" style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '30px', padding: '8px 16px',
                color: 'white', textDecoration: 'none',
                fontSize: '0.88rem', fontWeight: '700',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.1a16 16 0 0 0 5.61 5.61l.76-.76a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                77 767 11 20
              </a>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', marginBottom: '18px' }} />

            {/* CTA Button */}
            <button
              onClick={() => navigate('/subscription')}
              style={{
                width: '100%',
                background: 'white',
                color: 'var(--primary)',
                border: 'none',
                borderRadius: '12px',
                padding: '13px 20px',
                fontSize: '0.92rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                letterSpacing: '0.3px',
              }}
              className="active-scale touch-target"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
              Découvrir nos offres
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </section>
      )}

      {/* Bande Top Annonces */}
      {boostedProducts.length > 0 && (
        <section style={{ marginBottom: '1.5rem', maxWidth: '1200px', margin: '0 auto 1.5rem auto' }}>
          {/* Header de la bande */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #C0392B 100%)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '16px 16px 0 0',
            marginLeft: '16px',
            marginRight: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🏆</span>
              <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Top Annonces
              </span>
            </div>
            <button
              onClick={() => navigate('/explore?boosted=true')}
              style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', fontWeight: '700', fontSize: '0.78rem', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
            >
              Voir tout →
            </button>
          </div>

          {/* Cartes scrollables */}
          <div style={{
            background: '#fffbeb',
            borderLeft: '1px solid #fde68a',
            borderRight: '1px solid #fde68a',
            borderBottom: '1px solid #fde68a',
            borderRadius: '0 0 16px 16px',
            marginLeft: '16px',
            marginRight: '16px',
            padding: '12px 12px 12px 12px',
          }}>
            <div style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '12px',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }}>
              {boostedProducts.map(product => {
                const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/hero.png';
                return (
                  <div
                    key={`boosted-${product.id}`}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="sponsored-card active-scale touch-target"
                    style={{
                      flex: '0 0 150px',
                      scrollSnapAlign: 'start',
                      cursor: 'pointer',
                      background: 'white',
                      border: '1.5px solid #fde68a',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 12px rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Image */}
                    <div style={{ height: '130px', position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={imageUrl}
                        alt={product.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* Badge Top */}
                      <span style={{
                        position: 'absolute',
                        top: '7px',
                        left: '7px',
                        background: 'linear-gradient(135deg, var(--primary), #C0392B)',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 6px rgba(138,28,28,0.4)',
                        textTransform: 'uppercase',
                      }}>
                        🏆 TOP
                      </span>
                    </div>
                    {/* Infos */}
                    <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <p style={{
                        fontSize: '11.5px',
                        fontWeight: '600',
                        margin: '0 0 5px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        color: '#1e293b',
                        lineHeight: '1.4',
                      }}>
                        {product.title}
                      </p>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#92400e', marginBottom: 'auto' }}>
                        {(product.price || 0).toLocaleString('fr-FR')} FCFA
                      </div>
                      {product.location && (
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          📍 {product.location}
                        </div>
                      )}
                    </div>
                    {/* Bouton Contacter */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        let whatsappNum = product.profiles?.whatsapp_number || product.profiles?.phone_number || '';
                        if (whatsappNum) {
                          whatsappNum = whatsappNum.replace(/\D/g, '');
                          if (whatsappNum.length === 9) {
                            whatsappNum = '221' + whatsappNum;
                          }
                          const msg = encodeURIComponent(`Bonjour, je suis intéressé par votre article "${product.title}" sur Colobane Market.`);
                          window.open(`https://wa.me/${whatsappNum}?text=${msg}`, '_blank');
                        } else {
                          toast.error("Le vendeur n'a pas renseigné de numéro de téléphone.");
                        }
                      }}
                      style={{ background: '#e30b3b', color: 'white', padding: '6px', textAlign: 'center', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    >
                      <Store size={14} /> CONTACTER
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Annonces Récentes */}
      <section className="section-container" style={{ margin: '0', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '22px', background: 'linear-gradient(180deg, var(--primary), #C0392B)', borderRadius: '4px' }} />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Annonces récentes</h2>
          </div>
          <button
            onClick={() => navigate('/explore')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Voir tout <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <div className="grid grid-cols-2">
          {products.map((product) => {
            const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/hero.png';
            const condition = product.condition || (product.metadata && product.metadata.condition) || 'Occasion';

            return (
              <div key={product.id} onClick={() => navigate(`/product/${product.id}`)} className="product-card active-scale" style={{ cursor: 'pointer', border: '1px solid transparent', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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

                  {/* Condition Badge Pill */}
                  <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(255,255,255,0.9)', color: 'var(--text-main)', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: 'var(--radius-pill)', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                    {condition}
                  </span>
                  
                  {/* Favorite button */}
                  <FavoriteButton 
                    productId={product.id} 
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', zIndex: 10 }} 
                  />
                </div>

                {/* Details */}
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.4', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-main)' }}>
                    {product.title}
                  </h3>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: 'auto' }}>
                    {(product.price || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontSize: '11px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px', color: 'var(--text-muted)' }}>{product.profiles?.boutique_name || product.profiles?.full_name || 'Vendeur'}</span>
                    <span>•</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.location || 'Dakar'}</span>
                  </div>
                </div>
                {/* Bouton WhatsApp */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    let whatsappNum = product.profiles?.whatsapp_number || product.profiles?.phone_number || '';
                    if (whatsappNum) {
                      whatsappNum = whatsappNum.replace(/\D/g, '');
                      if (whatsappNum.length === 9) {
                        whatsappNum = '221' + whatsappNum;
                      }
                      const msg = encodeURIComponent(`Bonjour, je suis intéressé par votre article "${product.title}" sur Colobane Market.`);
                      window.open(`https://wa.me/${whatsappNum}?text=${msg}`, '_blank');
                    } else {
                      toast.error("Le vendeur n'a pas renseigné de numéro de téléphone.");
                    }
                  }}
                  style={{ background: '#25D366', color: 'white', padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> WHATSAPP
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
