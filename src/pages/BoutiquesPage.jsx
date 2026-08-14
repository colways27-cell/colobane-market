import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Star, Search, Store, ShoppingBag, ArrowRight, Phone, Filter, MessageCircle } from 'lucide-react';
import { senegalRegions } from '../data/locations';
import { isBoutiqueExpired } from '../utils/boutiqueHelpers';
import SocialSEO from '../components/SocialSEO';

const BoutiquesPage = () => {
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all', 'verified'

  useEffect(() => {
    const fetchBoutiques = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('account_type', 'boutique');
          
        if (error) throw error;

        if (profiles && profiles.length > 0) {
          const boutiqueIds = profiles.map(p => p.id);
          
          // Fetch reviews and products count in parallel
          const [{ data: reviewsData }, ...productCounts] = await Promise.all([
            supabase.from('boutique_reviews').select('boutique_id, rating').in('boutique_id', boutiqueIds),
            ...boutiqueIds.map(async (id) => {
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('seller_id', id)
                .neq('category', 'reels_express');
              return { id, count: count || 0 };
            })
          ]);
          
          const productCountMap = productCounts.reduce((acc, curr) => {
            acc[curr.id] = curr.count;
            return acc;
          }, {});

          profiles.forEach(p => {
            // Reviews & rating
            if (reviewsData) {
              const bReviews = reviewsData.filter(r => r.boutique_id === p.id);
              if (bReviews.length > 0) {
                p.avgRating = (bReviews.reduce((acc, r) => acc + r.rating, 0) / bReviews.length).toFixed(1);
                p.reviewCount = bReviews.length;
              } else {
                p.avgRating = 0;
                p.reviewCount = 0;
              }
            }
            // Product count
            p.productCount = productCountMap[p.id] || 0;
          });
        }
        
        setBoutiques(profiles || []);
      } catch (err) {
        console.error('Error fetching boutiques:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoutiques();
  }, []);

  const filteredBoutiques = boutiques.filter(b => {
    if (isBoutiqueExpired(b)) return false;

    const nameMatch = (b.boutique_name || b.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (b.boutique_description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const locationMatch = (b.location || b.region || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || descMatch || locationMatch;

    const matchesRegion = selectedRegion === 'all' || (b.region || b.location || '').toLowerCase().includes(selectedRegion.toLowerCase());
    const matchesFilter = filterType === 'all' || (filterType === 'verified' && b.is_verified);

    return matchesSearch && matchesRegion && matchesFilter;
  });

  const verifiedCount = boutiques.filter(b => b.is_verified).length;

  return (
    <div className="section-container" style={{ minHeight: '80vh', paddingBottom: '4rem' }}>
      <SocialSEO title="Toutes les boutiques - Colobane Market" description="Découvrez toutes les boutiques..." />
      
      {/* Premium Hero Banner */}
      <div className="animate-fade-in-up" style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #831843 100%)', 
        borderRadius: '28px', 
        padding: '3.5rem 2rem', 
        marginBottom: '2.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem', 
        color: 'white', 
        alignItems: 'center', 
        textAlign: 'center', 
        position: 'relative', 
        overflow: 'hidden', 
        boxShadow: '0 24px 50px rgba(15, 23, 42, 0.25)' 
      }}>
        <div style={{ position: 'absolute', top: '-40%', left: '-10%', width: '350px', height: '350px', background: 'rgba(244, 63, 94, 0.25)', borderRadius: '50%', filter: 'blur(70px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-40%', right: '-10%', width: '350px', height: '350px', background: 'rgba(56, 189, 248, 0.2)', borderRadius: '50%', filter: 'blur(70px)' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(12px)', padding: '8px 18px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: '700', marginBottom: '1.2rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span>🏪</span> Vitrines Électroniques & Vendeurs Pro
          </div>
          <h1 style={{ fontSize: '2.6rem', fontWeight: '900', margin: '0 0 1rem 0', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
            Explorez les Meilleures Boutiques du Sénégal
          </h1>
          <p style={{ margin: '0 0 2rem 0', opacity: 0.9, fontSize: '1.15rem', lineHeight: '1.6', fontWeight: '400' }}>
            Achetez directement auprès de revendeurs certifiés avec stock garanti, livraison rapide et service client dédié.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/create-boutique" className="active-scale hover-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '1rem 2.2rem', borderRadius: '18px', fontWeight: '800', textDecoration: 'none', background: 'var(--primary-gradient)', color: 'white', fontSize: '1.05rem', boxShadow: '0 10px 30px rgba(244,63,94,0.4)' }}>
              <Store size={20} /> Ouvrir ma boutique
            </Link>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="animate-fade-in-up stagger-1 glass-panel" style={{ 
        padding: '1.2rem 1.5rem', 
        borderRadius: '24px', 
        marginBottom: '2.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 12px 35px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Search Box */}
          <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '0 1rem' }}>
            <Search size={20} color="#64748B" />
            <input 
              type="text" 
              placeholder="Rechercher une boutique par nom, quartier..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '600' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', fontWeight: '800' }}>✕</button>
            )}
          </div>

          {/* Region Select */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '0 1rem', flex: '0 1 200px' }}>
            <Filter size={18} color="#64748B" style={{ marginRight: '6px' }} />
            <select 
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              style={{ width: '100%', padding: '0.9rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer' }}
            >
              <option value="all">Toutes les régions</option>
              {Object.keys(senegalRegions).map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setFilterType('all')}
              className="active-scale"
              style={{
                padding: '0.8rem 1.2rem',
                borderRadius: '14px',
                border: filterType === 'all' ? 'none' : '1px solid #E2E8F0',
                background: filterType === 'all' ? '#0F172A' : 'white',
                color: filterType === 'all' ? 'white' : 'var(--text-main)',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Toutes ({boutiques.length})
            </button>
            
            <button 
              onClick={() => setFilterType('verified')}
              className="active-scale"
              style={{
                padding: '0.8rem 1.2rem',
                borderRadius: '14px',
                border: filterType === 'verified' ? 'none' : '1px solid #BAE6FD',
                background: filterType === 'verified' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#F0F9FF',
                color: filterType === 'verified' ? 'white' : '#0284C7',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <BadgeCheck size={16} /> Certifiées ({verifiedCount})
            </button>
          </div>

        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '6rem 2rem', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #F1F5F9', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Chargement des boutiques en cours...</p>
        </div>
      ) : filteredBoutiques.length === 0 ? (
        <div className="animate-fade-in-up stagger-1 glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: '28px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ fontWeight: '800', fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Aucune boutique trouvée</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Aucun résultat ne correspond à vos critères de recherche. Essayez de réinitialiser vos filtres ou créez votre propre boutique.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedRegion('all'); setFilterType('all'); }}
              className="glass-button active-scale"
              style={{ padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: '700' }}
            >
              Réinitialiser les filtres
            </button>
            <Link to="/create-boutique" className="btn-primary active-scale" style={{ padding: '0.8rem 1.5rem', borderRadius: '14px' }}>
              Créer ma boutique
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '2rem' }}>
          {filteredBoutiques.map((boutique, index) => {
            const boutiqueTitle = boutique.boutique_name || boutique.full_name || 'Boutique Pro';
            const initial = boutiqueTitle.charAt(0).toUpperCase();

            return (
              <div 
                key={boutique.id} 
                className={`animate-fade-in-up stagger-${(index % 4) + 1} hover-lift`}
                style={{ 
                  background: 'white', 
                  borderRadius: '24px', 
                  border: boutique.is_verified ? '2px solid #7DD3FC' : '1px solid var(--border-color)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden',
                  boxShadow: boutique.is_verified ? '0 12px 30px rgba(2, 132, 199, 0.1)' : '0 8px 24px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  position: 'relative'
                }}
              >
                {/* Banner / Cover */}
                <div style={{ 
                  height: '140px', 
                  background: boutique.banner_url ? `url(${boutique.banner_url}) center/cover no-repeat` : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
                  position: 'relative' 
                }}>
                  {/* Badge Certification Header */}
                  {boutique.is_verified ? (
                    <div style={{ 
                      position: 'absolute', top: '12px', right: '12px', 
                      background: 'rgba(255, 255, 255, 0.95)', color: '#0284C7', 
                      padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem', 
                      fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)'
                    }}>
                      <BadgeCheck size={16} strokeWidth={2.8} /> CERTIFIÉ
                    </div>
                  ) : (
                    <div style={{ 
                      position: 'absolute', top: '12px', right: '12px', 
                      background: 'rgba(15, 23, 42, 0.75)', color: 'white', 
                      padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', 
                      fontWeight: '700', backdropFilter: 'blur(8px)'
                    }}>
                      VITRINE PRO
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div style={{ padding: '0 1.5rem 1.5rem', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Avatar / Logo */}
                  <div style={{ 
                    width: '80px', height: '80px', borderRadius: '22px', 
                    background: '#F8FAFC', position: 'absolute', top: '-40px', left: '1.5rem', 
                    border: '4px solid white', overflow: 'hidden',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {boutique.avatar_url ? (
                      <img src={boutique.avatar_url} alt={boutiqueTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ 
                        width: '100%', height: '100%', 
                        background: 'linear-gradient(135deg, var(--primary) 0%, #a0203a 100%)', 
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '2rem', fontWeight: '900', fontFamily: 'var(--font-heading)' 
                      }}>
                        {initial}
                      </div>
                    )}
                  </div>

                  {/* Boutique Header details */}
                  <div style={{ marginTop: '3.2rem' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: '1.3' }}>
                      {boutiqueTitle}
                    </h3>
                    
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5', minHeight: '2.8em' }}>
                      {boutique.boutique_description || 'Vitrine officielle sur ColobaneMarket. Retrouvez tous nos produits et articles garantis.'}
                    </p>
                  </div>

                  {/* Info Tags */}
                  <div style={{ marginTop: '1.2rem', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ padding: '6px 12px', background: '#F1F5F9', color: '#475569', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} color="#64748B" /> {boutique.location || boutique.region || 'Sénégal'}
                    </span>

                    <span style={{ padding: '6px 12px', background: '#FDF2F8', color: '#BE123C', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <ShoppingBag size={14} color="#BE123C" /> {boutique.productCount} articles
                    </span>

                    {boutique.avgRating > 0 && (
                      <span style={{ padding: '6px 12px', background: '#FEF3C7', color: '#B45309', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} fill="#F59E0B" color="#F59E0B" /> {boutique.avgRating} ({boutique.reviewCount})
                      </span>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Link 
                      to={`/boutique/${boutique.id}`} 
                      className="active-scale hover-lift" 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        background: 'var(--primary-gradient)', 
                        color: 'white', 
                        padding: '12px', 
                        borderRadius: '14px', 
                        fontWeight: '800', 
                        fontSize: '0.92rem', 
                        textDecoration: 'none',
                        boxShadow: '0 6px 18px rgba(190, 18, 60, 0.2)'
                      }}
                    >
                      Visiter la vitrine <ArrowRight size={16} />
                    </Link>

                    {(boutique.whatsapp_number || boutique.phone_number) && (
                      <a 
                        href={`https://wa.me/${(boutique.whatsapp_number || boutique.phone_number).replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="active-scale hover-lift"
                        title="Contacter sur WhatsApp"
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '14px',
                          background: '#25D366',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
                        }}
                      >
                        <MessageCircle size={18} />
                      </a>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default BoutiquesPage;
