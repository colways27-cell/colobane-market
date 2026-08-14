import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    this.setState({ errorInfo });
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
      // Ne PAS vider localStorage/sessionStorage pour préserver les sessions utilisateur
    } catch (_e) {}

    window.location.href = window.location.origin + window.location.pathname + '?reset=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || (typeof this.state.error === 'string' ? this.state.error : 'Un problème de chargement est survenu.');
      
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#F8FAFC',
          color: '#0F172A'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem', color: '#8A1C1C' }}>
            ColobaneMarket
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1.2rem', maxWidth: '400px', lineHeight: '1.5' }}>
            Mise à jour en cours. Cliquez sur le bouton ci-dessous pour recharger la nouvelle version.
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
              boxShadow: '0 4px 15px rgba(138,28,28,0.3)',
              marginBottom: '1.5rem'
            }}
          >
            Recharger et Mettre à jour 🔄
          </button>

          <details style={{ marginTop: '1rem', textAlign: 'left', maxWidth: '90vw', background: '#FFF', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#64748B' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600' }}>Détails techniques</summary>
            <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem' }}>
              {errorMessage}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
