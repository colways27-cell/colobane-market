import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isProductPage = currentPath.startsWith('/product/');
  const [showMore, setShowMore] = useState(false);

  if (isProductPage) return null;

  const go = (path) => { navigate(path); setShowMore(false); };

  const sections = [
    {
      title: 'À propos',
      icon: 'ℹ️',
      items: [
        { label: 'Qui sommes-nous ?', action: () => go('/a-propos') },
        { label: 'Nos Offres', action: () => go('/subscription') },
        { label: 'Contact', action: () => { window.location.href = 'tel:+221773713175'; setShowMore(false); } },
        { label: 'Conditions Générales', action: () => go('/conditions-generales') },
        { label: 'Politique de confidentialité', action: () => go('/politique-confidentialite') },
      ],
    },
  ];

  return (
    <>
      {/* Overlay */}
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
            animation: 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      {/* Drawer */}
      {showMore && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          left: '0',
          right: '0',
          maxHeight: '82vh',
          background: 'var(--card-bg)',
          borderRadius: '24px 24px 0 0',
          zIndex: 999,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'hidden',
        }}>
          {/* Handle bar */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '4px', background: 'var(--border)' }} />
          </div>

          {/* Header */}
          <div style={{
            padding: '10px 20px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), #C0392B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏪</div>
              <div>
                <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>ColobaneMarket</p>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>Menu</h3>
              </div>
            </div>
            <button
              onClick={() => setShowMore(false)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: '14px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >✕</button>
          </div>

          {/* Scrollable content */}
          <div style={{ overflowY: 'auto', padding: '8px 0 20px', flex: 1, scrollbarWidth: 'none' }}>
            {sections.map((section, si) => (
              <div key={si} style={{ marginBottom: '4px' }}>
                {/* Section title */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '14px 20px 8px',
                }}>
                  <span style={{ fontSize: '16px' }}>{section.icon}</span>
                  <span style={{
                    fontSize: '0.82rem', fontWeight: '800',
                    color: 'var(--text-main)', textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}>{section.title}</span>
                </div>

                {/* Items */}
                {section.items.map((item, ii) => (
                  <button
                    key={ii}
                    onClick={item.action}
                    className="active-scale"
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent', border: 'none',
                      padding: '13px 20px',
                      cursor: 'pointer', textAlign: 'left',
                      borderBottom: ii < section.items.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '0.93rem', color: 'var(--text-main)', fontWeight: '500' }}>
                      {item.label}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                ))}

                {/* Séparateur entre sections */}
                {si < sections.length - 1 && (
                  <div style={{ height: '8px', background: 'var(--bg)', margin: '4px 0' }} />
                )}
              </div>
            ))}

            {/* Footer contact */}
            <div style={{ margin: '8px 16px 0', padding: '16px', background: 'linear-gradient(135deg, rgba(138,28,28,0.06), rgba(192,57,43,0.06))', borderRadius: '16px', border: '1px solid rgba(138,28,28,0.1)' }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Besoin d'aide ?</p>
              <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Notre équipe est disponible pour vous aider.</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a href="tel:+221773713175" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: 'white', borderRadius: '20px', padding: '7px 14px', fontSize: '0.82rem', fontWeight: '700', textDecoration: 'none' }}>
                  📞 77 371 31 75
                </a>
                <a href="tel:+221777671120" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: 'white', borderRadius: '20px', padding: '7px 14px', fontSize: '0.82rem', fontWeight: '700', textDecoration: 'none' }}>
                  📞 77 767 11 20
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de navigation */}
      <div className="bottom-nav">
        <Link to="/" className={`nav-item ${currentPath === '/' ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>Keur gui</span>
        </Link>

        <Link to="/favorites" className={`nav-item ${currentPath === '/favorites' ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span>Bëgg-Bëgg</span>
        </Link>

        <Link to="/publish" className="nav-item" style={{ position: 'relative' }}>
          <div className="nav-fab" style={{ background: 'var(--primary)', border: '4px solid white' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </div>
          <span style={{ position: 'absolute', bottom: '-4px', fontWeight: '800', color: 'var(--primary)' }}>Jaay</span>
        </Link>

        <Link to="/profile" className={`nav-item ${currentPath === '/profile' ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>Profil</span>
        </Link>

        <button
          onClick={() => setShowMore(!showMore)}
          className={`nav-item ${showMore ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
          <span>Infos+</span>
        </button>
      </div>
    </>
  );
};

export default BottomNav;
