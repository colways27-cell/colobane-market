import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const senegalLocations = {
  "Dakar": ["Dakar Plateau", "Médina", "Fass-Colobane", "Point E", "Almadies", "Ngor", "Yoff", "Ouakam", "Mermoz-Sacré-Cœur", "Grand Dakar", "HLM", "Sicap-Liberté", "Dieuppeul-Derklé", "Parcelles Assainies", "Patte d'Oie", "Grand Yoff", "Pikine", "Guédiawaye", "Rufisque", "Keur Massar", "Diamniadio", "Sébikotane"],
  "Thiès": ["Thiès Ville", "Mbour", "Saly Portudal", "Somone", "Ngaparou", "Popenguine", "Tivaouane", "Joal-Fadiouth"],
  "Diourbel": ["Touba", "Mbacké", "Diourbel", "Bambey"],
  "Saint-Louis": ["Saint-Louis Ville", "Richard-Toll", "Dagana", "Podor"],
  "Ziguinchor": ["Ziguinchor Ville", "Bignona", "Cap Skirring", "Oussouye"],
  "Kaolack": ["Kaolack Ville", "Nioro du Rip", "Guinguinéo"],
  "Fatick": ["Fatick Ville", "Foundiougne", "Sokone"],
  "Louga": ["Louga Ville", "Kébémer", "Linguère"],
  "Kolda": ["Kolda Ville", "Vélingara"],
  "Tambacounda": ["Tambacounda Ville", "Bakel", "Goudiry"],
  "Kédougou": ["Kédougou Ville", "Saraya"],
  "Matam": ["Matam Ville", "Ourossogui", "Kanel"],
  "Kaffrine": ["Kaffrine Ville", "Koungheul"],
  "Sédhiou": ["Sédhiou Ville", "Goudomp"]
};

const InputWrapper = ({ icon, children, label }) => (
  <div style={{ marginBottom: '1rem' }}>
    {label && <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: '500', paddingLeft: '4px' }}>{label}</label>}
    <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: '16px', border: '1px solid transparent', transition: 'border 0.2s', padding: '0 16px', height: '54px' }} className="auth-input-container">
      {icon && <div style={{ color: '#94A3B8', marginRight: '12px', display: 'flex' }}>{icon}</div>}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: '100%' }}>
        {children}
      </div>
    </div>
  </div>
);

