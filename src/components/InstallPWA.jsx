import { useState, useEffect } from 'react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return document.documentElement.getAttribute('data-theme') || 'light'; } catch(e) { return 'light'; }
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Detect if already installed as PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isInStandaloneMode);

    if (isInStandaloneMode) return; // Already installed, don't show

    const dismissed = localStorage.getItem('colobane_install_dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);

    // Show again after 72h if dismissed
    if (dismissed && hoursSinceDismiss < 72) return;

    if (isIOSDevice) {
      // On iOS, show after 2 seconds
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };
    const handleInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // iOS can't programmatically install, just show instructions
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('colobane_install_dismissed', Date.now().toString());
  };

  if (!isVisible || isStandalone) return null;

  return (
    <>
      <style>{`
        @keyframes installSlideUp {
          from { transform: translateY(120px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes installPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shareIconBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .install-banner-ios-step {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.4;
        }
        .install-banner-ios-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '12px',
        right: '12px',
        maxWidth: '420px',
        margin: '0 auto',
        background: isDark 
          ? 'linear-gradient(145deg, #1e1b4b 0%, #18181b 100%)' 
          : 'linear-gradient(145deg, #ffffff 0%, #fef2f2 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: isIOS ? '20px' : '16px 20px',
        borderRadius: '24px',
        boxShadow: isDark 
          ? '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(190,18,60,0.15)' 
          : '0 20px 50px rgba(0,0,0,0.12), 0 0 30px rgba(190,18,60,0.08)',
        border: isDark ? '1px solid #334155' : '1px solid rgba(190,18,60,0.15)',
        zIndex: 1001,
        animation: 'installSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        overflow: 'hidden'
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(190,18,60,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: isIOS ? '16px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '46px', 
              height: '46px', 
              background: 'linear-gradient(135deg, #be123c, #e11d48)', 
              borderRadius: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontWeight: '900',
              fontSize: '0.9rem',
              boxShadow: '0 4px 14px rgba(190,18,60,0.35)',
              animation: 'installPulse 3s ease-in-out infinite'
            }}>
              C.M
            </div>
            <div>
              <h4 style={{ 
                margin: 0, 
                fontSize: '0.95rem', 
                fontWeight: '900', 
                color: isDark ? '#f8fafc' : '#0f172a',
                letterSpacing: '-0.01em'
              }}>
                {isIOS ? '📲 Installer ColobaneMarket' : '📲 Colobane Market'}
              </h4>
              <p style={{ 
                margin: '2px 0 0', 
                fontSize: '0.78rem', 
                color: isDark ? '#94a3b8' : '#64748b',
                fontWeight: '500'
              }}>
                {isIOS ? 'Ajoutez l\'app à votre iPhone' : 'Accès rapide comme une vraie app'}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Fermer"
            style={{
              background: isDark ? '#27272a' : '#f1f5f9',
              border: 'none',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isDark ? '#94a3b8' : '#64748b',
              fontSize: '1rem',
              fontWeight: '700',
              flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>

        {isIOS ? (
          /* iOS Instructions */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="install-banner-ios-step" style={{
              background: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff',
              color: isDark ? '#93c5fd' : '#1e40af'
            }}>
              <div className="install-banner-ios-step-num" style={{
                background: isDark ? '#1e3a5f' : '#dbeafe',
                color: isDark ? '#93c5fd' : '#1e40af'
              }}>1</div>
              <div>
                Appuyez sur le bouton{' '}
                <span style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  verticalAlign: 'middle',
                  animation: 'shareIconBounce 2s ease-in-out infinite'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </span>
                {' '}Partager en bas de Safari
              </div>
            </div>

            <div className="install-banner-ios-step" style={{
              background: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5',
              color: isDark ? '#6ee7b7' : '#065f46'
            }}>
              <div className="install-banner-ios-step-num" style={{
                background: isDark ? '#064e3b' : '#d1fae5',
                color: isDark ? '#6ee7b7' : '#065f46'
              }}>2</div>
              <div>
                Faites défiler et appuyez sur{' '}
                <strong>« Sur l'écran d'accueil »</strong>{' '}
                <span style={{ fontSize: '1rem' }}>➕</span>
              </div>
            </div>

            <div className="install-banner-ios-step" style={{
              background: isDark ? 'rgba(190,18,60,0.12)' : '#fff1f2',
              color: isDark ? '#fda4af' : '#9f1239'
            }}>
              <div className="install-banner-ios-step-num" style={{
                background: isDark ? '#4c0519' : '#ffe4e6',
                color: isDark ? '#fda4af' : '#9f1239'
              }}>3</div>
              <div>
                Appuyez <strong>« Ajouter »</strong> — et c'est fait ! 🎉
              </div>
            </div>

            <button
              onClick={handleDismiss}
              style={{
                marginTop: '6px',
                padding: '10px',
                background: isDark ? '#27272a' : '#f8fafc',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                borderRadius: '12px',
                color: isDark ? '#94a3b8' : '#64748b',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'center'
              }}
            >
              J'ai compris, merci 👍
            </button>
          </div>
        ) : (
          /* Android/Chrome Install Button */
          <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
            <button 
              onClick={handleDismiss} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: isDark ? '#94a3b8' : '#64748b', 
                fontSize: '0.82rem', 
                fontWeight: '700', 
                padding: '10px 14px', 
                cursor: 'pointer',
                borderRadius: '12px'
              }}
            >
              Plus tard
            </button>
            <button 
              onClick={handleInstallClick} 
              style={{ 
                flex: 1,
                padding: '10px 20px', 
                background: 'linear-gradient(135deg, #be123c, #e11d48)',
                color: 'white',
                border: 'none',
                borderRadius: '14px', 
                fontSize: '0.88rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(190,18,60,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Installer l'App
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default InstallPWA;
