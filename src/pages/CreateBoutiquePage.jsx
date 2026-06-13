import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { senegalRegions } from '../data/locations';

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
      
      toast.success('Boutique créée avec succès !');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      toast.error("Une erreur s'est produite lors de la création.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', minHeight: '100vh', paddingBottom: '120px' }}>
      <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 100, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <button onClick={() => navigate(-1)} className="touch-target active-scale" style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', fontWeight: '800', margin: 0, paddingRight: '40px', fontFamily: 'var(--font-heading)' }}>
          Créer ma Boutique
        </h1>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem auto' }}>
            🏪
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>Passez en compte pro</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Bénéficiez d'une vitrine officielle, d'un tableau de bord avancé et gagnez la confiance des acheteurs.</p>
          
          <div style={{ marginTop: '1rem', display: 'inline-block', background: '#ecfdf5', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '700', border: '1px solid #a7f3d0' }}>
            🎁 15 jours d'essai gratuits. Sans engagement.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px dashed #cbd5e1', fontSize: '0.9rem', color: 'var(--text-main)' }}>
            💡 <strong>Bon à savoir :</strong> Vos numéros d'appel et WhatsApp seront automatiquement repris de votre profil.
          </div>

          {/* Logo Upload Section */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: '500', width: '100%', textAlign: 'left' }}>Logo de la boutique (Optionnel)</label>
            <label 
              className="active-scale touch-target" 
              style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', border: '2px dashed var(--primary)', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ color: 'var(--primary)', textAlign: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <div style={{ fontSize: '10px', marginTop: '4px', fontWeight: '600' }}>Ajouter</div>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
            </label>
          </div>

          <InputWrapper label="Nom de la boutique" required>
            <input type="text" name="boutique_name" value={formData.boutique_name} onChange={handleInputChange} placeholder="Ex: Dakar Électronique" style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} />
          </InputWrapper>

          <InputWrapper label="Description courte (Ce que vous vendez)">
            <textarea name="boutique_description" rows="3" value={formData.boutique_description} onChange={handleInputChange} placeholder="Ex: Vente de téléphones, ordinateurs et accessoires garantis..." style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', resize: 'vertical' }}></textarea>
          </InputWrapper>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <InputWrapper label="Région" required>
                <select name="region" value={formData.region} onChange={handleInputChange} style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', appearance: 'none', color: 'var(--text-main)' }}>
                  {Object.keys(senegalRegions).map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
              </InputWrapper>
            </div>
            <div style={{ flex: 1 }}>
              <InputWrapper label="Quartier / Département" required>
                <select name="quartier" value={formData.quartier} onChange={handleInputChange} style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', appearance: 'none', color: 'var(--text-main)' }}>
                  {senegalRegions[formData.region]?.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
              </InputWrapper>
            </div>
          </div>

          <InputWrapper label="Horaires d'ouverture">
            <input type="text" name="business_hours" value={formData.business_hours} onChange={handleInputChange} placeholder="Ex: Lun-Sam: 09h-19h" style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} />
          </InputWrapper>

          <button type="submit" disabled={loading} className="btn-primary active-scale" style={{ width: '100%', marginTop: '1.5rem', padding: '1.1rem', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(139, 28, 49, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {loading ? 'Création en cours...' : 'Créer ma boutique'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBoutiquePage;
