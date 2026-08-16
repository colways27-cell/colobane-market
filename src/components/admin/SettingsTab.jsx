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
  const [externalAds, setExternalAds] = useState([]);
  const [uploadingAd, setUploadingAd] = useState(false);

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
      if (settingsObj.external_ads) {
        setExternalAds(settingsObj.external_ads);
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

  const handleSaveAds = async (adsToSave) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('app_settings')
        .upsert({ setting_key: 'external_ads', setting_value: adsToSave }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      setExternalAds(adsToSave);
      toast.success('Publicités mises à jour !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur de sauvegarde des publicités.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAdImage = async (e, adIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAd(true);
      toast.loading('Upload de l\\'image...', { id: 'upload_ad' });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `ad_${Date.now()}.${fileExt}`;
      const filePath = `external_ads/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      
      const updatedAds = [...externalAds];
      updatedAds[adIndex].image_url = data.publicUrl;
      setExternalAds(updatedAds);
      
      toast.success('Image uploadée avec succès !', { id: 'upload_ad' });
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\\'upload.', { id: 'upload_ad' });
    } finally {
      setUploadingAd(false);
    }
  };

  const addEmptyAd = () => {
    setExternalAds([{ id: Date.now().toString(), image_url: '', link_url: '', alt_text: '', is_active: false }, ...externalAds]);
  };

  const removeAd = (index) => {
    if (!window.confirm('Supprimer cette publicité ?')) return;
    const updated = [...externalAds];
    updated.splice(index, 1);
    handleSaveAds(updated);
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

      {/* Régie Publicitaire & Partenaires */}
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>📢 Régie Publicitaire & Partenaires</h3>
          <button onClick={addEmptyAd} style={{ padding: '8px 14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            + Ajouter
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '20px' }}>Gérez les bannières publicitaires externes. Elles s'afficheront sur la page d'accueil si elles sont activées et qu'une image est fournie.</p>
        
        {externalAds.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', color: '#64748B' }}>Aucune publicité pour le moment. Cliquez sur "+ Ajouter".</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {externalAds.map((ad, index) => (
              <div key={ad.id || index} style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={ad.is_active} 
                      onChange={e => {
                        const updated = [...externalAds];
                        updated[index].is_active = e.target.checked;
                        setExternalAds(updated);
                      }}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Publicité Active
                  </label>
                  <button onClick={() => removeAd(index)} style={{ padding: '4px 8px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                    Supprimer
                  </button>
                </div>

                <div>
                  <label style={labelStyle}>Image / Bannière</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {ad.image_url && (
                      <img src={ad.image_url} alt="Aperçu" style={{ height: '60px', width: 'auto', borderRadius: '8px', border: '1px solid #CBD5E1', objectFit: 'cover' }} />
                    )}
                    <label style={{ padding: '10px 14px', background: 'white', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                      {uploadingAd ? 'Chargement...' : 'Uploader une image'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadAdImage(e, index)} disabled={uploadingAd} />
                    </label>
                  </div>
                  {!ad.image_url && <span style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '4px', display: 'block' }}>Veuillez uploader une image pour que la pub s'affiche.</span>}
                </div>

                <div>
                  <label style={labelStyle}>Lien de redirection (Url optionnelle)</label>
                  <input 
                    type="url" 
                    value={ad.link_url || ''} 
                    onChange={e => {
                      const updated = [...externalAds];
                      updated[index].link_url = e.target.value;
                      setExternalAds(updated);
                    }}
                    style={inputStyle}
                    placeholder="Ex: https://wa.me/22177..."
                  />
                </div>

                <div>
                  <label style={labelStyle}>Texte Alternatif / Nom partenaire (interne)</label>
                  <input 
                    type="text" 
                    value={ad.alt_text || ''} 
                    onChange={e => {
                      const updated = [...externalAds];
                      updated[index].alt_text = e.target.value;
                      setExternalAds(updated);
                    }}
                    style={{...inputStyle, padding: '8px 12px'}}
                    placeholder="Ex: Campagne Orange"
                  />
                </div>
              </div>
            ))}

            <button onClick={() => handleSaveAds(externalAds)} disabled={isSaving} style={btnSaveStyle}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer les Publicités'}
            </button>
          </div>
        )}
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
