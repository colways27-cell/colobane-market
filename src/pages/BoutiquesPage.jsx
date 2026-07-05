import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Star } from 'lucide-react';

const BoutiquesPage = () => {
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(true);

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
          const { data: reviewsData } = await supabase
            .from('boutique_reviews')
            .select('boutique_id, rating')
            .in('boutique_id', boutiqueIds);

          if (reviewsData) {
            profiles.forEach(p => {
              const bReviews = reviewsData.filter(r => r.boutique_id === p.id);
              if (bReviews.length > 0) {
                p.avgRating = (bReviews.reduce((acc, r) => acc + r.rating, 0) / bReviews.length).toFixed(1);
                p.reviewCount = bReviews.length;
              } else {
                p.avgRating = 0;
                p.reviewCount = 0;
              }
            });
          }
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

  return (
    <div className="section-container" style={{ minHeight: '60vh' }}>
      {/* Dynamic Hero Section */}
      <div className="animate-fade-in-up" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #a0203a 100%)', borderRadius: '24px', padding: '3rem 2rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'white', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(190, 18, 60, 0.2)' }}>
        {/* Subtle background glow */}
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(50px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-50%', right: '-10%', width: '300px', height: '300px', background: 'rgba(0,0,0,0.2)', borderRadius: '50%', filter: 'blur(50px)' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 1rem 0', fontFamily: 'var(--font-heading)', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Nos Boutiques Partenaires</h1>
          <p style={{ margin: '0 0 2rem 0', opacity: 0.9, fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.6' }}>Découvrez les meilleures entreprises et revendeurs professionnels certifiés sur ColobaneMarket.</p>
          <Link to="/create-boutique" className="glass-button active-scale touch-target hover-lift" style={{ display: 'inline-block', padding: '1rem 2rem', borderRadius: '16px', fontWeight: '800', textDecoration: 'none', color: 'white', fontSize: '1.05rem' }}>
            Ouvrir ma propre vitrine ✨
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : boutiques.length === 0 ? (
        <div className="animate-fade-in-up stagger-1 glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '24px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏪</div>
          <h3 style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--text-main)' }}>Aucune boutique pour le moment.</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.05rem' }}>Devenez la première boutique officielle de la plateforme !</p>
          <Link to="/create-boutique" className="btn-primary mt-4" style={{ marginTop: '1.5rem' }}>Créer ma boutique</Link>
        </div>
      ) : (
        <>
          {/* Section Boutiques Vérifiées */}
          {boutiques.filter(b => b.is_verified).length > 0 && (
            <div style={{ marginBottom: '4rem' }}>
              <div className="animate-fade-in-up stagger-1" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', color: 'white', padding: '10px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)' }}>
                  <BadgeCheck size={26} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, fontFamily: 'var(--font-heading)', color: '#0F172A' }}>Boutiques Certifiées</h2>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Vendeurs de confiance vérifiés par ColobaneMarket</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {boutiques.filter(b => b.is_verified).map((boutique, index) => (
                  <Link to={`/boutique/${boutique.id}`} key={boutique.id} className={`animate-fade-in-up stagger-${(index % 4) + 1} hover-lift`} style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: '20px', border: '2px solid #BAE6FD', display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.08)' }}>
                    <div style={{ height: '140px', background: 'var(--primary-light)', backgroundImage: `url(${boutique.banner_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                      <div className="glass-panel" style={{ position: 'absolute', top: '12px', right: '12px', color: '#0284C7', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(2,132,199,0.2)', background: 'rgba(255,255,255,0.85)' }}>
                        <BadgeCheck size={14} strokeWidth={3} /> CERTIFIÉ
                      </div>
                    </div>
                    <div style={{ padding: '0 1.5rem 1.5rem', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        width: '84px', height: '84px', borderRadius: '24px', background: 'white', 
                        position: 'absolute', top: '-42px', left: '1.5rem', border: '4px solid white',
                        backgroundImage: `url(${boutique.avatar_url || 'https://placehold.co/100x100?text=Logo'})`,
                        backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transform: 'rotate(-2deg)'
                      }}></div>
                      <h3 style={{ marginTop: '3.5rem', fontSize: '1.3rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                        {boutique.boutique_name || boutique.full_name || 'Boutique Pro'}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5', flex: 1 }}>
                        {boutique.boutique_description || 'Découvrez nos articles et nouveautés exclusives.'}
                      </p>
                      <div style={{ marginTop: '1.2rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '6px 10px', background: '#F1F5F9', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} color="#64748B" /> {boutique.location || 'Sénégal'}</span>
                        {boutique.avgRating > 0 && (
                          <span style={{ padding: '6px 10px', background: '#FEF3C7', color: '#B45309', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={14} fill="currentColor" color="#F59E0B" /> {boutique.avgRating} ({boutique.reviewCount})
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: '1.5rem', width: '100%' }}>
                        <div className="active-scale" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(190, 18, 60, 0.15)' }}>
                          Voir Articles
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Section Autres Boutiques */}
          {boutiques.filter(b => !b.is_verified).length > 0 && (
            <div>
              <h2 className="animate-fade-in-up stagger-2" style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                Toutes les boutiques
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {boutiques.filter(b => !b.is_verified).map((boutique, index) => (
                  <Link to={`/boutique/${boutique.id}`} key={boutique.id} className={`animate-fade-in-up stagger-${(index % 4) + 1} hover-lift glass-panel`} style={{ padding: 0, overflow: 'hidden', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ height: '140px', background: 'var(--primary-light)', backgroundImage: `url(${boutique.banner_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    </div>
                    <div style={{ padding: '0 1.5rem 1.5rem', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        width: '84px', height: '84px', borderRadius: '50%', background: 'white', 
                        position: 'absolute', top: '-42px', left: '1.5rem', border: '4px solid white',
                        backgroundImage: `url(${boutique.avatar_url || 'https://placehold.co/100x100?text=Logo'})`,
                        backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}></div>
                      <h3 style={{ marginTop: '3.5rem', fontSize: '1.3rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                        {boutique.boutique_name || boutique.full_name || 'Boutique Pro'}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5', flex: 1 }}>
                        {boutique.boutique_description || 'Découvrez nos articles et nouveautés exclusives.'}
                      </p>
                      <div style={{ marginTop: '1.2rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '6px 10px', background: '#F1F5F9', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} color="#64748B" /> {boutique.location || 'Sénégal'}</span>
                        {boutique.avgRating > 0 && (
                          <span style={{ padding: '6px 10px', background: '#FEF3C7', color: '#B45309', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={14} fill="currentColor" color="#F59E0B" /> {boutique.avgRating} ({boutique.reviewCount})
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: '1.5rem', width: '100%' }}>
                        <div className="active-scale" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(190, 18, 60, 0.15)' }}>
                          Voir Articles
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BoutiquesPage;
