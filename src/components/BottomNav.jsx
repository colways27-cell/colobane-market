import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import totemLapin from '../assets/totem-lapin.webp';

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isProductPage = currentPath.startsWith('/product/');

  const [theme, setTheme] = useState(() => {
    try { return document.documentElement.getAttribute('data-theme') || 'light'; } catch(e) { return 'light'; }
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const isDark = theme === 'dark';

  if (isProductPage) return null;

  return (
    <div className="bottom-nav" style={isDark ? {
      background: 'rgba(24, 24, 27, 0.94)',
      border: '1px solid rgba(51, 65, 85, 0.5)',
      boxShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 20px rgba(190,18,60,0.08)'
    } : undefined}>
      <Link to="/" className={`nav-item active-scale ${currentPath === '/' ? 'active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>Keur gui</span>
      </Link>

      <Link to="/reels" className={`nav-item active-scale ${currentPath === '/reels' ? 'active' : ''}`} style={{ color: currentPath === '/reels' ? '#E11D48' : 'inherit' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
          <span style={{ position: 'absolute', top: '-6px', right: '-12px', background: '#E11D48', color: '#FFF', fontSize: '9px', fontWeight: 800, padding: '2px 4px', borderRadius: '4px', letterSpacing: '0.5px' }}>PRO</span>
        </div>
        <span style={{ fontWeight: currentPath === '/reels' ? '800' : '600' }}>Reels</span>
      </Link>

      <Link to="/publish" className="nav-item nav-fab-wrapper active-scale">
        <div className="nav-fab" style={isDark ? { borderColor: '#27272a' } : undefined}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </div>
        <span className="nav-fab-text">Jaay</span>
      </Link>

      <Link to="/wutal-ma" className={`nav-item active-scale ${currentPath === '/wutal-ma' ? 'active' : ''}`} style={{ color: currentPath === '/wutal-ma' ? '#D97706' : 'inherit' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: isDark ? '#27272a' : '#FFF3C4', border: `1.5px solid ${currentPath === '/wutal-ma' ? '#F59E0B' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, marginBottom: '2px' }}>
          <img src={totemLapin} alt="Wutal Ma" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
        </div>
        <span style={{ fontWeight: currentPath === '/wutal-ma' ? '800' : '600' }}>Wutal Ma</span>
      </Link>

      <Link to="/favorites" className={`nav-item active-scale ${currentPath === '/favorites' ? 'active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        <span>Favoris</span>
      </Link>
    </div>
  );
};

export default BottomNav;
