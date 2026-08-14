import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { openWavePayment } from '../config/paymentConfig';

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
    openWavePayment();
  };

  const confirmPayment = async (e) => {
    e.preventDefault();
    if (!paymentPhone.trim()) {
      toast.error('Veuillez entrer le numéro utilisé pour le paiement.');
      return;
    }
    
    setIsProcessing(true);
    toast.loading('Envoi de la demande...', { id: 'payment' });

    // Ouvrir un onglet vide immédiatement de manière synchrone pour contourner le bloqueur de popups
    const whatsappWindow = window.open('', '_blank');

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
      
      if (whatsappWindow) {
        whatsappWindow.location.href = `https://wa.me/${adminNumber}?text=${text}`;
      }
      
      toast.success('Demande envoyée ! Votre compte sera activé après vérification.', { id: 'payment', duration: 5000 });
      setShowPaymentModal(false);
      setPaymentPhone('');
    } catch (err) {
      if (whatsappWindow) whatsappWindow.close();
      console.error(err);
      toast.error('Erreur lors de l\'envoi de la demande.', { id: 'payment' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Chargement...</div>;



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

      {/* SECTION 1: ABONNEMENTS MENSUELS VENDEURS */}
      <div style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', textAlign: 'center', marginBottom: '20px', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          💳 Abonnements Vendeurs & Boutiques (Mensuels)
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* Formule Gratuit */}
          <div style={{ background: '#F8FAFC', color: 'var(--text-main)', border: '2px solid #E2E8F0', borderRadius: '24px', padding: '24px', maxWidth: '320px', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '0 0 6px 0', textAlign: 'center', color: '#64748B' }}>Gratuit (Nouveau)</h3>
            <div style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px', textAlign: 'center', color: '#475569' }}>
              0 <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>FCFA</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📢 <strong>3 annonces max / mois</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📸 <strong>3 photos max par annonce</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📍 Visibilité standard</li>
            </ul>
            <div style={{ textAlign: 'center', padding: '10px', background: '#E2E8F0', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', color: '#475569' }}>
              Inclus pour tous les membres
            </div>
          </div>

          {/* Forfait Pro 5 000 FCFA */}
          <div style={{ background: 'white', color: 'var(--text-main)', border: '2px solid #3B82F6', borderRadius: '24px', padding: '24px', position: 'relative', maxWidth: '320px', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(59,130,246,0.1)' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#3B82F6', color: 'white', padding: '3px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              🔥 FORFAIT PRO (30 jours)
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '10px 0 6px 0', textAlign: 'center', color: '#1E40AF' }}>Forfait Pro</h3>
            <div style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px', textAlign: 'center', color: '#2563EB' }}>
              5 000 <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>FCFA/mois</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📢 <strong>Jusqu'à 30 annonces / mois</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📸 <strong>4 photos par annonce</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🎬 <strong>3 Reels Vidéo / mois inclus</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🏪 Vitrine boutique dédiée</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📊 Statistiques vendeur détaillées</li>
            </ul>
            <button disabled={isProcessing} onClick={() => initiatePayment('forfait_basique', 5000)} className="active-scale" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer' }}>
              {isProcessing ? 'Envoi...' : 'S\'abonner (5 000F)'}
            </button>
          </div>

          {/* Forfait Premium VIP 10 000 FCFA */}
          <div style={{ background: 'var(--primary)', color: 'white', border: '2px solid var(--primary)', borderRadius: '24px', padding: '24px', position: 'relative', boxShadow: '0 10px 30px rgba(139, 28, 49, 0.2)', maxWidth: '320px', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '3px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '0.8rem', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap' }}>
              ⚡ ILLIMITÉ + BOOST
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '10px 0 6px 0', textAlign: 'center' }}>Premium VIP</h3>
            <div style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px', textAlign: 'center', color: '#fde68a' }}>
              10 000 <span style={{ fontSize: '0.9rem', opacity: 0.8, color: 'white' }}>FCFA/mois</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🚀 <strong>Annonces ILLIMITÉES par mois</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📸 <strong>6 photos par annonce (Max site)</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🎬 <strong>Reels Vidéo ILLIMITÉS par mois</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>⚡ <strong>Boosts d'annonces inclus</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🔥 Positionnement prioritaire VIP</li>
            </ul>
            <button disabled={isProcessing} onClick={() => initiatePayment('forfait_premium', 10000)} className="active-scale" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', background: 'white', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}>
              {isProcessing ? 'Envoi...' : 'S\'abonner (10 000F)'}
            </button>
          </div>

        </div>
      </div>

      {/* SECTION 2: BOOSTS VISIBILITÉ INDIVIDUELS */}
      <div style={{ background: '#FFFBEB', borderRadius: '24px', padding: '24px', border: '1.5px solid #FCD34D', marginBottom: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#78350F', margin: '0 0 6px 0', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            ⚡ Propulser une Annonce Spécifique (Boost Visibilité)
          </h2>
          <p style={{ color: '#B45309', margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>
            Multipliez les vues de votre article par 10 et passez en tête des recherches sans modifier votre abonnement.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Boost 2j */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #FDE68A', flex: '1 1 200px', maxWidth: '240px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: '800', textTransform: 'uppercase' }}>Boost Flash</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#B45309', margin: '4px 0' }}>500 FCFA</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '12px' }}>⚡ 2 jours sponsorisés</div>
            <button onClick={() => initiatePayment('boost_flash', 500)} className="active-scale" style={{ width: '100%', padding: '8px', borderRadius: '10px', background: '#F59E0B', color: 'white', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
              Booster (500F)
            </button>
          </div>

          {/* Boost 7j */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1.5px solid #F59E0B', flex: '1 1 200px', maxWidth: '240px', textAlign: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: '800', textTransform: 'uppercase' }}>🎉 Pass Semaine</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#B45309', margin: '4px 0' }}>1 000 FCFA</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '12px' }}>⚡ 7 jours sponsorisés</div>
            <button onClick={() => initiatePayment('pass_semaine', 1000)} className="active-scale" style={{ width: '100%', padding: '8px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
              Booster (1 000F)
            </button>
          </div>

          {/* Boost Reel Vidéo 1500 FCFA / 1 Semaine */}
          <div style={{ background: 'linear-gradient(135deg, #09090B 0%, #172554 40%, #BE123C 100%)', color: 'white', borderRadius: '16px', padding: '16px', border: '1.5px solid rgba(244, 63, 94, 0.5)', flex: '1 1 200px', maxWidth: '240px', textAlign: 'center', boxShadow: '0 4px 15px rgba(190, 18, 60, 0.25)' }}>
            <div style={{ fontSize: '0.8rem', color: '#FDA4AF', fontWeight: '800', textTransform: 'uppercase' }}>🎬 Boost Reel Vidéo</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#FFFFFF', margin: '4px 0' }}>1 500 FCFA</div>
            <div style={{ fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '12px' }}>🎥 1 Semaine dans le Flux Reels TikTok</div>
            <button onClick={() => initiatePayment('boost_reel_semaine', 1500)} className="active-scale" style={{ width: '100%', padding: '8px', borderRadius: '10px', background: 'linear-gradient(135deg, #E11D48, #BE123C)', color: 'white', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
              Activer Reel (1 500F / 7j)
            </button>
          </div>

          {/* Boost 30j */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #FDE68A', flex: '1 1 200px', maxWidth: '240px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: '800', textTransform: 'uppercase' }}>Boost Mensuel</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#B45309', margin: '4px 0' }}>5 000 FCFA</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '12px' }}>⚡ 30 jours sponsorisés</div>
            <button onClick={() => initiatePayment('boost_mensuel', 5000)} className="active-scale" style={{ width: '100%', padding: '8px', borderRadius: '10px', background: '#F59E0B', color: 'white', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
              Booster (5 000F)
            </button>
          </div>

        </div>
      </div>

      <div style={{ marginTop: '50px', textAlign: 'center', background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Paiement Sécurisé</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)' }}>
            💳 Payer
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '15px' }}>Paiement 100% sécurisé au Sénégal. Activation immédiate.</p>
      </div>

      {/* Modal de Confirmation de Paiement */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: '400px', position: 'relative', animation: 'scaleUp 0.3s ease-out' }}>
            <button onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: '#ECFDF5', color: '#059669', marginBottom: '12px', fontSize: '28px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)' }}>
                💳
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '0 0 10px 0', fontFamily: 'var(--font-heading)' }}>Confirmation de paiement</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Avez-vous effectué le règlement de <strong>{selectedPlan?.price} FCFA</strong> ?</p>
            </div>
            <form onSubmit={confirmPayment}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>Numéro de téléphone utilisé pour le paiement</label>
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
