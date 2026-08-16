import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const AdsManagementTab = () => {
  const [externalAds, setExternalAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAdIndex, setUploadingAdIndex] = useState(null);

  useEffect(() => {
    fetchAdsSettings();
  }, []);

  const fetchAdsSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'external_ads')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.setting_value) {
        setExternalAds(data.setting_value);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des publicités.');
    } finally {
      setLoading(false);
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
      toast.success('Publicités enregistrées avec succès !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAdImage = async (e, adIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAdIndex(adIndex);
      toast.loading("Upload du média en cours...", { id: 'upload_ad' });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `ad_${Date.now()}.${fileExt}`;
      const filePath = `external_ads/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      
      const isVideo = file.type.startsWith('video/');

      const updatedAds = [...externalAds];
      updatedAds[adIndex].image_url = data.publicUrl; // We keep image_url key for backward compatibility
      updatedAds[adIndex].media_type = isVideo ? 'video' : 'image';
      setExternalAds(updatedAds);
      
      toast.success('Média uploadé avec succès !', { id: 'upload_ad' });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'upload.", { id: 'upload_ad' });
    } finally {
      setUploadingAdIndex(null);
    }
  };

  const addEmptyAd = () => {
    const newAd = { 
      id: Date.now().toString(), 
      image_url: '', 
      media_type: 'image',
      link_url: '', 
      phone_number: '',
      alt_text: '', 
      start_date: '',
      end_date: '',
      is_active: false 
    };
    setExternalAds([newAd, ...externalAds]);
  };

  const removeAd = (index) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette campagne publicitaire ?')) return;
    const updated = [...externalAds];
    updated.splice(index, 1);
    handleSaveAds(updated);
  };

  const updateAdField = (index, field, value) => {
    const updated = [...externalAds];
    updated[index][field] = value;
    setExternalAds(updated);
  };

  const getAdStatus = (ad) => {
    if (!ad.is_active) return { label: 'Inactif', color: '#64748B', bg: '#F1F5F9' };
    
    const now = new Date();
    if (ad.start_date && new Date(ad.start_date) > now) {
      return { label: 'Programmée', color: '#B45309', bg: '#FEF3C7' };
    }
    if (ad.end_date && new Date(ad.end_date) < now) {
      return { label: 'Expirée', color: '#B91C1C', bg: '#FEE2E2' };
    }
    return { label: 'En cours', color: '#15803D', bg: '#DCFCE7' };
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Chargement de la régie publicitaire...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '900px', margin: '0 auto' }}>
      
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0F172A' }}>📢 Régie Publicitaire</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#64748B' }}>Gérez les campagnes de vos partenaires (Bannières & Vidéos).</p>
          </div>
          <button onClick={addEmptyAd} style={{ padding: '10px 18px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}>
            + Nouvelle Campagne
          </button>
        </div>
        
        {externalAds.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0', color: '#64748B', fontWeight: 600 }}>
            Aucune campagne publicitaire pour le moment.<br/>Cliquez sur "+ Nouvelle Campagne" pour commencer.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {externalAds.map((ad, index) => {
              const status = getAdStatus(ad);
              
              return (
                <div key={ad.id || index} style={{ padding: '16px', background: 'white', borderRadius: '16px', border: `1px solid ${ad.is_active ? '#CBD5E1' : '#E2E8F0'}`, display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                  
                  {/* HEADER CARD */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '1.1rem', color: ad.is_active ? '#0F172A' : '#94A3B8' }}>
                        <input 
                          type="checkbox" 
                          checked={ad.is_active} 
                          onChange={e => updateAdField(index, 'is_active', e.target.checked)}
                          style={{ width: '22px', height: '22px', accentColor: '#2563EB' }}
                        />
                        Activer
                      </label>
                      <span style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {status.label}
                      </span>
                    </div>
                    <button onClick={() => removeAd(index)} style={{ padding: '6px 12px', background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      🗑️ Supprimer
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
                    
                    {/* COLONNE GAUCHE: MEDIA & INFOS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      <div>
                        <label style={labelStyle}>Titre / Nom du partenaire</label>
                        <input 
                          type="text" 
                          value={ad.alt_text || ''} 
                          onChange={e => updateAdField(index, 'alt_text', e.target.value)}
                          style={inputStyle}
                          placeholder="Ex: Campagne Orange 2026"
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Média (Image ou Vidéo)</label>
                        <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                          {ad.image_url ? (
                            <div style={{ marginBottom: '12px', position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#0F172A', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {ad.media_type === 'video' ? (
                                <video src={ad.image_url} controls style={{ maxWidth: '100%', maxHeight: '200px' }} />
                              ) : (
                                <img src={ad.image_url} alt="Aperçu" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                              )}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '0.85rem' }}>
                              Aucun média sélectionné.
                            </div>
                          )}
                          
                          <label style={{ display: 'block', width: '100%', padding: '10px', background: 'white', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', color: '#334155' }}>
                            {uploadingAdIndex === index ? '⏳ Upload en cours...' : (ad.image_url ? 'Changer de fichier' : '📁 Uploader (Image / Vidéo)')}
                            <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => handleUploadAdImage(e, index)} disabled={uploadingAdIndex === index} />
                          </label>
                        </div>
                      </div>
                      
                    </div>

                    {/* COLONNE DROITE: DATES & ACTIONS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 120px', minWidth: '0' }}>
                          <label style={labelStyle}>Date de début</label>
                          <input 
                            type="datetime-local" 
                            value={ad.start_date || ''} 
                            onChange={e => updateAdField(index, 'start_date', e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ flex: '1 1 120px', minWidth: '0' }}>
                          <label style={labelStyle}>Date de fin</label>
                          <input 
                            type="datetime-local" 
                            value={ad.end_date || ''} 
                            onChange={e => updateAdField(index, 'end_date', e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div style={{ padding: '16px', background: '#F0F9FF', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
                        <h4 style={{ margin: '0 0 12px', color: '#0369A1', fontSize: '0.9rem' }}>Action au clic (Priorité au Lien Web)</h4>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{...labelStyle, color: '#0284C7'}}>Lien Web / WhatsApp (URL)</label>
                          <input 
                            type="url" 
                            value={ad.link_url || ''} 
                            onChange={e => updateAdField(index, 'link_url', e.target.value)}
                            style={{...inputStyle, borderColor: '#7DD3FC'}}
                            placeholder="Ex: https://wa.me/221..."
                          />
                        </div>

                        <div>
                          <label style={{...labelStyle, color: '#0284C7'}}>OU Numéro de téléphone</label>
                          <input 
                            type="tel" 
                            value={ad.phone_number || ''} 
                            onChange={e => updateAdField(index, 'phone_number', e.target.value)}
                            style={{...inputStyle, borderColor: '#7DD3FC'}}
                            placeholder="Ex: +221770000000"
                          />
                          <p style={{ fontSize: '0.75rem', color: '#0284C7', margin: '4px 0 0' }}>Sera utilisé si aucun lien web n'est fourni.</p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ position: 'sticky', bottom: '20px', zIndex: 10 }}>
              <button onClick={() => handleSaveAds(externalAds)} disabled={isSaving} style={btnSaveStyle}>
                {isSaving ? '⏳ Sauvegarde en cours...' : '💾 Enregistrer Toutes les Modifications'}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

const panelStyle = {
  background: 'white',
  borderRadius: '24px',
  padding: '30px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
};

const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#475569', margin: '0 0 8px 0' };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.95rem', boxSizing: 'border-box' };

const btnSaveStyle = {
  width: '100%',
  padding: '16px',
  background: '#0F172A',
  color: 'white',
  border: 'none',
  borderRadius: '16px',
  fontWeight: 900,
  fontSize: '1.1rem',
  cursor: 'pointer',
  boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)',
  transition: 'transform 0.1s, box-shadow 0.1s',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

export default AdsManagementTab;
