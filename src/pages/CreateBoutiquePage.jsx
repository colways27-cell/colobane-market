import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { senegalRegions } from '../data/locations';

const InputWrapper = ({ label, required, children }) => (
  <div style={{ marginBottom: '1.2rem' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>
      {label} {required && <span style={{ color: '#e74c3c' }}>*</span>}
    </label>
    <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', background: '#FAFAF9' }}>
      {children}
    </div>
  </div>
);

const FastInput = ({ value, onChange, ...props }) => {
  const [localVal, setLocalVal] = useState(value || '');
  useEffect(() => { setLocalVal(value || ''); }, [value]);
  return <input value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={e => onChange({ target: { name: props.name, value: localVal } })} {...props} />;
};

const FastTextarea = ({ value, onChange, ...props }) => {
  const [localVal, setLocalVal] = useState(value || '');
  useEffect(() => { setLocalVal(value || ''); }, [value]);
  return <textarea value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={e => onChange({ target: { name: props.name, value: localVal } })} {...props} />;
};

const CreateBoutiquePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    boutique_name: '',
    boutique_description: '',
    business_hours: 'Lun-Sam: 09h-19h',
    region: 'Dakar',
    quartier: ''
  });

  // Met à jour le quartier par défaut si la région change
  useEffect(() => {
    const defaultQuartier = senegalRegions[formData.region][0];
    if (!senegalRegions[formData.region].includes(formData.quartier)) {
      setFormData(prev => ({ ...prev, quartier: defaultQuartier }));
    }
  }, [formData.region]);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        if (data.account_type === 'boutique') {
          toast.success("Vous avez déjà une boutique !");
          navigate('/profile');
        }
        setFormData(prev => ({
          ...prev,
          boutique_name: data.boutique_name || data.full_name || '',
          boutique_description: data.boutique_description || '',
          business_hours: data.business_hours || 'Lun-Sam: 09h-19h'
        }));
      }
    };
    
    fetchProfile();
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.boutique_name) {
      toast.error("Le nom de la boutique est obligatoire.");
      return;
    }
    if (!formData.region || !formData.quartier) {
      toast.error("Veuillez sélectionner une adresse complète.");
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = undefined;
      
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `logo_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        // Utilisation du bucket 'products' déjà configuré
        const { error: uploadError } = await supabase.storage.from('products').upload(filePath, logoFile);
        
        if (!uploadError) {
          const { data } = supabase.storage.from('products').getPublicUrl(filePath);
          avatarUrl = data.publicUrl;
        } else {
          console.error("Erreur upload logo:", uploadError);
          toast.error("Le logo n'a pas pu être téléchargé.");
        }
      }

      const fullLocation = `${formData.quartier}, ${formData.region}`;
      
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 15);
      
      const updateData = {
        account_type: 'boutique',
        boutique_name: formData.boutique_name,
        boutique_description: formData.boutique_description,
        location: fullLocation,
        city: formData.region,
        business_hours: formData.business_hours,
        subscription_status: 'trial',
        subscription_plan: 'none',
        trial_end_date: trialEndDate.toISOString()
      };

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Boutique créée ! Vous avez 15 jours d\'essai gratuits.');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      toast.error("Une erreur s'est produite lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '120px' }}>
      
      {/* Premium Header */}
      <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.85)', zIndex: 100, backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', alignItems: 'center', padding: '16px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <button onClick={() => navigate(-1)} className="touch-target active-scale hover-lift" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.25rem', fontWeight: '900', margin: 0, paddingRight: '44px', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
          Créer ma Boutique
        </h1>
      </div>

      <div className="section-container" style={{ padding: '24px 16px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Welcome Banner */}
        <div className="animate-fade-in-up stagger-1 glass-panel" style={{ textAlign: 'center', marginBottom: '2.5rem', background: 'var(--primary-gradient)', borderRadius: '24px', padding: '2.5rem 1.5rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', opacity: 0.1 }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="hover-lift" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem auto', boxShadow: '0 12px 30px rgba(0,0,0,0.2)' }}>
              🏪
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Ouvrir ma Boutique</h2>
            <p style={{ fontSize: '1.05rem', opacity: 0.9, marginBottom: '1.5rem', fontWeight: '500' }}>Bénéficiez d'une vitrine officielle pour vos produits.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', padding: '10px 20px', borderRadius: '20px', fontSize: '0.95rem', fontWeight: '800', border: '1px solid rgba(255,255,255,0.3)' }}>
              🎁 15 jours d'essai gratuits. Sans engagement.
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="animate-fade-in-up stagger-2 glass-panel" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '24px', padding: '2rem', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem', border: '2px dashed #cbd5e1', fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              <div style={{ lineHeight: '1.5' }}>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '1rem', color: 'var(--primary)' }}>Bon à savoir</strong>
                Vos numéros d'appel et WhatsApp seront automatiquement repris de votre profil existant.
              </div>
            </div>

            {/* Logo Upload Section */}
            <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1rem', fontWeight: '800', width: '100%', textAlign: 'left' }}>Logo de la boutique (Optionnel)</label>
              <label 
                className="active-scale touch-target hover-lift" 
                style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', border: '3px dashed #cbd5e1', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'all 0.3s', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ background: 'white', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginBottom: '8px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" color="var(--primary)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>Ajouter</div>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <InputWrapper label="Nom de la boutique" required>
                <FastInput type="text" name="boutique_name" value={formData.boutique_name} onChange={handleInputChange} placeholder="Ex: Dakar Électronique" style={{ flex: 1, padding: '1.2rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '1.05rem', fontWeight: '600' }} />
              </InputWrapper>

              <InputWrapper label="Description courte (Ce que vous vendez)">
                <FastTextarea name="boutique_description" rows="3" value={formData.boutique_description} onChange={handleInputChange} placeholder="Ex: Vente de téléphones, ordinateurs et accessoires garantis..." style={{ flex: 1, padding: '1.2rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', resize: 'vertical', fontWeight: '500', lineHeight: '1.5' }}></FastTextarea>
              </InputWrapper>

              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <InputWrapper label="Région" required>
                  <select name="region" value={formData.region} onChange={handleInputChange} style={{ flex: 1, padding: '1.2rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', appearance: 'none', color: 'var(--text-main)', fontWeight: '600' }}>
                    {Object.keys(senegalRegions).map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
                </InputWrapper>

                <InputWrapper label="Quartier" required>
                  <select name="quartier" value={formData.quartier} onChange={handleInputChange} style={{ flex: 1, padding: '1.2rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', appearance: 'none', color: 'var(--text-main)', fontWeight: '600' }}>
                    {senegalRegions[formData.region]?.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
                </InputWrapper>
              </div>

              <InputWrapper label="Horaires d'ouverture">
                <FastInput type="text" name="business_hours" value={formData.business_hours} onChange={handleInputChange} placeholder="Ex: Lun-Sam: 09h-19h" style={{ flex: 1, padding: '1.2rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', fontWeight: '600' }} />
              </InputWrapper>
            </div>

            <button type="submit" disabled={loading} className="btn-primary active-scale hover-lift" style={{ width: '100%', marginTop: '2.5rem', padding: '1.2rem', borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '1.15rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(190,18,60,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              {loading ? (
                <>
                  <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                  Création en cours...
                </>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  Commencer mon essai gratuit
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBoutiquePage;
