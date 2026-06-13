import { useState, useEffect } from 'react';
import { categories } from '../data/categories';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const locations = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Saint-Louis', 'Touba', 'Kaolack', 'Ziguinchor', 'Mbour', 'Louga', 'Tambacounda', 'Autre'];
const deliveries = ['Livraison Express (Tiak-Tiak)', 'Dakar uniquement', 'Point Relais (Dakar)', 'Expédition Régions', 'Aucune'];

const InputWrapper = ({ label, icon, children, required }) => (
  <div style={{ marginBottom: '1.2rem' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>
      {label} {required && '*'}
    </label>
    <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', background: '#FAFAF9' }}>
      {icon && (
        <div style={{ padding: '0 12px', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
          {icon}
        </div>
      )}
      {children}
    </div>
  </div>
);

const PublishPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', price_type: 'Fixe', price: '', location: 'Dakar', delivery: 'Aucune', contact_whatsapp: ''
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user === null) {
      navigate('/auth');
      return;
    }

    // Pre-fill WhatsApp number if available
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('whatsapp_number, city')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          setFormData(prev => ({
            ...prev,
            contact_whatsapp: data.whatsapp_number || '',
            location: data.city || 'Dakar'
          }));
        }
      } catch (err) {
        console.error('Error fetching profile for prefill', err);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  if (user === null) return null;

  const category = categories.find((c) => c.id === selectedCategory);

  const getSubcategoryField = (cat) => {
    if (!cat) return null;
    return cat.fields.find(f => ['type', 'property_type', 'service_type', 'job_type'].includes(f.name));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    const totalFiles = images.length + files.length;
    if (totalFiles > 6) {
      toast.error('Vous ne pouvez sélectionner que 6 photos maximum.');
      return;
    }
    
    const newImages = [...images, ...files];
    setImages(newImages);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageChange(e);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const nextStep = () => {
    if (step === 1 && !selectedCategory) {
      toast.error("Veuillez sélectionner une catégorie.");
      return;
    }
    if (step === 1) {
      const subcat = getSubcategoryField(category);
      if (!subcat) {
        setStep(3);
        return;
      }
    }
    if (step === 2) {
      const subcat = getSubcategoryField(category);
      if (subcat && !formData[subcat.name]) {
        toast.error("Veuillez sélectionner une sous-catégorie.");
        return;
      }
    }
    if (step === 3) {
      if (!formData.title || !formData.description) {
        toast.error("Veuillez remplir le titre et la description.");
        return;
      }
      if (images.length === 0) {
        toast.error("Veuillez ajouter au moins une photo.");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step === 3) {
      const subcat = getSubcategoryField(category);
      if (!subcat) {
        setStep(1);
        return;
      }
    }
    setStep(step - 1);
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, image);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      uploadedUrls.push(data.publicUrl);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { error: profileError } = await supabase.from('profiles').upsert([{ id: user.id }], { onConflict: 'id' });
      if (profileError && profileError.code !== '23505') console.warn('Profile sync issue:', profileError);

      const imageUrls = await uploadImages();
      const { title, description, price, price_type, location, delivery, contact_whatsapp, ...metadata } = formData;
      
      let finalPrice = 0;
      if (price_type !== 'Gratuit' && price_type !== 'Échange') {
        finalPrice = typeof price === 'string' ? parseFloat(price.replace(/\s/g, '')) : parseFloat(price);
      }

      const { error: insertError } = await supabase.from('products').insert([{
        seller_id: user.id,
        title: title || 'Sans titre',
        description: description || '',
        price: isNaN(finalPrice) ? 0 : finalPrice,
        location: location || 'Sénégal',
        category: selectedCategory,
        images: imageUrls,
        metadata: { ...metadata, price_type, delivery, contact_whatsapp },
        status: 'available'
      }]);

      if (insertError) throw insertError;

      toast.success("Annonce publiée avec succès !");
      navigate('/');
      
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "Une erreur s'est produite lors de la publication.");
      toast.error("Erreur de publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', background: 'white', minHeight: '100vh', position: 'relative' }}>
      
      {/* App Bar */}
      <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 100, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <button onClick={() => step > 1 ? prevStep() : navigate(-1)} className="touch-target active-scale" style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', fontWeight: '800', margin: 0, paddingRight: '40px', fontFamily: 'var(--font-heading)' }}>
          {step === 1 ? 'Catégorie' : step === 2 ? 'Sous-catégorie' : step === 3 ? 'Détails de l\'annonce' : 'Prix & Livraison'}
        </h1>
      </div>

      {/* Stepper Progress */}
      <div style={{ display: 'flex', padding: '16px 20px', gap: '8px', background: 'white' }}>
        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: step >= 1 ? 'var(--primary)' : '#F1F5F9', transition: 'all 0.3s' }}></div>
        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: step >= 2 ? 'var(--primary)' : '#F1F5F9', transition: 'all 0.3s' }}></div>
        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: step >= 3 ? 'var(--primary)' : '#F1F5F9', transition: 'all 0.3s' }}></div>
        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: step >= 4 ? 'var(--primary)' : '#F1F5F9', transition: 'all 0.3s' }}></div>
      </div>

      <div style={{ padding: '12px 20px' }}>
        {errorMsg && <div style={{ color: '#e74c3c', background: '#fdf0ed', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>{errorMsg}</div>}
        
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Que vendez-vous ?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>Sélectionnez la catégorie qui correspond le mieux à votre article.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {categories.map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => { 
                    setSelectedCategory(cat.id); 
                    setTimeout(() => {
                      const selectedCatObj = categories.find((c) => c.id === cat.id);
                      const subcat = getSubcategoryField(selectedCatObj);
                      if (subcat) setStep(2);
                      else setStep(3);
                    }, 300); 
                  }}
                  className="touch-target active-scale"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: selectedCategory === cat.id ? 'var(--primary)' : '#FAFAF9', border: selectedCategory === cat.id ? 'none' : '1px solid #E2E8F0', borderRadius: '20px', padding: '20px 10px', gap: '12px', boxShadow: selectedCategory === cat.id ? '0 8px 20px rgba(139, 28, 49, 0.2)' : 'none', transition: 'all 0.2s' }}
                >
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: selectedCategory === cat.id ? 'rgba(255,255,255,0.2)' : `${cat.color}15`, color: selectedCategory === cat.id ? 'white' : cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                    {cat.icon}
                  </div>
                  <span style={{ fontWeight: selectedCategory === cat.id ? '700' : '600', color: selectedCategory === cat.id ? 'white' : 'var(--text-main)', textAlign: 'center', fontSize: '0.9rem' }}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
            
            <button onClick={nextStep} disabled={!selectedCategory} className="btn-primary active-scale" style={{ width: '100%', marginTop: '32px', padding: '1.1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              Continuer <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {step === 2 && getSubcategoryField(category) && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Précisez le type</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>Quelle sous-catégorie correspond le mieux ?</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {getSubcategoryField(category)?.options.map(opt => {
                 const fieldName = getSubcategoryField(category).name;
                 const isSelected = formData[fieldName] === opt;
                 return (
                   <button 
                     key={opt}
                     onClick={() => { 
                       setFormData({...formData, [fieldName]: opt}); 
                       setTimeout(() => setStep(3), 300); 
                     }}
                     className="touch-target active-scale"
                     style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isSelected ? 'var(--primary)' : '#FAFAF9', border: isSelected ? 'none' : '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px', color: isSelected ? 'white' : 'var(--text-main)', fontWeight: '600', fontSize: '1rem', transition: 'all 0.2s' }}
                   >
                     {opt}
                     {isSelected && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                   </button>
                 );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>Détails et Photos</h2>
            
            <InputWrapper label="Titre de l'annonce" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>}>
              <input type="text" name="title" placeholder="Ex: iPhone 14 Pro Max 256Go" value={formData.title} onChange={handleInputChange} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} />
            </InputWrapper>

            <InputWrapper label="Description" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '14px' }}><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="14" y1="18" x2="3" y2="18"></line></svg>}>
              <textarea name="description" rows="4" placeholder="État, accessoires inclus, raison de la vente..." value={formData.description} onChange={handleInputChange} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', resize: 'vertical' }}></textarea>
            </InputWrapper>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: '500' }}>Photos (Max 6) *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {previews.map((src, index) => (
                  <div key={index} style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '16px', overflow: 'hidden', background: '#F1F5F9', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <img src={src} alt={`preview ${index}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => removeImage(index)} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>✕</button>
                  </div>
                ))}
                
                {previews.length < 6 && (
                  <label 
                    className="active-scale touch-target" 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '16px', border: `2px dashed ${isDragging ? 'var(--primary)' : '#CBD5E1'}`, background: isDragging ? 'var(--primary-light)' : '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transition: 'all 0.2s' }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: 'var(--primary)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 28, 49, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>Glisser ou cliquer</span>
                    </div>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>

            {category && category.fields.filter(field => {
              if (['type', 'property_type', 'service_type', 'job_type'].includes(field.name)) return false;
              if (!field.showIf) return true;
              const dependentValue = formData[field.showIf.field];
              return field.showIf.values.includes(dependentValue);
            }).map((field) => (
              <div key={field.name} style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: '500' }}>{field.label}</label>
                {field.type === 'select' ? (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', margin: '0 -20px', paddingLeft: '20px', paddingRight: '20px' }}>
                    {field.options.map((opt) => (
                      <button type="button" key={opt} onClick={() => setFormData({...formData, [field.name]: opt})} className="active-scale touch-target" style={{ flexShrink: 0, padding: '0 16px', minHeight: '40px', borderRadius: '20px', border: formData[field.name] === opt ? 'none' : '1px solid #E2E8F0', background: formData[field.name] === opt ? 'var(--primary)' : '#FAFAF9', color: formData[field.name] === opt ? 'white' : 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem', boxShadow: formData[field.name] === opt ? '0 4px 10px rgba(139, 28, 49, 0.2)' : 'none', transition: 'all 0.2s' }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <InputWrapper label={field.label} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}>
                    <input type={field.type} name={field.name} placeholder={field.placeholder} onChange={handleInputChange} value={formData[field.name] || ''} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} />
                  </InputWrapper>
                )}
              </div>
            ))}

            <button onClick={nextStep} className="btn-primary active-scale" style={{ width: '100%', marginTop: '24px', padding: '1.1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              Continuer <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>Prix et Livraison</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: '500' }}>Type de prix</label>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {['Fixe', 'Négociable', 'Gratuit', 'Échange'].map(pt => (
                  <button type="button" key={pt} onClick={() => setFormData({...formData, price_type: pt})} className="active-scale touch-target" style={{ flexShrink: 0, padding: '0 20px', minHeight: '44px', borderRadius: '12px', border: formData.price_type === pt ? 'none' : '1px solid #E2E8F0', background: formData.price_type === pt ? 'var(--primary)' : '#FAFAF9', color: formData.price_type === pt ? 'white' : 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem', boxShadow: formData.price_type === pt ? '0 4px 12px rgba(139, 28, 49, 0.2)' : 'none', transition: 'all 0.2s' }}>
                    {pt}
                  </button>
                ))}
              </div>
            </div>

            {(formData.price_type !== 'Gratuit' && formData.price_type !== 'Échange') && (
              <InputWrapper label="Prix (FCFA)" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}>
                <input type="number" name="price" placeholder="Ex: 15000" value={formData.price} onChange={handleInputChange} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '1px' }} />
              </InputWrapper>
            )}

            <InputWrapper label="Ville / Quartier" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>}>
              <select name="location" onChange={handleInputChange} value={formData.location} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', appearance: 'none' }}>
                {locations.map(loc => <option key={loc} value={loc} style={{ color: 'var(--text-main)' }}>{loc}</option>)}
              </select>
              <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
            </InputWrapper>

            <InputWrapper label="Options de livraison" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>}>
              <select name="delivery" onChange={handleInputChange} value={formData.delivery} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', appearance: 'none' }}>
                {deliveries.map(del => <option key={del} value={del} style={{ color: 'var(--text-main)' }}>{del}</option>)}
              </select>
              <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
            </InputWrapper>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Numéro WhatsApp <span style={{ opacity: 0.7 }}>(optionnel)</span></label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', background: '#FAFAF9' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F8FAFC', borderRight: '1px solid #E2E8F0', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem', height: '100%' }}>
                  <span style={{ color: '#94A3B8', marginRight: '6px', fontSize: '0.8rem' }}>SN</span> +221
                </div>
                <input type="tel" name="contact_whatsapp" value={formData.contact_whatsapp} onChange={handleInputChange} placeholder="77 123 45 67" style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', letterSpacing: '1px' }} />
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="btn-primary active-scale" style={{ width: '100%', marginTop: '32px', padding: '1.1rem', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(139, 28, 49, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              {loading ? 'Publication en cours...' : 'Publier mon annonce'}
              {!loading && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishPage;
