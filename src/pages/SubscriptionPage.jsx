import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user, navigate]);

  const initiatePayment = (planType, price) => {
    setSelectedPlan({ type: planType, price: price });
    setShowPaymentModal(true);
    // Le lien Wave s'ouvre pour l'utilisateur
    window.open(`https://pay.wave.com/m/M_sn_DDpGp25B76P7/c/sn/?src=d`, '_blank');
  };

  const confirmPayment = async (e) => {
    e.preventDefault();
    if (!paymentPhone.trim()) {
      toast.error('Veuillez entrer le numéro utilisé pour le paiement.');
      return;
    }
    
    setIsProcessing(true);
    toast.loading('Envoi de la demande...', { id: 'payment' });

    try {
      const { error } = await supabase.from('payment_requests').insert([{
        user_id: user.id,
        plan_type: selectedPlan.type,
        amount: selectedPlan.price,
        phone_used: paymentPhone,
        status: 'pending'
      }]);

      if (error) throw error;
      
      const adminNumber = "221773713175";
      const text = encodeURIComponent(`Nouvelle demande de paiement ! L'utilisateur ${profile?.full_name || user.id} a payé ${selectedPlan.price}F pour ${selectedPlan.type} avec le numéro ${paymentPhone}. Vérifiez Wave et activez le compte.`);
      window.open(`https://wa.me/${adminNumber}?text=${text}`, '_blank');
      
      toast.success('Demande envoyée ! Votre compte sera activé après vérification.', { id: 'payment', duration: 5000 });
      setShowPaymentModal(false);
      setPaymentPhone('');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi de la demande.', { id: 'payment' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Chargement...</div>;

  const isBoutique = profile?.account_type === 'boutique';

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <button onClick={() => navigate(-1)} className="active-scale touch-target" style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', marginBottom: '20px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', margin: '0 0 10px 0' }}>
          Boostez vos Ventes
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Choisissez le forfait ou l'option adapté à vos ambitions.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
        
        {/* Pass Semaine - Yomb Na Lool */}
        <div style={{ background: 'white', color: 'var(--text-main)', border: '2px solid #3B82F6', borderRadius: '24px', padding: '24px', position: 'relative', maxWidth: '320px', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(59,130,246,0.1)' }}>
          <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#3B82F6', color: 'white', padding: '3px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            🎉 YOMB NA LOOL (7 jours)
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '10px 0 6px 0', textAlign: 'center', color: '#1E40AF' }}>Pass Semaine</h2>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px', textAlign: 'center', color: '#2563EB' }}>
            1 000 <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>FCFA/7j</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, fontSize: '0.95rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Accès vitrine boutique 7 jours</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📸 Photos illimitées</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>⚡ Idéal pour tester sans engagement</li>
          </ul>
          <button disabled={isProcessing} onClick={() => initiatePayment('pass_semaine', 1000)} className="active-scale" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer' }}>
            {isProcessing ? 'Envoi...' : 'Pass 7 Jours (1 000F)'}
          </button>
        </div>

        {/* Pass 15 Jours - Yomb Na Lool */}
        <div style={{ background: 'white', color: 'var(--text-main)', border: '2px solid #10B981', borderRadius: '24px', padding: '24px', position: 'relative', maxWidth: '320px', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(16,185,129,0.1)' }}>
          <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#10B981', color: 'white', padding: '3px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            🔥 POPULAIRE (15 jours)
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '10px 0 6px 0', textAlign: 'center', color: '#065F46' }}>Pass 15 Jours</h2>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px', textAlign: 'center', color: '#059669' }}>
            2 500 <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>FCFA/15j</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, fontSize: '0.95rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Accès vitrine 15 jours</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🚀 Visibilité garantie</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>⭐ Excellent rapport qualité/prix</li>
          </ul>
          <button disabled={isProcessing} onClick={() => initiatePayment('pass_15jours', 2500)} className="active-scale" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', background: '#059669', color: 'white', border: 'none', cursor: 'pointer' }}>
            {isProcessing ? 'Envoi...' : 'Pass 15 Jours (2 500F)'}
          </button>
        </div>
        
        {/* Forfait Pro 5 000 FCFA */}
        <div style={{ background: 'white', color: 'var(--text-main)', border: '2px solid #E2E8F0', borderRadius: '24px', padding: '30px', position: 'relative', maxWidth: '350px', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 10px 0', textAlign: 'center', color: '#64748B' }}>Forfait Pro</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '20px', textAlign: 'center', color: 'var(--primary)' }}>
            5 000 <span style={{ fontSize: '1rem', opacity: 0.8 }}>FCFA/mois</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>📢 <strong>Jusqu'à 30 annonces / mois</strong></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>📸 <strong>4 photos par annonce</strong></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🏪 Vitrine boutique personnalisée</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>📊 Statistiques vendeur détaillées</li>
          </ul>
          <button disabled={isProcessing} onClick={() => initiatePayment('forfait_basique', 5000)} className="active-scale" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem', background: '#F1F5F9', color: 'var(--primary)', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginTop: 'auto', opacity: isProcessing ? 0.7 : 1, cursor: 'pointer' }}>
            {isProcessing ? 'Traitement...' : 'S\'abonner (5 000F)'}
          </button>
        </div>

        {/* Forfait Premium 10 000 FCFA */}
        <div style={{ background: 'var(--primary)', color: 'white', border: '2px solid var(--primary)', borderRadius: '24px', padding: '30px', position: 'relative', boxShadow: '0 10px 30px rgba(139, 28, 49, 0.2)', maxWidth: '350px', width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: '800', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap' }}>
            ⚡ ILLIMITÉ + BOOST
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 10px 0', textAlign: 'center' }}>Premium VIP</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '20px', textAlign: 'center', color: '#fde68a' }}>
            10 000 <span style={{ fontSize: '1rem', opacity: 0.8, color: 'white' }}>FCFA/mois</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🚀 <strong>Annonces ILLIMITÉES par mois</strong></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>📸 <strong>6 photos par annonce (Max)</strong></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>⚡ <strong>Boost d'annonces inclus</strong></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🔥 Positionnement prioritaire en Tête</li>
          </ul>
          <button disabled={isProcessing} onClick={() => initiatePayment('forfait_premium', 10000)} className="active-scale" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem', background: 'white', color: 'var(--primary)', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', marginTop: 'auto', opacity: isProcessing ? 0.7 : 1, cursor: 'pointer' }}>
            {isProcessing ? 'Traitement...' : 'S\'abonner (10 000F)'}
          </button>
        </div>

        {/* Forfait Boost Individuel */}
        <div style={{ background: 'white', color: 'var(--text-main)', border: '2px solid #E2E8F0', borderRadius: '24px', padding: '30px', position: 'relative', maxWidth: '350px', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 10px 0', textAlign: 'center', color: '#f59e0b' }}>Boost d'Annonce</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '20px', textAlign: 'center', color: 'var(--primary)' }}>
            Dès 500 <span style={{ fontSize: '1rem', opacity: 0.8 }}>FCFA</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>⚡ <strong>500 FCFA</strong> pour 2 jours</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>⚡ <strong>1 500 FCFA</strong> pour 7 jours</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>⚡ <strong>2 500 FCFA</strong> pour 15 jours</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>⚡ <strong>5 000 FCFA</strong> pour 30 jours (Mensuel)</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🚀 Multipliez vos vues par 10 !</li>
          </ul>
          <button onClick={() => navigate('/profile')} className="active-scale" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)', marginTop: 'auto', cursor: 'pointer' }}>
            Booster une annonce
          </button>
        </div>

      </div>

      <div style={{ marginTop: '50px', textAlign: 'center', background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Moyens de paiement acceptés</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ background: '#00b0f0', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(0, 176, 240, 0.2)' }}>
            <img src="/wave.png" alt="Wave Logo" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
            Wave
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '15px' }}>Paiement 100% sécurisé au Sénégal. Activation immédiate.</p>
      </div>

      {/* Modal de Confirmation Wave */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: '400px', position: 'relative', animation: 'scaleUp 0.3s ease-out' }}>
            <button onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: '#00b0f0', marginBottom: '12px', boxShadow: '0 4px 15px rgba(0, 176, 240, 0.2)' }}>
                <img src="/wave.png" alt="Wave" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '0 0 10px 0', fontFamily: 'var(--font-heading)' }}>Paiement Wave</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Avez-vous effectué l'envoi de <strong>{selectedPlan?.price} FCFA</strong> via le lien ?</p>
            </div>
            <form onSubmit={confirmPayment}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>Numéro Wave utilisé pour le paiement</label>
                <input 
                  type="tel" 
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="Ex: 77 123 45 67"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '1rem', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <button type="submit" disabled={isProcessing} className="btn-primary active-scale" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem', border: 'none', display: 'block', opacity: isProcessing ? 0.7 : 1 }}>
                {isProcessing ? 'Envoi...' : 'Confirmer mon paiement'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SubscriptionPage;
