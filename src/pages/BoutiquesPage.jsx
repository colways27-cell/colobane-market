import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

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
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Nos Boutiques Partenaires</h1>
        <p className="page-subtitle">Découvrez les meilleures entreprises et revendeurs professionnels sur ColobaneMarket</p>
      </div>

      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #a0203a 100%)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'white', alignItems: 'center', textAlign: 'center', boxShadow: '0 8px 20px rgba(139, 28, 49, 0.2)' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-heading)' }}>Vous êtes un professionnel ?</h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>Créez votre vitrine officielle et touchez des milliers de clients à travers le Sénégal.</p>
        </div>
        <Link to="/create-boutique" className="active-scale touch-target" style={{ background: 'white', color: 'var(--primary)', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: '800', textDecoration: 'none', display: 'inline-block', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Ouvrir ma boutique
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Chargement des boutiques...</div>
      ) : boutiques.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <h3 style={{ fontWeight: '800' }}>Aucune boutique pour le moment.</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Devenez la première boutique officielle de la plateforme !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {boutiques.map(boutique => (
            <Link to={`/boutique/${boutique.id}`} key={boutique.id} className="active-scale" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ height: '120px', background: 'var(--primary)', backgroundImage: `url(${boutique.banner_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              </div>
              <div style={{ padding: '1.5rem', position: 'relative' }}>
                <div style={{ 
                  width: '72px', height: '72px', borderRadius: '50%', background: 'white', 
                  position: 'absolute', top: '-36px', left: '1.5rem', border: '4px solid white',
                  backgroundImage: `url(${boutique.avatar_url || 'https://placehold.co/100x100?text=Logo'})`,
                  backgroundSize: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}></div>
                <h3 style={{ marginTop: '1.5rem', fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {boutique.boutique_name || boutique.full_name || 'Boutique Pro'}
                  {boutique.is_verified && <span style={{ color: '#007aff', marginLeft: '6px' }}>✓</span>}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                  {boutique.boutique_description || 'Découvrez nos articles et nouveautés exclusives.'}
                </p>
                <div style={{ marginTop: '1.2rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>📍 {boutique.location || 'Sénégal'}</span>
                  {boutique.avgRating > 0 && (
                    <span style={{ padding: '4px 8px', background: '#FEF3C7', color: '#B45309', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#F59E0B' }}>★</span> {boutique.avgRating} ({boutique.reviewCount} avis)
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoutiquesPage;
