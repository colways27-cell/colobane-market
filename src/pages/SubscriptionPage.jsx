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
  const [userProducts, setUserProducts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductSelectionModal, setShowProductSelectionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  
  const [maxSelectionLimit, setMaxSelectionLimit] = useState(0);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const fetchData = async () => {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);
      
      const { data: productsData } = await supabase.from('products')
        .select('id, title, images')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
        
      setUserProducts(productsData || []);
      setLoading(false);
    };
    fetchData();
  }, [user, navigate]);

  const initiatePayment = (planType, price, limit = 0) => {
    setSelectedPlan({ type: planType, price: price });
    
    if (limit > 0) {
      setMaxSelectionLimit(limit);
      setSelectedProductIds([]);
      setShowProductSelectionModal(true);
    } else {
      setShowPaymentModal(true);
      openWavePayment();
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      if (prev.length >= maxSelectionLimit) {
        toast.error(`Vous ne pouvez sélectionner que ${maxSelectionLimit} annonce(s) maximum.`);
        return prev;
      }
      return [...prev, productId];
    });
  };

  const handleSelectionConfirm = () => {
    if (selectedProductIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une annonce à booster.');
      return;
    }
    setShowProductSelectionModal(false);
    setShowPaymentModal(true);
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

    const whatsappWindow = window.open('', '_blank');

    try {
      const planTypeWithIds = selectedProductIds.length > 0 
        ? `${selectedPlan.type}|${selectedProductIds.join(',')}` 
        : selectedPlan.type;

      const { error } = await supabase.from('payment_requests').insert([{
        user_id: user.id,
        plan_type: planTypeWithIds,
        amount: selectedPlan.price,
        phone_used: paymentPhone,
        status: 'pending'
      }]);

      if (error) throw error;
      
      const adminNumber = "221773713175";
      
      const selectedAdsText = selectedProductIds.length > 0 
        ? `\n\n🎯 Annonces sélectionnées (${selectedProductIds.length}/${maxSelectionLimit}) :\n` + 
          selectedProductIds.map((id, index) => {
            const prod = userProducts.find(p => p.id === id);
            return `${index + 1}. ${prod ? prod.title : 'Annonce inconnue'}`;
          }).join('\n')
        : '';

      const text = encodeURIComponent(`Nouvelle demande de paiement ! L'utilisateur ${profile?.full_name || user.id} a payé ${selectedPlan.price}F pour ${selectedPlan.type} avec le numéro Wave: ${paymentPhone}.${selectedAdsText}\n\nVérifiez Wave et activez les boosts svp.`);
      
      if (whatsappWindow) {
        whatsappWindow.location.href = `https://wa.me/${adminNumber}?text=${text}`;
      }
      
      toast.success('Demande envoyée ! Les boosts seront activés après vérification.', { id: 'payment', duration: 5000 });
      setShowPaymentModal(false);
      setPaymentPhone('');
      setSelectedProductIds([]);
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

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', textAlign: 'center', marginBottom: '20px', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          🚀 Nos Packs de Boost
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '30px', fontSize: '1rem', padding: '0 20px' }}>
          Propulsez vos annonces en tête de liste et multipliez vos ventes en un temps record.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '0 10px' }}>
          
          {/* Boost Flash 500 FCFA (1 annonce) */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1.5px solid #FDE68A', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Boost Flash</div>
            <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#B45309', margin: '0 0 16px 0', lineHeight: 1 }}>
              500 <span style={{ fontSize: '1rem', color: '#92400E', fontWeight: '700' }}>FCFA</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: '600' }}><span>📢</span> <strong>1 Annonce</strong> sponsorisée</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#475569' }}><span>⏳</span> Valable pendant 2 jours</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#475569' }}><span>⚡</span> Apparaît dans "Vedette"</li>
            </ul>
            <button onClick={() => initiatePayment('boost_1_annonce', 500, 1)} className="active-scale" style={{ width: '100%', padding: '12px', borderRadius: '14px', background: '#F59E0B', color: 'white', border: 'none', fontWeight: '800', fontSize: '1rem', cursor: 'pointer' }}>
              Booster 1 Annonce
            </button>
          </div>

          {/* Pack Semaine 1500 FCFA (5 annonces) */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '2px solid #F59E0B', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 8px 25px rgba(245,158,11,0.15)' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#F59E0B', color: 'white', padding: '4px 16px', borderRadius: '20px', fontWeight: '800', fontSize: '0.85rem', whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(245,158,11,0.3)' }}>
              ⭐️ LE PLUS POPULAIRE
            </div>
            <div style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', marginTop: '10px' }}>Pack Semaine</div>
            <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#B45309', margin: '0 0 16px 0', lineHeight: 1 }}>
              1 500 <span style={{ fontSize: '1rem', color: '#92400E', fontWeight: '700' }}>FCFA</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: '600' }}><span>📢</span> <strong>5 Annonces</strong> au choix</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#475569' }}><span>⏳</span> Valable pour 1 semaine (7j)</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#475569' }}><span>⚡</span> Rotation en tête de liste</li>
            </ul>
            <button onClick={() => initiatePayment('pack_5_annonces', 1500, 5)} className="active-scale" style={{ width: '100%', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', border: 'none', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245,158,11,0.2)' }}>
              Prendre le Pack Semaine
            </button>
          </div>

          {/* Pack Mensuel 5000 FCFA (10 annonces) */}
          <div style={{ background: '#FFFBEB', borderRadius: '24px', padding: '24px', border: '1.5px solid #FCD34D', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.85rem', color: '#B45309', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Pack Mensuel (VIP)</div>
            <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#92400E', margin: '0 0 16px 0', lineHeight: 1 }}>
              5 000 <span style={{ fontSize: '1rem', color: '#78350F', fontWeight: '700' }}>FCFA</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: '600' }}><span>📢</span> <strong>10 Annonces</strong> au choix</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#475569' }}><span>⏳</span> Valable pour 1 mois (30j)</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#475569' }}><span>🛡️</span> Badge Vendeur Pro inclus</li>
            </ul>
            <button onClick={() => initiatePayment('pack_10_annonces', 5000, 10)} className="active-scale" style={{ width: '100%', padding: '12px', borderRadius: '14px', background: '#B45309', color: 'white', border: 'none', fontWeight: '800', fontSize: '1rem', cursor: 'pointer' }}>
              Prendre le Pack VIP
            </button>
          </div>

          {/* Boost Reel Vidéo 1500 FCFA */}
          <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', borderRadius: '24px', padding: '24px', border: '1px solid #312E81', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>🎬 Spécial Vidéo</div>
            <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'white', margin: '0 0 16px 0', lineHeight: 1 }}>
              1 500 <span style={{ fontSize: '1rem', color: '#94A3B8', fontWeight: '700' }}>FCFA</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, color: '#E2E8F0' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: '600' }}><span>📱</span> <strong>1 Reel Vidéo</strong> publié</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><span>⏳</span> Valable pour 1 semaine (7j)</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><span>🔥</span> Flux vidéo immersif type TikTok</li>
            </ul>
            <button onClick={() => initiatePayment('boost_reel_semaine', 1500, 0)} className="active-scale" style={{ width: '100%', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #E11D48, #BE123C)', color: 'white', border: 'none', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(225,29,72,0.3)' }}>
              Activer Reel Vidéo
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

      {/* Modal de Sélection des Annonces */}
      {showProductSelectionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', position: 'relative', animation: 'scaleUp 0.3s ease-out' }}>
            <button onClick={() => setShowProductSelectionModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 8px 0', fontFamily: 'var(--font-heading)' }}>Sélectionnez vos annonces</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Choisissez jusqu'à <strong>{maxSelectionLimit} annonce(s)</strong> à mettre en vedette. ({selectedProductIds.length}/{maxSelectionLimit} sélectionnées)
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', marginBottom: '20px' }}>
              {userProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: '#F8FAFC', borderRadius: '16px' }}>
                  Vous n'avez pas encore d'annonce publiée.
                </div>
              ) : (
                userProducts.map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png';
                  
                  return (
                    <div 
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '12px', 
                        border: `2px solid ${isSelected ? '#F59E0B' : '#E2E8F0'}`, 
                        borderRadius: '16px', 
                        background: isSelected ? '#FFFBEB' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: `2px solid ${isSelected ? '#F59E0B' : '#CBD5E1'}`, background: isSelected ? '#F59E0B' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <img src={imageUrl} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '10px' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={handleSelectionConfirm} disabled={selectedProductIds.length === 0} className="active-scale" style={{ width: '100%', padding: '16px', borderRadius: '14px', fontWeight: '800', fontSize: '1rem', background: selectedProductIds.length > 0 ? '#F59E0B' : '#CBD5E1', color: 'white', border: 'none', cursor: selectedProductIds.length > 0 ? 'pointer' : 'not-allowed', transition: 'background 0.2s ease' }}>
              Continuer vers le paiement ({selectedProductIds.length} sélectionnée{selectedProductIds.length > 1 ? 's' : ''})
            </button>
          </div>
        </div>
      )}

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
