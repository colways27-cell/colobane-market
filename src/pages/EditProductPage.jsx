import { useState, useEffect } from 'react';
import { categories } from '../data/categories';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const locations = [
  'Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Saint-Louis', 
  'Ziguinchor', 'Diourbel', 'Kaolack', 'Louga', 'Fatick', 'Kolda', 'Tambacounda', 
  'Matam', 'Kédougou', 'Kaffrine', 'Sédhiou', 'Touba', 'Autre'
];

const deliveries = [
  'Aucune', 'Livraison possible', 'À la charge de l\'acheteur', 'Gratuite'
];

const InputWrapper = ({ label, icon, children, required }) => (
  <div style={{ marginBottom: '1.2rem' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>
      {label} {required && <span style={{ color: '#e74c3c' }}>*</span>}
    </label>
    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', background: '#FAFAF9', transition: 'all 0.2s' }}>
      <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
        {icon}
      </div>
      {children}
    </div>
  </div>
);

const FastInput = ({ value, onChange, ...props }) => {
  const [localVal, setLocalVal] = useState(value || '');
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setLocalVal(value || '');
    setPrevValue(value);
  }
  return <input value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={e => onChange({ target: { name: props.name, value: localVal } })} {...props} />;
};

const FastTextarea = ({ value, onChange, ...props }) => {
  const [localVal, setLocalVal] = useState(value || '');
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setLocalVal(value || '');
    setPrevValue(value);
  }
  return <textarea value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={e => onChange({ target: { name: props.name, value: localVal } })} {...props} />;
};

const EditProductPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { productId } = useParams();
  
  const [step, setStep] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', price_type: 'Fixe', price: '', location: 'Dakar', delivery: 'Aucune', contact_whatsapp: ''
  });
  
  const [existingImages, setExistingImages] = useState([]);
  const [images, setImages] = useState([]); // New files
  const [previews, setPreviews] = useState([]); // New file previews
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user === null) {
      navigate('/auth');
      return;
    }

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) throw error;
        if (data.seller_id !== user.id) {
          toast.error("Vous ne pouvez pas modifier cette annonce.");
          navigate('/profile');
          return;
        }

        setSelectedCategory(data.category);
        setExistingImages(data.images || []);
        
        let price = data.price;
        if (price === 0 && (data.metadata?.price_type === 'Gratuit' || data.metadata?.price_type === 'Échange')) {
          price = '';
        }

        // Reconstruct formData
        const mergedData = {
          title: data.title || '',
          description: data.description || '',
          price: price,
          price_type: data.metadata?.price_type || 'Fixe',
          location: data.location || 'Dakar',
          delivery: data.metadata?.delivery || 'Aucune',
          contact_whatsapp: data.metadata?.contact_whatsapp || '',
          ...data.metadata
        };

        // Handle custom fields
        const cat = categories.find(c => c.id === data.category);
        if (cat) {
          cat.fields?.forEach(field => {
            if (mergedData[field.name] && !field.options?.includes(mergedData[field.name])) {
              mergedData[`custom_${field.name}`] = mergedData[field.name];
              mergedData[field.name] = 'Autre';
            }
          });
        }
        
        if (mergedData.location && !locations.includes(mergedData.location)) {
          mergedData.custom_location = mergedData.location;
          mergedData.location = 'Autre';
        }

        setFormData(mergedData);

      } catch (err) {
        console.error('Error fetching product', err);
        toast.error("Erreur lors du chargement de l'annonce.");
        navigate('/profile');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProduct();
  }, [user, navigate, productId]);

  const getSubcategoryField = (cat) => {
    if (!cat || !cat.fields) return null;
    return cat.fields.find(f => ['type', 'property_type', 'service_type', 'job_type'].includes(f.name));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    const totalFiles = existingImages.length + images.length + files.length;
    if (totalFiles > 6) {
      toast.error('Vous ne pouvez avoir que 6 photos maximum au total.');
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

  const removeExistingImage = (index) => {
    const newExisting = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExisting);
  };

  const removeNewImage = (index) => {
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
      if (existingImages.length === 0 && images.length === 0) {
        toast.error("Veuillez avoir au moins une photo.");
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
    const allowedImageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
    
    const uploadPromises = images.map(async (image) => {
      const originalExt = (image.name.split('.').pop() || 'jpg').toLowerCase();
      if (!allowedImageExts.includes(originalExt)) {
        throw new Error(`Format d'image non supporté: .${originalExt}`);
      }

      // Options de compression d'image
      const compressionOptions = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      const compressedImage = await imageCompression(image, compressionOptions);
      const fileExt = 'webp';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, compressedImage);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      return data.publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const imageUrls = await uploadImages();
      const finalImages = [...existingImages, ...imageUrls];
      
      const { title, description, price, price_type, location, delivery, contact_whatsapp, ...metadata } = formData;
      
      let finalPrice = 0;
      if (price_type !== 'Gratuit' && price_type !== 'Échange') {
        finalPrice = typeof price === 'string' ? parseFloat(price.replace(/\s/g, '')) : parseFloat(price);
      }

      // Handle "Autre" custom fields
      const processedMetadata = { ...metadata, price_type, delivery, contact_whatsapp };
      Object.keys(processedMetadata).forEach(key => {
        if (processedMetadata[key] === 'Autre' && processedMetadata[`custom_${key}`]) {
          processedMetadata[key] = processedMetadata[`custom_${key}`];
        }
        if (key.startsWith('custom_')) {
          delete processedMetadata[key];
        }
      });

      const { error: updateError } = await supabase.from('products')
        .update({
          title: title || 'Sans titre',
          description: description || '',
          price: isNaN(finalPrice) ? 0 : finalPrice,
          location: (location === 'Autre' && formData.custom_location) ? formData.custom_location : (location || 'Sénégal'),
          category: selectedCategory,
          images: finalImages,
          metadata: processedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      toast.success("Annonce modifiée avec succès !");
      navigate('/profile');
      
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "Une erreur s'est produite lors de la modification.");
      toast.error("Erreur de modification");
    } finally {
      setLoading(false);
    }
  };

  const category = categories.find((c) => c.id === selectedCategory);
  if (initialLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'white' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #F1F5F9', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontWeight: '500' }}>Chargement de l'annonce...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', background: 'white', minHeight: '100vh', position: 'relative' }}>
          {/* App Bar */}
          <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 100, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <button onClick={() => step > 1 ? prevStep() : navigate(-1)} className="touch-target active-scale" style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', fontWeight: '800', margin: 0, paddingRight: '40px', fontFamily: 'var(--font-heading)' }}>
              Modifier l'annonce
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Catégorie</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>Confirmez ou modifiez la catégorie principale.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {categories.map((cat) => (
                    <button 
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        if (step === 1) {
                          setTimeout(() => setStep(2), 300);
                        }
                      }}
                      className="touch-target active-scale"
                      style={{ 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '16px', border: selectedCategory === cat.id ? '2px solid var(--primary)' : '1px solid #E2E8F0', background: selectedCategory === cat.id ? '#FFF1F2' : 'white', cursor: 'pointer', transition: 'all 0.2s' 
                      }}
                    >
                      <span style={{ fontSize: '2rem' }}>{cat.icon}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: selectedCategory === cat.id ? 'var(--primary)' : 'var(--text-main)', textAlign: 'center' }}>{cat.name}</span>
                    </button>
                  ))}
                </div>

                <button onClick={nextStep} className="btn-primary active-scale" style={{ width: '100%', marginTop: '32px', padding: '1.1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  Continuer <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}

            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>{category?.name} - Précision</h2>
                
                {category && getSubcategoryField(category) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {getSubcategoryField(category).options.map(opt => {
                      const fieldName = getSubcategoryField(category).name;
                      const isSelected = formData[fieldName] === opt;
                      return (
                        <div key={opt}>
                          <button 
                            type="button"
                            onClick={() => { 
                              setFormData({...formData, [fieldName]: opt}); 
                              if (opt !== 'Autre') {
                                setTimeout(() => setStep(3), 300); 
                              }
                            }}
                            className="touch-target active-scale"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isSelected ? 'var(--primary)' : '#FAFAF9', border: isSelected ? 'none' : '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px', color: isSelected ? 'white' : 'var(--text-main)', fontWeight: '600', fontSize: '1rem', transition: 'all 0.2s' }}
                          >
                            {opt}
                            {isSelected && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </button>
                          
                          {isSelected && opt === 'Autre' && (
                            <div style={{ marginTop: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                              <FastInput 
                                type="text" 
                                name={`custom_${fieldName}`} 
                                placeholder={`Précisez le type...`}
                                onChange={(e) => setFormData({...formData, [`custom_${fieldName}`]: e.target.value})}
                                value={formData[`custom_${fieldName}`] || ''}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', background: '#FAFAF9' }} 
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <button onClick={nextStep} className="btn-primary active-scale" style={{ width: '100%', marginTop: '32px', padding: '1.1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  Continuer <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}

            {step === 3 && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>Détails & Photos</h2>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: '500' }}>Photos ({previews.length + existingImages.length}/6)</label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <img src={url} alt={`Photo ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeExistingImage(index)} className="active-scale touch-target" style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ))}
                    {previews.map((url, index) => (
                      <div key={`preview-${index}`} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <img src={url} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeNewImage(index)} className="active-scale touch-target" style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ))}
                    {(previews.length + existingImages.length) < 6 && (
                      <label className="active-scale touch-target" style={{ aspectRatio: '1', borderRadius: '12px', border: '2px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', cursor: 'pointer', background: '#F8FAFC' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <span style={{ fontSize: '0.7rem', fontWeight: '500' }}>Ajouter</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                </div>

                <InputWrapper label="Titre de l'annonce" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>}>
                  <FastInput type="text" name="title" placeholder="Ex: iPhone 13 Pro Max - Très bon état" value={formData.title} onChange={handleInputChange} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '1.05rem', fontWeight: '600' }} />
                </InputWrapper>

                <InputWrapper label="Description détaillée" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>}>
                  <FastTextarea name="description" placeholder="Décrivez votre article en détail (état, marque, caractéristiques...)" value={formData.description} onChange={handleInputChange} style={{ width: '100%', padding: '1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', minHeight: '120px', resize: 'vertical' }} />
                </InputWrapper>

                {category?.fields?.filter(field => {
                  if (['type', 'property_type', 'service_type', 'job_type'].includes(field.name)) return false;
                  if (!field.showIf) return true;
                  const dependentValue = formData[field.showIf.field];
                  return field.showIf.values.includes(dependentValue);
                }).map((field) => (
                  <div key={field.name} style={{ marginBottom: '1.5rem' }}>
                    {field.type === 'select' ? (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: '500' }}>{field.label}</label>
                        {(field.name === 'color' || field.name === 'size') ? (
                          /* Multi-select chips pour couleur et taille/pointure */
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {field.options.map(opt => {
                              const selectedValues = (formData[field.name] || '').split(', ').filter(Boolean);
                              const isSelected = selectedValues.includes(opt);
                              return (
                                <button 
                                  key={opt}
                                  type="button" 
                                  onClick={() => {
                                    let values = (formData[field.name] || '').split(', ').filter(Boolean);
                                    if (opt === 'Autre') {
                                      values = ['Autre'];
                                    } else {
                                      values = values.filter(v => v !== 'Autre');
                                      if (values.includes(opt)) {
                                        values = values.filter(v => v !== opt);
                                      } else {
                                        values.push(opt);
                                      }
                                    }
                                    setFormData({...formData, [field.name]: values.join(', ')});
                                  }} 
                                  className="active-scale touch-target" 
                                  style={{ flexShrink: 0, padding: '0 16px', minHeight: '40px', borderRadius: '20px', border: isSelected ? 'none' : '1px solid #E2E8F0', background: isSelected ? 'var(--primary)' : '#FAFAF9', color: isSelected ? 'white' : 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem', boxShadow: isSelected ? '0 4px 10px rgba(139, 28, 49, 0.2)' : 'none', transition: 'all 0.2s' }}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                            {field.options.map(opt => (
                              <button 
                                key={opt}
                                type="button" 
                                onClick={() => setFormData({...formData, [field.name]: opt})} 
                                className="active-scale touch-target" 
                                style={{ flexShrink: 0, padding: '0 16px', minHeight: '40px', borderRadius: '20px', border: formData[field.name] === opt ? 'none' : '1px solid #E2E8F0', background: formData[field.name] === opt ? 'var(--primary)' : '#FAFAF9', color: formData[field.name] === opt ? 'white' : 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem', boxShadow: formData[field.name] === opt ? '0 4px 10px rgba(139, 28, 49, 0.2)' : 'none', transition: 'all 0.2s' }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                        {(formData[field.name] === 'Autre' || (formData[field.name] || '').split(', ').includes('Autre')) && (
                          <div style={{ marginTop: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                            <FastInput 
                              type="text" 
                              name={`custom_${field.name}`} 
                              placeholder={`Précisez : ${field.label}`}
                              onChange={(e) => setFormData({...formData, [`custom_${field.name}`]: e.target.value})}
                              value={formData[`custom_${field.name}`] || ''}
                              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', background: '#FAFAF9' }} 
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <InputWrapper label={field.label} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}>
                        <FastInput type={field.type} name={field.name} placeholder={field.placeholder} onChange={handleInputChange} value={formData[field.name] || ''} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} />
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
                  <InputWrapper label="Prix (FCFA)" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>}>
                    <FastInput type="number" name="price" placeholder="Ex: 15000" value={formData.price} onChange={handleInputChange} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '1px' }} />
                  </InputWrapper>
                )}

                <div>
                  <InputWrapper label="Ville / Quartier" required icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>}>
                    <select name="location" onChange={handleInputChange} value={formData.location} style={{ flex: 1, padding: '1rem 1rem 1rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', appearance: 'none' }}>
                      {locations.map(loc => <option key={loc} value={loc} style={{ color: 'var(--text-main)' }}>{loc}</option>)}
                    </select>
                    <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
                  </InputWrapper>
                  {formData.location === 'Autre' && (
                    <div style={{ marginTop: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                      <FastInput 
                        type="text" 
                        name="custom_location" 
                        placeholder="Précisez votre ville / quartier"
                        onChange={(e) => setFormData({...formData, custom_location: e.target.value})}
                        value={formData.custom_location || ''}
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', background: '#FAFAF9' }} 
                      />
                    </div>
                  )}
                </div>

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
                    <FastInput type="tel" name="contact_whatsapp" value={formData.contact_whatsapp} onChange={handleInputChange} placeholder="77 123 45 67" style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', letterSpacing: '1px' }} />
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={loading} className="btn-primary active-scale" style={{ width: '100%', marginTop: '32px', padding: '1.1rem', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(139, 28, 49, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  {!loading && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>}
                </button>
              </div>
            )}
          </div>
    </div>
  );
};

export default EditProductPage;
