import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { openWavePayment } from '../config/paymentConfig';

const CartPage = () => {
  // Mock cart items based on the mockup
  const [items, setItems] = useState([]);

  const [promoCode, setPromoCode] = useState('');

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal; // Assuming free shipping as in mockup

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setItems(items.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
    toast.success("Article retiré du panier", {
      icon: '🗑️',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  return (
    <div className="cart-page" style={{ padding: '2rem 1rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Mon Panier</h1>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          👤
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Votre panier est vide</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Découvrez nos meilleures offres et remplissez-le !</p>
          <Link to="/" className="btn-primary active-scale" style={{ display: 'inline-flex', padding: '0.9rem 2rem', borderRadius: 'var(--radius-pill)', fontWeight: '600' }}>
            Commencer mes achats
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map(item => (
              <div key={item.id} className="cart-item" style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                  <img src={item.image} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: '0 0 0.2rem 0' }}>{item.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{item.size}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div style={{ background: '#fdf2f2', color: '#8a1c1c', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {(item.price || 0).toLocaleString('fr-FR')} F CFA
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.quantity} ˅</span>
                      <button onClick={() => removeItem(item.id)} className="touch-target active-scale" style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#e74c3c' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', background: 'white', padding: '0.5rem', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-sm)' }}>
            <input 
              type="text" 
              placeholder="Entrer code promo" 
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.5rem 1rem', outline: 'none', fontSize: '0.9rem' }}
            />
            <button className="btn-primary active-scale" style={{ padding: '0.5rem 1.5rem', margin: 0 }}>Appliquer</button>
          </div>

          {/* Summary */}
          <div style={{ marginTop: '2rem', background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Sous-total:</span>
              <span style={{ fontWeight: '600' }}>{(subtotal || 0).toLocaleString('fr-FR')} F CFA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Frais:</span>
              <span style={{ fontWeight: '600' }}>0 F CFA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Mode de Livraison
              </span>
              <select style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--primary)', border: 'none', background: 'transparent', outline: 'none', textAlign: 'right' }}>
                <option>Express (Tiak-Tiak)</option>
                <option>Point Relais (Dakar)</option>
                <option>Expédition en Région</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>Total:</span>
              <span style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--primary)' }}>{(total || 0).toLocaleString('fr-FR')} F CFA</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="active-scale" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', borderRadius: '12px', background: 'var(--text-main)', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                🤝 Paiement à la livraison
              </button>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => openWavePayment()} className="active-scale" style={{ flex: 1, padding: '0.9rem', fontSize: '1.05rem', borderRadius: '12px', background: 'var(--color-primary, #4F46E5)', color: 'white', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                  💳 Payer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
