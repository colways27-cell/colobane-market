import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import toast from 'react-hot-toast';
import { MapPin, Phone, Plus, Search, MessageSquare, ArrowLeft } from 'lucide-react';
import totemLapin from '../assets/totem-lapin.webp';

const BuyerRequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    budget: '',
    location: 'Dakar',
    contact: '',
    details: ''
  });

  // Local storage persistence helpers
  const getLocalRequests = () => {
    try {
      const saved = localStorage.getItem('colobane_buyer_requests');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const saveLocalRequest = (newReq) => {
    try {
      const existing = getLocalRequests();
      const updated = [newReq, ...existing.filter(r => r.id !== newReq.id)];
      localStorage.setItem('colobane_buyer_requests', JSON.stringify(updated));
    } catch (e) {}
  };

  const fetchRequests = async () => {
    setLoading(true);
    let remoteData = [];
    try {
      const { data, error } = await supabase
        .from('buyer_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        remoteData = data;
      }
    } catch (e) {
      console.error('Supabase fetch error:', e);
    }

    const localData = getLocalRequests();
    const demoRequests = [
      {
        id: 'demo-1',
        title: 'iPhone 13 128 Go — Bon état',
        budget: 260000,
        location: 'Dakar, Plateau',
        contact: '221771234567',
        details: 'Je cherche un iPhone 13 en bon état avec batterie > 85%. Paiement cash immédiat.',
        created_at: new Date().toISOString()
      },
      {
        id: 'demo-2',
        title: 'Robe Wax moderne mariage',
        budget: 25000,
        location: 'Thiès',
        contact: '221789876543',
        details: 'Cherche couturier ou boutique proposant de belles robes wax pour cérémonie ce weekend.',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'demo-3',
        title: 'Toyota Corolla 2015-2018 automatique',
        budget: 4500000,
        location: 'Dakar, VDN',
        contact: '221761112233',
        details: 'Acheteur sérieux cherche véhicule propre dédouané avec clim d\'origine.',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];

    const mergedMap = new Map();
    // Priorité aux demandes locales et distantes
    localData.forEach(item => mergedMap.set(String(item.id || item.title), item));
    remoteData.forEach(item => mergedMap.set(String(item.id || item.title), item));

    if (mergedMap.size === 0) {
      setRequests(demoRequests);
    } else {
      const allReqs = Array.from(mergedMap.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRequests(allReqs);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.budget || !formData.contact) {
      toast.error('Veuillez remplir le titre, le budget et votre contact.');
      return;
    }

    setSubmitting(true);
    toast.loading('Publication de votre demande...', { id: 'wutal-pub' });

    const cleanContact = formData.contact.replace(/\D/g, '');
    const cleanBudget = parseInt(formData.budget) || 0;

    const payload = {
      title: formData.title,
      budget: cleanBudget,
      location: formData.location,
      contact: cleanContact,
      details: formData.details || '',
      user_id: user?.id || null,
      created_at: new Date().toISOString()
    };

    let createdItem = {
      id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      ...payload
    };

    try {
      // Insertion dans la base de données Supabase globale pour que TOUS les utilisateurs la voient
      const { data, error } = await supabase
        .from('buyer_requests')
        .insert([payload])
        .select();

      if (error) {
        console.error('Erreur Supabase insert buyer_requests:', error);
        toast.error(`Sauvegardé localement. (Note Supabase: ${error.message})`, { id: 'wutal-pub', duration: 5000 });
      } else if (data && data[0]) {
        createdItem = data[0];
        toast.success('🎉 Votre demande a été publiée avec succès ! Tous les utilisateurs la voient.', { id: 'wutal-pub' });
      } else {
        toast.success('🎉 Votre demande a été publiée !', { id: 'wutal-pub' });
      }
    } catch (err) {
      console.error('Exception Supabase insert:', err);
      toast.success('Demande publiée localement !', { id: 'wutal-pub' });
    }

    // Sauvegarde permanente dans le navigateur
    saveLocalRequest(createdItem);

    // Mise à jour instantanée du composant
    setRequests(prev => [createdItem, ...prev.filter(r => String(r.id) !== String(createdItem.id))]);

    setShowModal(false);
    setFormData({ title: '', budget: '', location: 'Dakar', contact: '', details: '' });
    setSubmitting(false);
  };

  const filteredRequests = requests.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px', paddingBottom: '100px' }}>
      {/* Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} className="active-scale" style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#FFFBEB', border: '2px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
              <img src={totemLapin} alt="Totem Lapin" style={{ width: '50px', height: '50px', objectFit: 'contain', transform: 'scale(1.35)' }} />
            </div>
            Wutal Ma (Demandes des Acheteurs)
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Vous ne trouvez pas un article ? Déposez votre besoin et recevez des offres de vendeurs !
          </p>
        </div>
      </div>

      {/* Top Banner Action */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #C0392B 100%)', color: 'white', borderRadius: '24px', padding: '24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 8px 25px rgba(138,28,28,0.25)' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '900', margin: '0 0 6px 0' }}>Vous cherchez un produit spécifique ?</h2>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>Publiez votre demande gratuitement et les boutiques vous contacteront directement sur WhatsApp.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="active-scale" 
          style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '14px 24px', borderRadius: '16px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
        >
          <Plus size={20} /> Publier ma demande
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une demande (ex: iPhone, voiture, robe...)"
          style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '16px', border: '1.5px solid #E2E8F0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
        />
        <Search size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
      </div>

      {/* Requests Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Chargement des demandes...</div>
      ) : filteredRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
          <h3>Aucune demande trouvée</h3>
          <p style={{ color: 'var(--text-muted)' }}>Soyez le premier à publier votre besoin !</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRequests.map(req => (
            <div key={req.id} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                  {req.title}
                </h3>
                <div style={{ background: '#FEF3C7', color: '#B45309', padding: '6px 14px', borderRadius: '20px', fontWeight: '900', fontSize: '1rem' }}>
                  Budget: {(req.budget || 0).toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              {req.details && (
                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                  {req.details}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', pt: '10px', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} color="#d97706" /> {req.location}
                  </span>
                  <span>•</span>
                  <span>{new Date(req.created_at).toLocaleDateString()}</span>
                </div>

                <a 
                  href={`https://wa.me/${(req.contact || '').replace(/\+/g, '')}?text=${encodeURIComponent(`Bonjour, j'ai vu votre demande "${req.title}" sur Colobane Market. J'ai ce produit disponible !`)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="active-scale"
                  style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: 'white', padding: '10px 18px', borderRadius: '14px', textDecoration: 'none', fontWeight: '800', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}
                >
                  <MessageSquare size={16} /> Proposer mon offre (WhatsApp)
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Publier Demande */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '24px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '0 0 6px 0', fontFamily: 'var(--font-heading)' }}>
              🙋‍♂️ Publier une demande d'achat
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Décrivez ce que vous cherchez, les vendeurs vous contacteront.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>Que cherchez-vous ? *</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: iPhone 13 Pro 128 Go, Sac Gucci, Toyota Corolla..."
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>Votre budget max (FCFA) *</label>
                <input 
                  type="number" 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  placeholder="Ex: 250000"
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>Votre ville / quartier *</label>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Ex: Dakar Plateau, Thiès, Parcelles..."
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>Numéro WhatsApp pour recevoir les offres *</label>
                <input 
                  type="tel" 
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  placeholder="Ex: 77 123 45 67"
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>Détails / Précisions</label>
                <textarea 
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  placeholder="Ex: Couleur noire souhaitée, état très propre, pas de rayures."
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting} 
                className="btn-primary active-scale" 
                style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: '900', fontSize: '1rem', border: 'none', marginTop: '10px' }}
              >
                {submitting ? 'Enregistrement...' : 'Publier ma demande'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerRequestsPage;
