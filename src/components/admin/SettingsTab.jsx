import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const SettingsTab = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Valeurs locales pour les formulaires
  const [pricingForm, setPricingForm] = useState({});
  const [promoForm, setPromoForm] = useState({
    is_active: false,
    message: '',
    bg_color: '#DC2626',
    text_color: '#FFFFFF',
    link_url: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) {
        if (error.code === '42P01') {
          // La table n'existe pas encore
          toast.error('Table app_settings introuvable. Exécutez le script SQL.', { duration: 5000 });
          return;
        }
        throw error;
      }

      const settingsObj = {};
      data.forEach(s => { settingsObj[s.setting_key] = s.setting_value; });
      setSettings(settingsObj);

      if (settingsObj.pricing_plans) {
        setPricingForm(settingsObj.pricing_plans);
      }
      if (settingsObj.promo_banner) {
        setPromoForm(settingsObj.promo_banner);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des paramètres.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromo = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('app_settings')
        .upsert({ setting_key: 'promo_banner', setting_value: promoForm }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      toast.success('Bannière promotionnelle mise à jour !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur de sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePricing = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('app_settings')
        .upsert({ setting_key: 'pricing_plans', setting_value: pricingForm }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      toast.success('Prix et forfaits mis à jour !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur de sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement des paramètres...</div>;
  }

  if (!settings) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#FEF2F2', color: '#991B1B', borderRadius: '16px', border: '1px solid #FCA5A5' }}>
        <h3>⚠️ Configuration requise</h3>
        <p>La table <code>app_settings</code> n'existe pas ou vous n'avez pas les droits d'accès.</p>
        <p>Veuillez exécuter le script <strong>supabase_settings_table.sql</strong> dans votre console Supabase.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Bannière Promotionnelle */}
      <div style={panelStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>📣 Bannière Promotionnelle</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={promoForm.is_active} 
              onChange={e => setPromoForm({ ...promoForm, is_active: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            Activer la bannière sur le site
          </label>

          <div>
            <label style={labelStyle}>Message de la bannière</label>
            <input 
              type="text" 
              value={promoForm.message} 
              onChange={e => setPromoForm({ ...promoForm, message: e.target.value })}
              style={inputStyle}
              placeholder="Ex: -50% sur les boosts !"
            />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Couleur de fond</label>
              <input 
                type="color" 
                value={promoForm.bg_color} 
                onChange={e => setPromoForm({ ...promoForm, bg_color: e.target.value })}
                style={{ width: '100%', height: '40px', padding: '0', cursor: 'pointer' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Couleur du texte</label>
              <input 
                type="color" 
                value={promoForm.text_color} 
                onChange={e => setPromoForm({ ...promoForm, text_color: e.target.value })}
                style={{ width: '100%', height: '40px', padding: '0', cursor: 'pointer' }}
              />
            </div>
          </div>

          {promoForm.is_active && (
            <div style={{ marginTop: '10px' }}>
              <label style={labelStyle}>Aperçu :</label>
              <div style={{ 
                background: promoForm.bg_color, 
                color: promoForm.text_color, 
                padding: '12px', 
                borderRadius: '8px', 
                textAlign: 'center', 
                fontWeight: 700 
              }}>
                {promoForm.message || 'Votre message ici'}
              </div>
            </div>
          )}

          <button onClick={handleSavePromo} disabled={isSaving} style={btnSaveStyle}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer la Bannière'}
          </button>
        </div>
      </div>

      {/* Pricing / Forfaits */}
      <div style={panelStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>💰 Gestion des Prix (FCFA)</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '20px' }}>Modifiez ici le prix des forfaits et boosts. Ces prix s'appliqueront immédiatement sur la page d'abonnement.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(pricingForm).map(([key, plan]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>{plan.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {plan.ads_count && `${plan.ads_count} annonce(s)`} {plan.duration_days && `• ${plan.duration_days} jours`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  value={plan.price} 
                  onChange={e => setPricingForm({
                    ...pricingForm,
                    [key]: { ...plan, price: Number(e.target.value) }
                  })}
                  style={{ width: '120px', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 800, textAlign: 'right' }}
                />
                <span style={{ fontWeight: 800, color: '#64748B' }}>FCFA</span>
              </div>
            </div>
          ))}

          <button onClick={handleSavePricing} disabled={isSaving} style={btnSaveStyle}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer les Prix'}
          </button>
        </div>
      </div>

    </div>
  );
};

const panelStyle = {
  background: 'white',
  borderRadius: '20px',
  padding: '24px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
};

const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.95rem' };

const btnSaveStyle = {
  marginTop: '10px',
  padding: '14px',
  background: '#0F172A',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontWeight: 800,
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'transform 0.1s',
  ':active': { transform: 'scale(0.98)' }
};

export default SettingsTab;
