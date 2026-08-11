import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  handleReload = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let reg of registrations) {
            reg.unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (let name of names) {
            caches.delete(name);
          }
        });
      }
    } catch (_e) {}

    const cleanUrl = window.location.origin + window.location.pathname + '?reload=' + Date.now();
    window.location.href = cleanUrl;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          background: '#F8FAFC',
          color: '#0F172A'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem', color: '#8A1C1C' }}>
            ColobaneMarket
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
            Mise à jour disponible. Cliquez ci-dessous pour recharger la nouvelle version.
          </p>
          <button 
            onClick={this.handleReload} 
            style={{
              padding: '14px 28px',
              background: '#8A1C1C',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontWeight: '800',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(138,28,28,0.3)'
            }}
          >
            Recharger la page 🔄
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
