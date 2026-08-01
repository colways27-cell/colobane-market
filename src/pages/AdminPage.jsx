import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

import AdminOverview from '../components/admin/AdminOverview';
import PaymentRequestsTab from '../components/admin/PaymentRequestsTab';
import UserManagementTab from '../components/admin/UserManagementTab';
import BoutiqueApprovalTab from '../components/admin/BoutiqueApprovalTab';
import CertificationTab from '../components/admin/CertificationTab';
import ProductModerationTab from '../components/admin/ProductModerationTab';

const AdminPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [paiements, setPaiements] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [boutiques, setBoutiques] = useState([]);
  const [boosts, setBoosts] = useState([]);
  const [demandesCertification, setDemandesCertification] = useState([]);
  const [buyerRequests, setBuyerRequests] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [zoomImage, setZoomImage] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [payRes, usersRes, boutRes, boostRes, certRes, reqRes, prodRes, reportsRes] = await Promise.all([
        supabase.from('payment_requests').select('*, profiles(full_name, phone_number)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('account_type', 'boutique').order('created_at', { ascending: false }),
        supabase.from('products').select('id, title, seller_id, is_boosted, boost_end_date, images, profiles(full_name, boutique_name, phone_number)').eq('is_boosted', true).order('boost_end_date', { ascending: true }),
        supabase.from('certification_requests').select('*, profiles(full_name, whatsapp_number, avatar_url)').order('created_at', { ascending: false }),
        supabase.from('buyer_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*, profiles(full_name, boutique_name, pseudo, phone_number)').order('created_at', { ascending: false }).limit(200),
        supabase.from('reports').select('*, products(id, title, images, is_hidden), seller:seller_id(id, full_name, boutique_name, is_suspended), reporter:reporter_id(full_name)').order('created_at', { ascending: false }),
      ]);

      if (payRes.data) setPaiements(payRes.data);
      if (usersRes.data) setUtilisateurs(usersRes.data);
      if (boutRes.data) setBoutiques(boutRes.data);
      if (boostRes.data) setBoosts(boostRes.data);
      if (reqRes && reqRes.data) setBuyerRequests(reqRes.data);
      if (prodRes && prodRes.data) setAllProducts(prodRes.data);
      if (reportsRes && reportsRes.data) setReports(reportsRes.data);
      if (certRes && certRes.data) setDemandesCertification(certRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const checkAdminAccess = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (profile?.is_admin) {
          setIsAdmin(true);
          fetchAllData();
          return;
        }
      }
      setIsAdmin(false);
      setLoading(false);
    } catch (_err) {
      setIsAdmin(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAdminAccess();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    navigate('/');
  };

  const validerPaiement = async (paiement) => {
    try {
      toast.loading('Validation en cours...', { id: 'validate' });
      const { error: payError } = await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', paiement.id);
      if (payError) throw payError;

      const subEndDate = new Date();
      subEndDate.setDate(subEndDate.getDate() + 30);
      const subEndDateISO = subEndDate.toISOString();

      if (paiement.plan_type === 'pass_semaine') {
        const pass7 = new Date(); pass7.setDate(pass7.getDate() + 7);
        await supabase.from('profiles').update({ subscription_plan: 'pass_semaine', subscription_end_date: pass7.toISOString(), account_type: 'boutique', is_verified: true }).eq('id', paiement.user_id);
      } else if (paiement.plan_type === 'pass_15jours') {
        const pass15 = new Date(); pass15.setDate(pass15.getDate() + 15);
        await supabase.from('profiles').update({ subscription_plan: 'pass_15jours', subscription_end_date: pass15.toISOString(), account_type: 'boutique', is_verified: true }).eq('id', paiement.user_id);
      } else if (paiement.plan_type === 'forfait_basique') {
        await supabase.from('profiles').update({ subscription_plan: 'basique', subscription_end_date: subEndDateISO, account_type: 'boutique', is_verified: true }).eq('id', paiement.user_id);
      } else if (paiement.plan_type === 'forfait_premium') {
        await supabase.from('profiles').update({ subscription_plan: 'premium', subscription_end_date: subEndDateISO, account_type: 'boutique', is_verified: true }).eq('id', paiement.user_id);
        await supabase.from('products').update({ is_boosted: true }).eq('seller_id', paiement.user_id);
      } else if (paiement.plan_type === 'forfait_boutique') {
        await supabase.from('profiles').update({ subscription_plan: 'boutique', subscription_end_date: subEndDateISO, account_type: 'boutique', is_verified: true }).eq('id', paiement.user_id);
      } else if (paiement.plan_type === 'forfait_standard') {
        await supabase.from('profiles').update({ subscription_plan: 'standard', subscription_end_date: subEndDateISO }).eq('id', paiement.user_id);
      } else if (paiement.plan_type === 'Certification') {
        await supabase.from('profiles').update({ is_verified: true }).eq('id', paiement.user_id);
      } else if (paiement.plan_type?.startsWith('boost_product_')) {
        const match = paiement.plan_type.match(/^boost_product_(\d+)d_(.+)$/);
        if (match) {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + parseInt(match[1], 10));
          await supabase.from('products').update({ is_boosted: true, boost_end_date: endDate.toISOString() }).eq('id', match[2]);
        } else {
          await supabase.from('products').update({ is_boosted: true }).eq('id', paiement.plan_type.replace('boost_product_', ''));
        }
      }
      toast.success('✅ Paiement validé !', { id: 'validate' });
      fetchAllData();
    } catch {
      toast.error('Erreur de validation', { id: 'validate' });
    }
  };

  const refuserPaiement = async (id) => {
    if (!window.confirm('Refuser ce paiement ?')) return;
    try {
      toast.loading('Refus...', { id: 'refuse' });
      await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', id);
      toast.success('Paiement refusé', { id: 'refuse' });
      fetchAllData();
    } catch {
      toast.error('Erreur', { id: 'refuse' });
    }
  };

  const validerBoutique = async (id) => {
    try {
      toast.loading('Vérification...', { id: 'verify' });
      await supabase.from('profiles').update({ is_verified: true }).eq('id', id);
      toast.success('Boutique certifiée !', { id: 'verify' });
      fetchAllData();
    } catch {
      toast.error('Erreur', { id: 'verify' });
    }
  };

  const desactiverBoost = async (productId) => {
    if (!window.confirm('Désactiver ce boost ?')) return;
    try {
      toast.loading('Désactivation...', { id: 'deact' });
      await supabase.from('products').update({ is_boosted: false, boost_end_date: null }).eq('id', productId);
      toast.success('Boost désactivé !', { id: 'deact' });
      fetchAllData();
    } catch {
      toast.error('Erreur', { id: 'deact' });
    }
  };

  const supprimerProduit = async (productId, productTitle) => {
    if (!window.confirm(`⚠️ Supprimer définitivement l'annonce "${productTitle}" ?`)) return;
    try {
      toast.loading('Suppression de l\'annonce...', { id: 'del-prod' });
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast.success('✅ Annonce supprimée avec succès !', { id: 'del-prod' });
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression.', { id: 'del-prod' });
    }
  };

  const handleUpdateUserPlan = async ({ userId, plan, accountType, isVerified }) => {
    setUpdatingUser(true);
    toast.loading('Mise à jour...', { id: 'update-user' });
    try {
      const subEndDate = new Date();
      subEndDate.setDate(subEndDate.getDate() + 30);
      const subEndDateISO = plan === 'none' ? null : subEndDate.toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: plan,
          subscription_end_date: subEndDateISO,
          account_type: accountType,
          is_verified: isVerified
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Utilisateur mis à jour !', { id: 'update-user' });
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Erreur de mise à jour', { id: 'update-user' });
    } finally {
      setUpdatingUser(false);
    }
  };

  const validerCertification = async (req) => {
    try {
      toast.loading('Approbation...', { id: 'certify' });
      await supabase.from('certification_requests').update({ status: 'approved' }).eq('id', req.id);
      await supabase.from('profiles').update({ is_verified: true }).eq('id', req.user_id);
      toast.success('Boutique certifiée !', { id: 'certify' });
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'approbation', { id: 'certify' });
    }
  };

  const refuserCertification = async (id) => {
    try {
      toast.loading('Rejet...', { id: 'certify' });
      await supabase.from('certification_requests').update({ status: 'rejected' }).eq('id', id);
      toast.success('Demande rejetée.', { id: 'certify' });
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du rejet', { id: 'certify' });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary, #8a1c1c)' }}>
          Chargement de l'administration...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <h2>Accès Réservé aux Administrateurs</h2>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', background: 'var(--primary, #8a1c1c)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📊 Aperçu Général' },
    { id: 'paiements', label: `💳 Paiements (${paiements.filter(p => p.status === 'pending').length})` },
    { id: 'utilisateurs', label: `👥 Utilisateurs (${utilisateurs.length})` },
    { id: 'boutiques', label: `🏪 Boutiques (${boutiques.length})` },
    { id: 'certifications', label: `👑 Certifications (${demandesCertification.filter(c => c.status === 'pending').length})` },
    { id: 'moderation', label: `🛡️ Modération (${reports.length})` },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '60px' }}>
      {/* Top Bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', sticky: 'top', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--primary, #8a1c1c)', margin: 0 }}>
            Colobane Admin
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchAllData} style={actionBtnStyle('#F1F5F9', '#334155')}>
            🔄 Actualiser
          </button>
          <button onClick={handleLogout} style={actionBtnStyle('#FEE2E2', '#B91C1C')}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1280px', margin: '24px auto', padding: '0 20px' }}>
        {/* Main Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={mainTabStyle(activeTab === t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <AdminOverview
            paiements={paiements}
            utilisateurs={utilisateurs}
            boutiques={boutiques}
            reports={reports}
            demandesCertification={demandesCertification}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'paiements' && (
          <PaymentRequestsTab
            paiements={paiements}
            onValiderPaiement={validerPaiement}
            onRefuserPaiement={refuserPaiement}
            onZoomImage={setZoomImage}
          />
        )}

        {activeTab === 'utilisateurs' && (
          <UserManagementTab
            utilisateurs={utilisateurs}
            onUpdateUserPlan={handleUpdateUserPlan}
            updatingUser={updatingUser}
          />
        )}

        {activeTab === 'boutiques' && (
          <BoutiqueApprovalTab
            boutiques={boutiques}
            onValiderBoutique={validerBoutique}
            onZoomImage={setZoomImage}
          />
        )}

        {activeTab === 'certifications' && (
          <CertificationTab
            demandesCertification={demandesCertification}
            onValiderCertification={validerCertification}
            onRefuserCertification={refuserCertification}
            onZoomImage={setZoomImage}
          />
        )}

        {activeTab === 'moderation' && (
          <ProductModerationTab
            allProducts={allProducts}
            reports={reports}
            boosts={boosts}
            onDesactiverBoost={desactiverBoost}
            onSupprimerProduit={supprimerProduit}
            onZoomImage={setZoomImage}
          />
        )}
      </div>

      {/* Lightbox Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
        >
          <img
            src={zoomImage}
            alt="Zoom"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

const actionBtnStyle = (bg, color) => ({
  padding: '8px 14px',
  borderRadius: '8px',
  border: 'none',
  background: bg,
  color: color,
  fontWeight: '700',
  fontSize: '0.85rem',
  cursor: 'pointer'
});

const mainTabStyle = (active) => ({
  padding: '10px 18px',
  borderRadius: '12px',
  border: 'none',
  background: active ? 'var(--primary, #8a1c1c)' : 'white',
  color: active ? 'white' : '#475569',
  fontWeight: '800',
  fontSize: '0.9rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  boxShadow: active ? '0 4px 12px rgba(138,28,28,0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
});

export default AdminPage;
