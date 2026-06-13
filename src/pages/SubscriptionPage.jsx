import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SubscriptionPage = () => {
  const navigate = useNavigate();

  const handleSubscribe = (plan) => {
    // Dans un vrai projet, rediriger vers une API de paiement PayDunya, Wave, ou Orange Money
    toast.success(`Redirection vers le paiement pour le forfait ${plan}...`, { icon: '💳' });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <button onClick={() => navigate(-1)} className="active-scale touch-target" style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', marginBottom: '20px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', margin: '0 0 10px 0' }}>Boostez vos ventes !</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Choisissez le forfait adapté à vos ambitions et dominez le marché.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '20px' }}>
        {/* Basic Plan */}
        <div style={{ background: 'white', border: '2px solid #E2E8F0', borderRadius: '24px', padding: '30px', position: 'relative' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 10px 0' }}>Boutique Standard</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '20px' }}>
            10 000 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>FCFA/mois</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>✅ Vitrine officielle avec logo</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>✅ Badge "Vendeur Vérifié"</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>✅ Annonces illimitées</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94A3B8' }}>❌ Boost automatique</li>
          </ul>
          <button onClick={() => handleSubscribe('Standard')} className="btn-secondary active-scale" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem', border: '2px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}>
            Choisir Standard
          </button>
        </div>

        {/* Premium Plan */}
        <div style={{ background: 'var(--primary)', color: 'white', border: '2px solid var(--primary)', borderRadius: '24px', padding: '30px', position: 'relative', boxShadow: '0 10px 30px rgba(139, 28, 49, 0.2)' }}>
          <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#FFD700', color: '#B8860B', padding: '5px 15px', borderRadius: '20px', fontWeight: '800', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
            LE PLUS POPULAIRE ⭐
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 10px 0' }}>Boutique Premium</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '20px' }}>
            15 000 <span style={{ fontSize: '1rem', opacity: 0.8 }}>FCFA/mois</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>✅ Tout le forfait Standard</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🚀 3 Boosts automatiques/semaine</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>⭐ Priorité dans les recherches</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>💬 Support prioritaire WhatsApp</li>
          </ul>
          <button onClick={() => handleSubscribe('Premium')} className="active-scale" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem', background: 'white', color: 'var(--primary)', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            Choisir Premium
          </button>
        </div>
      </div>

      <div style={{ marginTop: '50px', textAlign: 'center', background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Moyens de paiement acceptés</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ background: '#00b0f0', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Wave 🐧
          </div>
          <div style={{ background: '#ff6600', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Orange Money
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '15px' }}>Paiement 100% sécurisé au Sénégal. Activation immédiate.</p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
