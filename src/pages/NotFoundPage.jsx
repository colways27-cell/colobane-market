import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      background: 'var(--bg-color)'
    }}>
      {/* Illustration */}
      <div style={{
        width: '120px',
        height: '120px',
        background: 'linear-gradient(135deg, #8a1c1c, #c0392b)',
        borderRadius: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        boxShadow: '0 16px 40px rgba(138, 28, 28, 0.25)',
        fontSize: '3.5rem'
      }}>
        🔍
      </div>

      {/* Code 404 */}
      <h1 style={{
        fontSize: '5rem',
        fontWeight: '900',
        fontFamily: 'var(--font-heading)',
        color: 'var(--primary)',
        lineHeight: 1,
        marginBottom: '0.5rem',
        letterSpacing: '-2px'
      }}>
        404
      </h1>

      <h2 style={{
        fontSize: '1.4rem',
        fontWeight: '700',
        color: 'var(--text-main)',
        marginBottom: '0.75rem'
      }}>
        Page introuvable
      </h2>

      <p style={{
        color: 'var(--text-muted)',
        fontSize: '1rem',
        maxWidth: '320px',
        lineHeight: '1.6',
        marginBottom: '2rem'
      }}>
        Cette page n'existe pas ou a été déplacée. Pas de panique, le marché t'attend !
      </p>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" style={{
          background: 'var(--primary)',
          color: 'white',
          padding: '0.9rem 2rem',
          borderRadius: '14px',
          textDecoration: 'none',
          fontWeight: '700',
          fontSize: '0.95rem',
          boxShadow: '0 8px 25px rgba(138, 28, 28, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🏠 Retour à l'accueil
        </Link>

        <Link to="/explore" style={{
          background: 'white',
          color: 'var(--primary)',
          padding: '0.9rem 2rem',
          borderRadius: '14px',
          textDecoration: 'none',
          fontWeight: '700',
          fontSize: '0.95rem',
          border: '2px solid var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔎 Explorer les annonces
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
