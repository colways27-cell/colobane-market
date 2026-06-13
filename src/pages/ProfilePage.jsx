import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const locations = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Saint-Louis', 'Touba', 'Kaolack', 'Ziguinchor', 'Mbour', 'Louga', 'Tambacounda', 'Autre'];

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('annonces');
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    whatsapp_number: '',
    city: '',
    email: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        if (profileData) {
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || '',
            phone_number: profileData.phone_number || '',
            whatsapp_number: profileData.whatsapp_number || '',
            city: profileData.city || 'Dakar',
            email: profileData.email || ''
          });
        }

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setMyProducts(productsData || []);

      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          whatsapp_number: formData.whatsapp_number,
          city: formData.city,
          email: formData.email
        })
        .eq('id', user.id);

      if (error) throw error;
      setProfile({ 
        ...profile, 
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        whatsapp_number: formData.whatsapp_number,
        city: formData.city,
        email: formData.email
      });
      setEditingProfile(false);
      toast.success("Profil mis à jour !");
    } catch (err) {
      toast.error("Erreur lors de la mise à jour.");
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      setMyProducts(myProducts.filter(p => p.id !== productId));
      toast.success("Annonce supprimée.");
    } catch (err) {
      toast.error("Erreur lors de la suppression.");
      console.error(err);
    }
  };

  const handleBoostProduct = async (productId) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_boosted: true })
        .eq('id', productId);

      if (error) throw error;
      
      setMyProducts(myProducts.map(p => 
        p.id === productId ? { ...p, is_boosted: true } : p
      ));
      toast.success("Annonce boostée avec succès ! 🚀");
    } catch (err) {
      toast.error("Erreur lors du boost.");
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const InputWrapper = ({ label, icon, children }) => (
    <div style={{ marginBottom: '1.2rem', textAlign: 'left' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>
        {label}
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

  let trialDaysLeft = null;
  let isTrialExpired = false;

  if (profile?.account_type === 'boutique' && profile?.trial_end_date) {
    const end = new Date(profile.trial_end_date);
    const now = new Date();
    const diffTime = end - now;
    trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (trialDaysLeft <= 0) isTrialExpired = true;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '120px' }}>
      {/* Bannière Haut de page */}
      <div style={{ height: '220px', background: 'linear-gradient(135deg, var(--primary) 0%, #4a0e1b 100%)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', opacity: 0.1 }}></div>
      </div>

      <div className="section-container" style={{ position: 'relative', marginTop: '-80px', padding: '0 16px' }}>
        
        {/* Carte Profil Principale */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '2rem', border: '1px solid #E2E8F0' }}>
          {editingProfile ? (
            <div style={{ animation: 'fadeIn 0.3s' }}>
               <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Modifier mon profil</h2>
               <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '0 2rem' }}>
                  <InputWrapper label="Nom complet" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}>
                    <input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} placeholder="Votre nom" style={{ flex: 1, padding: '0.9rem 0.9rem 0.9rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} />
                  </InputWrapper>

                  <InputWrapper label="Ville" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>}>
                    <select value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} style={{ flex: 1, padding: '0.9rem 0.9rem 0.9rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', appearance: 'none', color: 'var(--text-main)' }}>
                      <option value="" disabled>Sélectionnez une ville</option>
                      {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <div style={{ padding: '0 16px', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>▼</div>
                  </InputWrapper>

                  <InputWrapper label="Email" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>}>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="exemple@email.com" style={{ flex: 1, padding: '0.9rem 0.9rem 0.9rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} />
                  </InputWrapper>

                  <InputWrapper label="Numéro WhatsApp" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>}>
                    <input type="tel" value={formData.whatsapp_number} onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})} placeholder="77 000 00 00" style={{ flex: 1, padding: '0.9rem 0.9rem 0.9rem 0', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} />
                  </InputWrapper>
               </div>
               
               <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                 <button onClick={() => setEditingProfile(false)} className="btn-secondary active-scale" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'transparent', fontWeight: '600' }}>Annuler</button>
                 <button onClick={handleUpdateProfile} className="btn-primary active-scale" style={{ padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: '700' }}>Enregistrer</button>
               </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', animation: 'fadeIn 0.3s' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '800', border: '5px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile?.boutique_name ? profile.boutique_name.charAt(0).toUpperCase() : (profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U')
                )}
              </div>
              
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h1 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {profile?.full_name || 'Utilisateur sans nom'}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📍 {profile?.city || profile?.location || 'Sénégal'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📧 {profile?.email || 'Aucun email'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📱 {profile?.whatsapp_number || profile?.phone_number || 'Aucun numéro'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
                <button onClick={() => setEditingProfile(true)} className="btn-secondary active-scale touch-target" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FAFAF9', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                  Modifier mon profil
                </button>
                {profile?.account_type === 'boutique' ? (
                  <>
                    <Link to={`/boutique/${profile.id}`} className="active-scale touch-target" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                      Voir ma vitrine 🏪
                    </Link>
                    {isTrialExpired ? (
                       <Link to="/subscription" className="active-scale" style={{ background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '12px', fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #fecaca' }}>
                         ⚠️ Essai terminé. Choisir un forfait.
                       </Link>
                    ) : trialDaysLeft !== null ? (
                       <Link to="/subscription" className="active-scale" style={{ background: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '12px', fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #a7f3d0' }}>
                         🚀 {trialDaysLeft} jours restants. Voir les forfaits.
                       </Link>
                    ) : null}
                  </>
                ) : (
                  <Link to="/create-boutique" className="active-scale touch-target" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: '#f8fafc', color: 'var(--primary)', border: '1px dashed var(--primary)', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                    Créer ma Boutique 🏪
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        {!editingProfile && (
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #E2E8F0', marginBottom: '2rem', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            <button 
              onClick={() => setActiveTab('annonces')} 
              style={{ background: 'none', border: 'none', padding: '1rem 0.5rem', fontSize: '1.05rem', fontWeight: activeTab === 'annonces' ? '800' : '600', color: activeTab === 'annonces' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'annonces' ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            >
              📦 Mes Annonces ({myProducts.length})
            </button>
            <button 
              onClick={() => navigate('/favorites')} 
              style={{ background: 'none', border: 'none', padding: '1rem 0.5rem', fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-muted)', borderBottom: '3px solid transparent', marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            >
              ❤️ Mes Favoris
            </button>
            <button 
              onClick={() => setActiveTab('parametres')} 
              style={{ background: 'none', border: 'none', padding: '1rem 0.5rem', fontSize: '1.05rem', fontWeight: activeTab === 'parametres' ? '800' : '600', color: activeTab === 'parametres' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'parametres' ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            >
              ⚙️ Paramètres
            </button>
          </div>
        )}

        {/* Tab Content */}
        {!editingProfile && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            
            {activeTab === 'annonces' && (
              <div>
                {myProducts.length === 0 ? (
                  <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '80px', height: '80px', background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                      📦
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Votre boutique est vide</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '350px', lineHeight: '1.5', marginBottom: '2rem' }}>
                      Vous n'avez pas encore publié d'annonce. Commencez à vendre vos articles dès aujourd'hui.
                    </p>
                    <Link to="/publish" className="btn-primary active-scale" style={{ padding: '0.9rem 2rem', borderRadius: '12px', fontWeight: '700' }}>
                      Vendre mon premier article
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ gap: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {myProducts.map(product => {
                      const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x400?text=No+Image';
                      
                      return (
                        <div key={product.id} className="product-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                          <div style={{ position: 'relative', paddingTop: '100%' }}>
                            <img src={imageUrl} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', color: '#10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                              ● En ligne
                            </div>
                          </div>
                          
                          <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                              {product.price > 0 ? `${product.price.toLocaleString('fr-FR')} FCFA` : product.metadata?.price_type || 'Sur demande'}
                            </div>
                            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '8px' }}>
                              {product.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 'auto' }}>
                              {new Date(product.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', borderTop: '1px solid #E2E8F0', background: '#FAFAF9' }}>
                            <Link to={`/product/${product.id}`} className="active-scale touch-target" style={{ flex: 1, padding: '0.9rem', textAlign: 'center', textDecoration: 'none', color: 'var(--text-main)', borderRight: '1px solid #E2E8F0', fontSize: '0.9rem', fontWeight: '700', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                              👀
                            </Link>
                            {!product.is_boosted && (
                              <button onClick={() => handleBoostProduct(product.id)} className="active-scale touch-target" style={{ flex: 2, padding: '0.9rem', textAlign: 'center', background: 'none', borderRight: '1px solid #E2E8F0', cursor: 'pointer', color: '#f59e0b', fontSize: '0.9rem', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                🚀 Booster
                              </button>
                            )}
                            <button onClick={() => handleDeleteProduct(product.id)} className="active-scale touch-target" style={{ flex: 1, padding: '0.9rem', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '0.9rem', fontWeight: '700', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'parametres' && (
              <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Paramètres du compte</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontWeight: '700' }}>Notifications Email</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Recevoir un email pour chaque nouveau message</p>
                    </div>
                    <div style={{ width: '44px', height: '24px', background: 'var(--primary)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                      <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontWeight: '700' }}>Boutique Officielle</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mettre à jour vos informations professionnelles</p>
                    </div>
                    {profile?.account_type === 'boutique' ? (
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.9rem' }}>Activé ✓</span>
                    ) : (
                      <Link to="/create-boutique" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none' }}>Créer</Link>
                    )}
                  </div>

                  <button onClick={handleLogout} className="btn-secondary active-scale" style={{ background: '#fdf0ed', color: '#e74c3c', border: 'none', padding: '1.2rem', borderRadius: '12px', fontWeight: '700', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '1rem' }}>
                    🚪 Se déconnecter
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
        
      </div>
    </div>
  );
};

export default ProfilePage;
