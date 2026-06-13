import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

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
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="navbar" style={{ padding: '0.5rem 1rem', background: 'transparent', boxShadow: 'none', border: 'none' }}>
        <div className="navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: 'var(--radius-pill)', padding: '0.5rem 1rem', boxShadow: 'var(--shadow-sm)' }}>
          {/* Menu Icon */}
          <button onClick={handleMenuClick} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
            ☰
          </button>
          
          {/* Logo Centered */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/image marque.jpg" alt="Colobane Market" style={{ height: '56px', objectFit: 'contain', borderRadius: '4px', transform: 'scale(1.2)' }} />
          </Link>
          
          {/* User Avatar */}
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {user ? (
              <Link to="/profile" style={{ textDecoration: 'none', fontSize: '1rem' }}>👤</Link>
            ) : (
              <Link to="/auth" style={{ textDecoration: 'none', fontSize: '1rem' }}>👤</Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={closeMenu}>
          <div 
            style={{ width: '280px', height: '100%', background: 'white', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '2px 0 20px rgba(0,0,0,0.1)' }}
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
              <Link to="/" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Accueil
              </Link>
              <Link to="/explore" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Explorer
              </Link>
              <Link to="/boutiques" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                Boutiques
              </Link>
              <Link to="/publish" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--primary)', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(138, 28, 28, 0.08)', padding: '12px', borderRadius: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Vendre un article
              </Link>
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              {user ? (
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: '1.1rem', fontWeight: '500', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
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
