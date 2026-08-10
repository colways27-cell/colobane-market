import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import totemLapin from '../assets/totem-lapin.webp';
import { getUserCoordinates } from '../utils/geolocation';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [isInfosOpen, setIsInfosOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('colobane_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('colobane_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    toast.success(nextTheme === 'dark' ? '🌙 Mode Sombre Luxe activé !' : '☀️ Mode Clair activé !');
  };

  const isProductPage = location.pathname.startsWith('/product/');

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data: payRequests } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile?.is_admin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      const notifs = [];

      if (payRequests) {
        payRequests.forEach(req => {
          if (req.status === 'approved' || req.status === 'validated') {
            notifs.push({
              id: `pay-${req.id}`,
              type: 'success',
              title: '⚡ Boost Reel / Plan Activé !',
              message: `Votre demande pour le ${req.plan_type === 'boost_reel_7j' ? 'Boost Reel 7 jours (1 500 F)' : 'forfait'} a été approuvée par l'admin !`,
              date: req.created_at,
              link: '/reels'
            });
          }
        });
      }

      if (profile && profile.subscription_end_date) {
        const endDate = new Date(profile.subscription_end_date);
        const now = new Date();
        const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 3) {
          notifs.push({
            id: `sub-expire`,
            type: 'warning',
            title: '⏳ Expiration de Forfait',
            message: `Votre forfait ${profile.subscription_plan || 'Pro'} expire dans ${diffDays} jour(s). Réabonnez-vous pour garder l'illimité.`,
            date: new Date().toISOString(),
            link: '/subscription'
          });
        }
      }

      const readNotifIds = JSON.parse(localStorage.getItem('colobane_read_notifs') || '[]');
      const unreadNotifs = notifs.filter(n => !readNotifIds.includes(n.id));

      setNotifications(notifs);
      setUnreadCount(unreadNotifs.length);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  const handleToggleNotifications = () => {
    setShowNotificationsDrawer(prev => {
      const nextState = !prev;
      if (nextState && notifications.length > 0) {
        const readNotifIds = JSON.parse(localStorage.getItem('colobane_read_notifs') || '[]');
        const newReadIds = Array.from(new Set([...readNotifIds, ...notifications.map(n => n.id)]));
        localStorage.setItem('colobane_read_notifs', JSON.stringify(newReadIds));
        setUnreadCount(0);
      }
      return nextState;
    });
  };

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
      {!isOnline && (
        <div style={{ background: 'linear-gradient(135deg, #BE123C 0%, #9F1239 100%)', color: 'white', padding: '6px 12px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', zIndex: 1100 }}>
          <span>📡 Mode Hors-Ligne Actif — Navigation sur le contenu en cache PWA</span>
        </div>
      )}
      <header className="navbar-header" style={{ position: 'sticky', top: 0, zIndex: 9999, background: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(12px)', borderBottom: theme === 'dark' ? '1px solid #1E293B' : '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div className="section-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px', padding: '0 1rem' }}>
          
          {/* Left: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            <button 
              className="active-scale" 
              onClick={handleMenuClick} 
              style={{ background: theme === 'dark' ? '#1E293B' : '#F8FAFC', border: theme === 'dark' ? '1px solid #334155' : '1px solid #E2E8F0', borderRadius: '12px', cursor: 'pointer', padding: '7px', color: theme === 'dark' ? '#F8FAFC' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>

            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src="/image marque.jpg" alt="Colobane Market" style={{ height: '42px', maxHeight: '44px', width: 'auto', maxWidth: '140px', objectFit: 'contain', borderRadius: '8px' }} />
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hide-on-mobile" style={{ flex: 1, maxWidth: '450px', margin: '0 1.5rem', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Lan nga bëgg wut ? (ex: iPhone, robe, voiture...)" 
              style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', background: theme === 'dark' ? '#1E293B' : '#F8FAFC', color: theme === 'dark' ? '#F8FAFC' : 'inherit', outline: 'none', fontSize: '0.9rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim() !== '') {
                  navigate(`/explore?q=${encodeURIComponent(e.target.value.trim())}`);
                }
              }}
            />
            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>

          {/* Right: Theme Toggle, Publish Button & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="active-scale"
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre luxe'}
              style={{
                background: theme === 'dark' ? 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)' : '#F1F5F9',
                border: theme === 'dark' ? '1px solid #4338CA' : '1px solid #CBD5E1',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.05rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link 
              to="/reels" 
              className="active-scale hover-lift" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
                color: '#FFFFFF',
                padding: '0.42rem 0.85rem',
                borderRadius: '999px',
                fontWeight: '800',
                textDecoration: 'none',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                fontSize: '0.8rem',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                letterSpacing: '0.4px'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              <span>REELS</span>
              <span style={{ background: 'linear-gradient(135deg, #E11D48, #BE123C)', color: '#FFF', fontSize: '9px', fontWeight: 900, padding: '2px 5px', borderRadius: '6px', marginLeft: '2px', letterSpacing: '0.5px' }}>PRO</span>
            </Link>

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
            
            {/* Notification Bell */}
            {user && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={handleToggleNotifications}
                  className="active-scale"
                  style={{
                    background: theme === 'dark' ? '#27272a' : '#F8FAFC',
                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #E2E8F0',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  aria-label="Notifications"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme === 'dark' ? '#94a3b8' : '#475569'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      background: '#E11D48',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 900,
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(225, 29, 72, 0.4)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {showNotificationsDrawer && (
                  <div style={{
                    position: 'absolute',
                    top: '48px',
                    right: '-10px',
                    width: '320px',
                    maxWidth: 'calc(100vw - 24px)',
                    background: theme === 'dark' ? '#18181b' : '#FFFFFF',
                    borderRadius: '20px',
                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #E2E8F0',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                    zIndex: 100000,
                    padding: '16px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: theme === 'dark' ? '1px solid #27272a' : '1px solid #F1F5F9' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: theme === 'dark' ? '#f8fafc' : '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🔔</span> Notifications Vendeur
                      </div>
                      <button
                        onClick={() => setShowNotificationsDrawer(false)}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 800 }}
                      >
                        ✕
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 10px', color: theme === 'dark' ? '#94a3b8' : '#64748B', fontSize: '13px' }}>
                        Aucune nouvelle notification pour le moment.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setShowNotificationsDrawer(false);
                              navigate(n.link);
                            }}
                            style={{
                              background: n.type === 'success' ? (theme === 'dark' ? '#052e16' : '#F0FDF4') : (theme === 'dark' ? '#422006' : '#FFFBEB'),
                              border: n.type === 'success' ? (theme === 'dark' ? '1px solid #14532d' : '1px solid #DCFCE7') : (theme === 'dark' ? '1px solid #713f12' : '1px solid #FDE68A'),
                              padding: '10px 12px',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s'
                            }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: 800, color: n.type === 'success' ? '#15803D' : '#B45309' }}>
                              {n.title}
                            </div>
                            <div style={{ fontSize: '11px', color: theme === 'dark' ? '#cbd5e1' : '#334155', marginTop: '2px', lineHeight: '1.3' }}>
                              {n.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}



            <Link to={user ? "/profile" : "/auth"} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-main)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: theme === 'dark' ? '#27272a' : '#F8FAFC', border: theme === 'dark' ? '1px solid #334155' : '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            style={{ width: '280px', height: '100%', background: theme === 'dark' ? '#18181b' : 'white', padding: '2rem 1.5rem 100px 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: theme === 'dark' ? '2px 0 20px rgba(0,0,0,0.4)' : '2px 0 20px rgba(0,0,0,0.1)', overflowY: 'auto' }}
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

              {isAdmin && (
                <Link to="/admin" onClick={closeMenu} style={{ textDecoration: 'none', color: '#BE123C', fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', background: '#FFF1F2', padding: '10px 14px', borderRadius: '12px', border: '1px solid #FECDD3' }}>
                  <span>🛡️</span>
                  Back-Office Admin
                </Link>
              )}

              {/* Infos+ Collapsible Section */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  onClick={() => setIsInfosOpen(!isInfosOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--text-main)',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>Infos+</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', transform: isInfosOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
                </button>

                {isInfosOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '34px', marginTop: '1rem', borderLeft: '2px solid var(--border-color)' }}>
                    <Link to="/a-propos" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.98rem', fontWeight: '500' }}>
                      Qui sommes-nous ?
                    </Link>
                    <Link to="/subscription" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.98rem', fontWeight: '500' }}>
                      Nos Offres
                    </Link>
                    <a href="tel:+221773713175" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.98rem', fontWeight: '500' }}>
                      Contact
                    </a>
                    <Link to="/conditions-generales" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.98rem', fontWeight: '500' }}>
                      Conditions Générales
                    </Link>
                    <Link to="/politique-confidentialite" onClick={closeMenu} style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.98rem', fontWeight: '500' }}>
                      Politique de confidentialité
                    </Link>
                  </div>
                )}
              </div>
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
