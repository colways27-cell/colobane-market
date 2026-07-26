import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_WHATSAPP = '221773713175';

const CertificationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    boutique_name: '',
    owner_name: '',
    phone: '',
    address: '',
    activity: '',
  });

  const [photos, setPhotos] = useState({
    boutique: null,
    identity: null,
    selfie: null,
  });

  const [previews, setPreviews] = useState({
    boutique: null,
    identity: null,
    selfie: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadUserProfile = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setForm(prev => ({
          ...prev,
          boutique_name: profile.boutique_name || profile.pseudo || profile.full_name || '',
          owner_name: profile.full_name || profile.pseudo || '',
          phone: profile.whatsapp_number || profile.phone_number || '',
          address: profile.city || 'Dakar, Sénégal',
          activity: 'Vente en ligne ColobaneMarket'
        }));
      }
    };
    loadUserProfile();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoto = (key, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotos((prev) => ({ ...prev, [key]: file }));
    setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
  };

  const uploadPhoto = async (file, path) => {
    const { data, error } = await supabase.storage
      .from('certification-requests')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('certification-requests')
      .getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photos.boutique || !photos.identity || !photos.selfie) {
      toast.error('Veuillez fournir toutes les photos requises.');
      return;
    }
    setIsSubmitting(true);
    toast.loading('Envoi de votre dossier...', { id: 'cert' });

    try {
      const ts = Date.now();
      const uid = user?.id || 'anonymous';

      // Upload the 3 photos
      const [boutiqueUrl, identityUrl, selfieUrl] = await Promise.all([
        uploadPhoto(photos.boutique, `${uid}/${ts}_boutique`),
        uploadPhoto(photos.identity, `${uid}/${ts}_identity`),
        uploadPhoto(photos.selfie, `${uid}/${ts}_selfie`),
      ]);

      // Insert request in DB
      const { error } = await supabase.from('certification_requests').insert([{
        user_id: uid,
        boutique_name: form.boutique_name,
        owner_name: form.owner_name,
        phone: form.phone,
        address: form.address,
        activity: form.activity,
        photo_boutique_url: boutiqueUrl,
        photo_identity_url: identityUrl,
        photo_selfie_url: selfieUrl,
        status: 'pending',
      }]);

      if (error) throw error;

      // Notify admin via WhatsApp
      const msg = encodeURIComponent(
        `🏅 Nouvelle demande de certification !\n\n` +
        `Boutique : ${form.boutique_name}\n` +
        `Propriétaire : ${form.owner_name}\n` +
        `Téléphone : ${form.phone}\n` +
        `Adresse : ${form.address}\n` +
        `Activité : ${form.activity}\n\n` +
        `Photos :\n📸 Boutique : ${boutiqueUrl}\n🪪 Identité : ${identityUrl}\n🤳 Selfie : ${selfieUrl}\n\n` +
        `Veuillez contacter le vendeur pour finaliser la vérification.`
      );
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, '_blank');

      toast.success('Dossier envoyé ! Nous vous contacterons dans les 24h.', { id: 'cert', duration: 6000 });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi. Réessayez ou contactez-nous directement.", { id: 'cert' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            Dossier envoyé avec succès !
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2rem' }}>
            Notre équipe va examiner votre dossier et vous contacter par téléphone sous <strong>24 à 48h</strong> pour finaliser votre certification.
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', marginBottom: '2rem', textAlign: 'left' }}>
            <p style={{ fontWeight: '700', color: '#15803d', marginBottom: '8px' }}>📋 Prochaines étapes :</p>
            <ul style={{ color: '#166534', fontSize: '0.9rem', lineHeight: '1.8', paddingLeft: '16px' }}>
              <li>Vérification de vos documents</li>
              <li>Appel de confirmation par notre équipe</li>
              <li>Activation du badge ✅ Certifié sur votre boutique</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="btn-primary active-scale"
            style={{ padding: '0.9rem 2rem', borderRadius: '12px', fontWeight: '700', border: 'none', cursor: 'pointer' }}
          >
            Retour au profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', paddingBottom: '120px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="active-scale touch-target"
          style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Demande de Certification
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Badge ✅ Boutique Certifiée ColobaneMarket
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: 'white', borderRadius: '16px', padding: '20px', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏅</div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 8px 0' }}>
          Pourquoi se certifier ?
        </h2>
        <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.8', fontSize: '0.9rem', opacity: 0.95 }}>
          <li>Badge officiel visible sur toutes vos annonces</li>
          <li>Confiance accrue des acheteurs</li>
          <li>Mise en avant prioritaire dans la section Boutiques</li>
          <li>Accès à la liste des "Boutiques Certifiées"</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Informations de la boutique */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--primary)' }}>
            📋 Informations de la boutique
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '6px' }}>
                Nom de la boutique *
              </label>
              <input
                name="boutique_name"
                value={form.boutique_name}
                onChange={handleChange}
                required
                placeholder="Ex: Teral Market"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '6px' }}>
                Nom du propriétaire *
              </label>
              <input
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                required
                placeholder="Prénom et nom"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '6px' }}>
                Numéro de téléphone *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                type="tel"
                placeholder="Ex: 77 123 45 67"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '6px' }}>
                Adresse de la boutique *
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                placeholder="Ex: Colobane, Dakar"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '6px' }}>
                Secteur d'activité *
              </label>
              <input
                name="activity"
                value={form.activity}
                onChange={handleChange}
                required
                placeholder="Ex: Vêtements, Électronique, Alimentation..."
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Photos requises */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--primary)' }}>
            📸 Photos requises
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
            Ces photos servent à vérifier l'identité du propriétaire et l'existence de la boutique.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Photo boutique */}
            <PhotoUpload
              label="📷 Photo de la boutique"
              hint="Façade ou intérieur de votre commerce"
              preview={previews.boutique}
              onChange={(e) => handlePhoto('boutique', e)}
              inputId="photo-boutique"
            />

            {/* CNI / Passeport */}
            <PhotoUpload
              label="🪪 CNI ou Passeport"
              hint="Photo claire de votre pièce d'identité nationale ou passeport"
              preview={previews.identity}
              onChange={(e) => handlePhoto('identity', e)}
              inputId="photo-identity"
            />

            {/* Selfie */}
            <PhotoUpload
              label="🤳 Selfie du propriétaire"
              hint="Votre visage clairement visible, de préférence devant la boutique"
              preview={previews.selfie}
              onChange={(e) => handlePhoto('selfie', e)}
              inputId="photo-selfie"
            />

          </div>
        </div>

        {/* Note de processus */}
        <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}>📞</span>
          <div>
            <p style={{ fontWeight: '700', color: '#C2410C', margin: '0 0 4px 0', fontSize: '0.9rem' }}>
              Appel de vérification
            </p>
            <p style={{ color: '#9A3412', fontSize: '0.82rem', margin: 0, lineHeight: '1.5' }}>
              Après réception de votre dossier, notre équipe vous appellera au numéro fourni pour finaliser la vérification. Soyez disponible dans les <strong>24 à 48h</strong>.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary active-scale"
          style={{
            padding: '16px',
            borderRadius: '14px',
            fontWeight: '800',
            fontSize: '1.05rem',
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isSubmitting ? 'Envoi en cours...' : '✅ Envoyer ma demande de certification'}
        </button>
      </form>
    </div>
  );
};

/* ---- Composant photo upload réutilisable ---- */
const PhotoUpload = ({ label, hint, preview, onChange, inputId }) => (
  <div>
    <label style={{ display: 'block', fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>
      {label} <span style={{ color: '#e74c3c' }}>*</span>
    </label>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 8px 0' }}>{hint}</p>
    <label
      htmlFor={inputId}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '8px',
        border: '2px dashed #CBD5E1',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        background: preview ? 'transparent' : '#F8FAFC',
        overflow: 'hidden',
        minHeight: '100px',
        position: 'relative',
      }}
    >
      {preview ? (
        <img
          src={preview}
          alt="preview"
          style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px' }}
        />
      ) : (
        <>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
            Appuyer pour choisir une photo
          </span>
        </>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChange}
        style={{ display: 'none' }}
      />
    </label>
  </div>
);

export default CertificationPage;
