import { useState, useEffect } from 'react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Optionally check if already installed to not show it again
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px', // Just above bottom nav
      left: '16px',
      right: '16px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '16px',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1000,
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800' }}>
          C.M
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>Colobane Market</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Installer l'app pour un accès rapide</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleDismiss} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', padding: '8px' }}>
          Plus tard
        </button>
        <button onClick={handleInstallClick} className="btn-primary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', fontSize: '14px' }}>
          Installer
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
