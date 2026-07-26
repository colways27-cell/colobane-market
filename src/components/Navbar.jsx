import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import totemLapin from '../assets/totem-lapin.webp';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isProductPage = location.pathname.startsWith('/product/');

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="navbar-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'white', borderBottom: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div className="section-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px', padding: '0 1rem' }}>
          
          {/* Left: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="active-scale" 
              onClick={handleMenuClick} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>

            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src="/image marque.jpg" alt="Colobane Market" style={{ height: '48px', objectFit: 'contain', borderRadius: '4px' }} />
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hide-on-mobile" style={{ flex: 1, maxWidth: '450px', margin: '0 2rem', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Lan nga bëgg wut ? (ex: iPhone, robe, voiture...)" 
              style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', background: '#F8FAFC', outline: 'none', fontSize: '0.9rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim() !== '') {
                  navigate(`/explore?q=${encodeURIComponent(e.target.value.trim())}`);
                }
              }}
            />
            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>

          {/* Right: Publish Button & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link 
              to="/wutal-ma" 
              className="hide-on-mobile active-scale hover-lift" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', color: '#78350F', padding: '0.4rem 1rem 0.4rem 0.5rem', borderRadius: 'var(--radius-pill)', fontWeight: '900', textDecoration: 'none', border: '1.5px solid #FCD34D', fontSize: '0.88rem', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)' }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'white', border: '1px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                <img src={totemLapin} alt="Wutal Ma Totem" style={{ width: '32px', height: '32px', objectFit: 'contain', transform: 'scale(1.3)' }} />
              </div>
              Wutal Ma
            </Link>

            <button 
              className="hide-on-mobile active-scale" 
              onClick={() => navigate('/publish')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-pill)', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Jaay 📢
            </button>
            
            <Link to={user ? "/profile" : "/auth"} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-main)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F8FAFC', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Drawer Mobile */}
      {isMenuOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={closeMenu}
        >
          <div 
            style={{ width: '280px', height: '100%', background: 'white', padding: '2rem 1.5rem 100px 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '2px 0 20px rgba(0,0,0,0.1)', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/image marque.jpg" alt="Colobane Market" style={{ height: '56px', objectFit: 'contain', borderRadius: '4px', transform: 'scale(1.2)' }} />
              </div>
              <button onClick={closeMenu} style={{ background: 'var(--bg-color)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <NavLink to="/wutal-ma" onClick={closeMenu} className="active-scale hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', borderRadius: '16px', textDecoration: 'none', background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1.5px solid #FCD34D', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', border: '1.5px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)' }}>
                  <img src={totemLapin} alt="Wutal Ma Totem" style={{ width: '40px', height: '40px', objectFit: 'contain', transform: 'scale(1.35)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#78350F', fontWeight: '900', fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>Wutal Ma</span>
                  <span style={{ color: '#B45309', fontWeight: '700', fontSize: '0.78rem' }}>Demandes d'acheteurs 🔍</span>
                </div>
              </NavLink>
            </nav>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
              <Link to="/" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Annonces
              </Link>
              <Link to="/explore" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Explorer
              </Link>
              <Link to="/boutiques" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                Boutiques
              </Link>
              <Link to="/subscription" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                Nos Offres
              </Link>
              <Link to="/publish" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--primary)', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(138, 28, 28, 0.08)', padding: '12px', borderRadius: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Vendre un article
              </Link>
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              {user ? (
                <button onClick={handleLogout} className="active-scale" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', width: '100%', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Déconnexion
                </button>
              ) : (
                <Link to="/auth" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--primary)', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </div>
      )}



    </>
  );
};

export default Navbar;