const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [phone, setPhone] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState('');
  const navigate = useNavigate();

  // Detect Supabase recovery event (when user clicks reset link from email)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setIsResetMode(false);
        setIsRegister(false);
        setSuccessMsg('');
        setErrorMsg('');
      }
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Handle new password submission after clicking reset link
  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (!newPassword || newPassword.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
      if (newPassword !== confirmPassword) throw new Error("Les deux mots de passe ne correspondent pas.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccessMsg("✅ Mot de passe modifié avec succès ! Vous pouvez maintenant vous connecter.");
      setIsRecoveryMode(false);
      setIsRegister(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMsg(error.message || "Impossible de changer le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  const [resetPhone, setResetPhone] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [verifyName, setVerifyName] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');

  const handleResetIdentity = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const digits = resetPhone.replace(/\s+/g, '').replace(/^0+/, '');
      if (digits.length !== 9) throw new Error('Le numéro doit contenir 9 chiffres.');
      if (!verifyName.trim()) throw new Error('Veuillez entrer votre nom complet.');

      // Vérifier que le numéro existe
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .or(`whatsapp_number.eq.+221${digits},phone_number.eq.+221${digits}`)
        .limit(1);

      if (!profiles || profiles.length === 0)
        throw new Error("Aucun compte trouvé avec ce numéro.");

      setResetStep(2);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (newResetPassword.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
      if (newResetPassword !== confirmResetPassword) throw new Error('Les deux mots de passe ne correspondent pas.');

      const digits = resetPhone.replace(/\s+/g, '').replace(/^0+/, '');

      const { data, error } = await supabase.rpc('reset_password_by_phone', {
        p_phone: `+221${digits}`,
        p_full_name: verifyName.trim(),
        p_new_password: newResetPassword
      });

      if (error) throw error;

      if (data && data.success) {
        setSuccessMsg('✅ ' + data.message + ' Vous pouvez maintenant vous connecter.');
        setTimeout(() => {
          setIsResetMode(false);
          setResetStep(1);
          setResetPhone(''); setVerifyName('');
          setNewResetPassword(''); setConfirmResetPassword('');
        }, 2500);
      } else {
        throw new Error(data?.message || 'Vérification échouée.');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const digits = phone.replace(/\s+/g, '').replace(/^0+/, '');
      const formattedPhone = phone.startsWith('+') ? phone : `+221${digits}`;
      const fakeEmail = `${formattedPhone.replace('+', '')}@colobanemarket.local`;

      if (isRegister) {
        if (!acceptTerms) {
          throw new Error("Vous devez accepter les conditions d'utilisation.");
        }
        
        // Use real email as auth email if provided, otherwise use fake phone email
        const authEmail = email ? email.trim().toLowerCase() : fakeEmail;
        
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: password,
          options: {
            data: {
              full_name: `${prenom} ${nom}`.trim(),
              pseudo: pseudo.trim() || `${prenom}`.trim(),
              whatsapp_number: formattedPhone,
              city: city,
              real_email: email || undefined,
              phone_auth_email: fakeEmail
            }
          }
        });
        
        if (error) throw error;
        
        setSuccessMsg("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        setIsRegister(false);
      } else {
        // LOGIN: try with fake phone email first (backward compatible with old accounts)
        let loginResult = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password: password
        });
        
        // If failed, try looking up real email from profiles
        if (loginResult.error) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('email')
            .or(`whatsapp_number.eq.${formattedPhone},phone_number.eq.${formattedPhone}`)
            .limit(1);
          
          if (profiles && profiles.length > 0 && profiles[0].email && !profiles[0].email.endsWith('@colobanemarket.local')) {
            loginResult = await supabase.auth.signInWithPassword({
              email: profiles[0].email,
              password: password
            });
          }
        }
        
        if (loginResult.error) {
          if (loginResult.error.message.includes('Invalid login credentials')) {
            throw new Error('Numéro de téléphone ou mot de passe incorrect.');
          }
          throw loginResult.error;
        }
        navigate('/');
      }
    } catch (error) {
      setErrorMsg(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ background: 'var(--primary)', padding: '2rem 1.5rem 3.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: 'white' }}>
        <div style={{ width: '90px', height: '90px', background: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <img src="/image marque.jpg" alt="Colobane Market" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem', fontFamily: 'var(--font-heading)' }}>
          {isResetMode ? 'Mot de passe oublié' : isRegister ? 'Créer un compte' : 'Bon retour'}
        </h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          {isResetMode ? 'Réinitialisez votre mot de passe en 3 étapes' : isRegister ? "Rejoins le plus grand marché du Sénégal" : "Connecte-toi pour continuer tes achats"}
        </p>
      </div>

      <div style={{ flex: 1, background: 'white', borderRadius: '24px 24px 0 0', marginTop: '-24px', padding: '1.5rem', paddingBottom: '100px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
        
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          
          {!isResetMode && !isRecoveryMode ? (
            <div style={{ background: '#F1F5F9', padding: '4px', borderRadius: '99px', display: 'flex', marginBottom: '2rem', position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                top: '4px', 
                bottom: '4px', 
                left: isRegister ? '4px' : '50%', 
                width: 'calc(50% - 4px)', 
                background: 'white', 
                borderRadius: '99px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
              <button 
                type="button"
                onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '99px', border: 'none', background: 'transparent', color: isRegister ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isRegister ? '700' : '500', fontSize: '0.95rem', cursor: 'pointer', position: 'relative', zIndex: 1, transition: 'color 0.3s' }}
              >
                Inscription
              </button>
              <button 
                type="button"
                onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '99px', border: 'none', background: 'transparent', color: !isRegister ? 'var(--primary)' : 'var(--text-muted)', fontWeight: !isRegister ? '700' : '500', fontSize: '0.95rem', cursor: 'pointer', position: 'relative', zIndex: 1, transition: 'color 0.3s' }}
              >
                Déjà membre ?
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              onClick={() => { setIsResetMode(false); setResetStep(1); setResetPhone(''); setVerifyName(''); setNewResetPassword(''); setConfirmResetPassword(''); setErrorMsg(''); setSuccessMsg(''); }} 
              style={{ background: '#F1F5F9', border: 'none', padding: '8px 16px', borderRadius: '20px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              ← Retour à la connexion
            </button>
          )}

          {errorMsg && <div style={{ color: '#e74c3c', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', padding: '0.8rem', background: '#fdf0ed', borderRadius: '12px' }}><span>{errorMsg}</span></div>}
          {successMsg && <div style={{ color: '#2ecc71', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', padding: '0.8rem', background: '#eafaf1', borderRadius: '12px' }}><span>{successMsg}</span></div>}

          <style>{`
            .auth-input-container:focus-within { border-color: var(--primary) !important; background: white !important; box-shadow: 0 0 0 4px rgba(138, 28, 28, 0.05); }
            .clean-input { width: 100%; height: 100%; border: none; background: transparent; outline: none; font-size: 0.95rem; color: var(--text-main); }
            .clean-input::placeholder { color: #CBD5E1; }
          `}</style>

          {isResetMode ? (
            <div>
              {/* Step indicator */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                {[1, 2].map(s => (
                  <div key={s} style={{
                    width: s === resetStep ? '36px' : '12px', height: '10px', borderRadius: '99px',
                    background: s <= resetStep ? 'var(--primary)' : '#E2E8F0',
                    transition: 'all 0.3s'
                  }} />
                ))}
              </div>

              {resetStep === 1 && (
                <form onSubmit={handleResetIdentity}>
                  <InputWrapper label="Numéro de téléphone">
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', borderRight: '1px solid #E2E8F0', paddingRight: '12px', marginRight: '12px', height: '60%' }}>
                      <span style={{ color: '#94A3B8', marginRight: '4px', fontSize: '0.8rem' }}>SN</span> +221
                    </div>
                    <input type="tel" value={resetPhone} onChange={e => setResetPhone(e.target.value)} required placeholder="77 123 45 67" className="clean-input" style={{ letterSpacing: '1px' }} />
                  </InputWrapper>
                  <InputWrapper label="Nom complet (Prénom + Nom)" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}>
                    <input type="text" value={verifyName} onChange={e => setVerifyName(e.target.value)} required placeholder="Aminata Diallo" className="clean-input" />
                  </InputWrapper>
                  <button type="submit" className="active-scale" disabled={loading} style={{ width: '100%', background: 'var(--primary)', color: 'white', padding: '1.1rem', borderRadius: '16px', border: 'none', fontWeight: '700', fontSize: '1rem', marginTop: '0.5rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(138, 28, 28, 0.25)' }}>
                    {loading ? 'Vérification...' : 'Vérifier mon identité →'}
                  </button>
                </form>
              )}

              {resetStep === 2 && (
                <form onSubmit={handleResetPassword}>
                  <InputWrapper label="Nouveau mot de passe" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>}>
                    <input type="password" value={newResetPassword} onChange={e => setNewResetPassword(e.target.value)} required placeholder="Min. 6 caractères" className="clean-input" />
                  </InputWrapper>
                  <InputWrapper label="Confirmer le mot de passe" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}>
                    <input type="password" value={confirmResetPassword} onChange={e => setConfirmResetPassword(e.target.value)} required placeholder="Retapez le mot de passe" className="clean-input" />
                  </InputWrapper>
                  <button type="submit" className="active-scale" disabled={loading} style={{ width: '100%', background: 'var(--primary)', color: 'white', padding: '1.1rem', borderRadius: '16px', border: 'none', fontWeight: '700', fontSize: '1rem', marginTop: '0.5rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(138, 28, 28, 0.25)' }}>
                    {loading ? 'Réinitialisation...' : '✅ Changer mon mot de passe'}
                  </button>
                  <button type="button" onClick={() => { setResetStep(1); setErrorMsg(''); }} style={{ width: '100%', background: '#F1F5F9', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '16px', border: 'none', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                    ← Retour
                  </button>
                </form>
              )}

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0 0 0.4rem 0' }}>Vous avez des difficultés ?</p>
                <a
                  href={`https://wa.me/221773713175?text=${encodeURIComponent("Bonjour ColobaneMarket, j'ai oublié mon mot de passe et j'ai besoin d'aide.")}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.85rem', color: '#25D366', fontWeight: '600', textDecoration: 'none' }}
                >
                  💬 Contacter l'assistance WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              
              {isRegister && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <InputWrapper label="Prénom" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}>
                      <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required placeholder="Aminata" className="clean-input" />
                    </InputWrapper>
                  </div>
                  <div style={{ flex: 1 }}>
                    <InputWrapper label="Nom">
                      <input type="text" value={nom} onChange={e => setNom(e.target.value)} required placeholder="Diallo" className="clean-input" />
                    </InputWrapper>
                  </div>
                </div>
              )}

              <InputWrapper label="Téléphone (WhatsApp)">
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', borderRight: '1px solid #E2E8F0', paddingRight: '12px', marginRight: '12px', height: '60%' }}>
                  <span style={{ color: '#94A3B8', marginRight: '4px', fontSize: '0.8rem' }}>SN</span> +221
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => {
                    const val = e.target.value;
                    setPhone(val);
                    const digits = val.replace(/\s+/g, '').replace(/^0+/, '');
                    if (digits.length > 0 && digits.length !== 9) {
                      setPhoneWarning('Les numéros sénégalais font 9 chiffres (ex: 77 123 45 67)');
                    } else {
                      setPhoneWarning('');
                    }
                  }}
                  required
                  placeholder="77 123 45 67"
                  className="clean-input"
                  style={{ letterSpacing: '1px' }}
                />
              </InputWrapper>
              {phoneWarning && (
                <p style={{ color: '#f39c12', fontSize: '0.8rem', marginTop: '-0.7rem', marginBottom: '0.8rem', paddingLeft: '4px' }}>
                  ⚠️ {phoneWarning}
                </p>
              )}

              {isRegister && (
                <>
                  <InputWrapper label="Pseudo (nom affiché sur le marketplace)" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path></svg>}>
                    <input type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} required placeholder="Ex: Boutique_Aminata, ColobaneShop..." className="clean-input" />
                  </InputWrapper>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '-0.7rem', marginBottom: '0.8rem', paddingLeft: '4px' }}>
                    👁️ Ce nom sera visible par les autres utilisateurs
                  </p>

                  <InputWrapper label="Email (optionnel — pour récupérer votre mot de passe)" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>}>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="aminata@gmail.com" className="clean-input" />
                  </InputWrapper>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '-0.7rem', marginBottom: '0.8rem', paddingLeft: '4px' }}>
                    🔒 Si vous oubliez votre mot de passe, on vous enverra un lien par e-mail
                  </p>

                  <InputWrapper label="Région / Quartier" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>}>
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <select value={city} onChange={e => setCity(e.target.value)} className="clean-input" required style={{ color: city ? 'var(--text-main)' : '#94A3B8', appearance: 'none', cursor: 'pointer', width: '100%', height: '100%' }}>
                        <option value="" disabled>Sélectionne ta localité...</option>
                        {Object.entries(senegalLocations).map(([region, cities]) => (
                          <optgroup key={region} label={region}>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94A3B8' }}>▼</div>
                    </div>
                  </InputWrapper>
                </>
              )}

              <InputWrapper label="Mot de passe" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 caractères" className="clean-input" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0 8px' }}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </InputWrapper>

              {!isRegister && (
                <div style={{ textAlign: 'right', marginTop: '-0.3rem', marginBottom: '1.2rem' }}>
                  <button
                    type="button"
                    onClick={() => { setIsResetMode(true); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              {isRegister && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="terms" 
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <label htmlFor="terms" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', cursor: 'pointer' }}>
                    J'accepte les <a href="#" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>conditions d'utilisation</a> et la <a href="#" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>politique de confidentialité</a>
                  </label>
                </div>
              )}

              <button type="submit" className="active-scale" disabled={loading} style={{ width: '100%', background: 'var(--primary)', color: 'white', padding: '1.1rem', borderRadius: '16px', border: 'none', fontWeight: '700', fontSize: '1rem', marginTop: '0.5rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(138, 28, 28, 0.25)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                {loading ? <span>Traitement en cours...</span> : (
                  <>
                    <span>{isRegister ? 'Créer mon compte' : 'Se connecter'}</span>
                    {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                  </>
                )}
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
