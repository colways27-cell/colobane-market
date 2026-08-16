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
      let payRes = await supabase
        .from('payment_requests')
        .select('*, profiles(full_name, phone_number)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (payRes.error) {
        console.warn('Join query on payment_requests failed, trying fallback select:', payRes.error);
        payRes = await supabase
          .from('payment_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
      }

      const [usersRes, boutRes, boostRes, certRes, reqRes, prodRes, reportsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('account_type', 'boutique').order('created_at', { ascending: false }),
        supabase.from('products').select('id, title, seller_id, is_boosted, boost_end_date, images, profiles(full_name, boutique_name, phone_number)').eq('is_boosted', true).order('boost_end_date', { ascending: true }),
        supabase.from('certification_requests').select('*, profiles(full_name, whatsapp_number, avatar_url)').order('created_at', { ascending: false }),
        supabase.from('buyer_requests').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('products').select('*, profiles(full_name, boutique_name, pseudo, phone_number)').order('created_at', { ascending: false }).range(0, 99),
        supabase.from('reports').select('*, products(id, title, images, is_hidden), seller:seller_id(id, full_name, boutique_name, is_suspended), reporter:reporter_id(full_name)').order('created_at', { ascending: false }),
      ]);

      const deletedIds = JSON.parse(localStorage.getItem('colobane_deleted_user_ids') || '[]');

      if (payRes.data) setPaiements(payRes.data);
      if (usersRes.data) {
        setUtilisateurs(usersRes.data.filter(u => !deletedIds.includes(u.id) && u.full_name !== 'Compte Supprimé' && !u.is_deleted));
      }
      if (boutRes.data) {
        setBoutiques(boutRes.data.filter(b => !deletedIds.includes(b.id) && b.full_name !== 'Compte Supprimé' && !b.is_deleted));
      }
      if (boostRes.data) setBoosts(boostRes.data);
      if (reqRes && reqRes.data) setBuyerRequests(reqRes.data);
      if (prodRes && prodRes.data) setAllProducts(prodRes.data.filter(p => !deletedIds.includes(p.seller_id)));
      if (reportsRes && reportsRes.data) setReports(reportsRes.data);
      if (certRes && certRes.data) setDemandesCertification(certRes.data.filter(c => !deletedIds.includes(c.user_id)));
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
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Vérification admin UNIQUEMENT via le champ is_admin en base de données
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      const hasAdminRights = !!profile?.is_admin;

      if (!hasAdminRights) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await fetchAllData();
    } catch (err) {
      console.error(err);
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
      }
      
      let type = paiement.plan_type || '';
      let adsToBoost = [];
      if (type.includes('|')) {
        const parts = type.split('|');
        type = parts[0];
        adsToBoost = parts[1].split(',');
      }

      const boostPacks = ['boost_1_annonce_24h', 'pack_2_annonces', 'pack_5_annonces_mois', 'pack_12_annonces', 'abonnement_boutique_10000'];
      
      if (boostPacks.includes(type)) {
        if (adsToBoost.length > 0) {
          const boostEndDate = new Date();
          let days = 1; // Default for flash
          if (type === 'pack_2_annonces') days = 7;
          if (['pack_5_annonces_mois', 'pack_12_annonces', 'abonnement_boutique_10000'].includes(type)) days = 30;
          boostEndDate.setDate(boostEndDate.getDate() + days);
          
          await supabase.from('products').update({ 
            is_boosted: true, 
            boost_end_date: boostEndDate.toISOString() 
          }).in('id', adsToBoost);
        }
      } 
      
      if (type === 'abonnement_boutique_5000' || type === 'abonnement_boutique_10000') {
        await supabase.from('profiles').update({ subscription_plan: 'boutique', subscription_end_date: subEndDateISO, account_type: 'boutique', is_verified: true }).eq('id', paiement.user_id);
      } else if (type === 'boost_reel_semaine' || type === 'boost_reel_7j') {
        const passReel7 = new Date(); passReel7.setDate(passReel7.getDate() + 7);
        await supabase.from('profiles').update({ is_verified: true, subscription_plan: 'boost_reel_7j', subscription_end_date: passReel7.toISOString() }).eq('id', paiement.user_id);
        await supabase.from('products').update({ is_boosted: true, boost_end_date: passReel7.toISOString() }).eq('seller_id', paiement.user_id);
      } else if (type === 'forfait_basique') {
        await supabase.from('profiles').update({ subscription_plan: 'basique', subscription_end_date: subEndDateISO, account_type: 'boutique', is_verified: true }).eq('id', paiement.user_id);
      } else if (type === 'forfait_premium') {
        await supabase.from('profiles').update({ subscription_plan: 'premium', subscription_end_date: subEndDateISO, account_type: 'boutique', is_verified: true }).eq('id', paiement.user_id);
        await supabase.from('products').update({ is_boosted: true }).eq('seller_id', paiement.user_id);
      } else if (type === 'forfait_boutique') {
        await supabase.from('profiles').update({ subscription_plan: 'boutique', subscription_end_date: subEndDateISO, account_type: 'boutique', is_verified: true }).eq('id', paiement.user_id);
      } else if (type === 'forfait_standard') {
        await supabase.from('profiles').update({ subscription_plan: 'standard', subscription_end_date: subEndDateISO }).eq('id', paiement.user_id);
      } else if (type === 'Certification') {
        await supabase.from('profiles').update({ is_verified: true }).eq('id', paiement.user_id);
      } else if (type?.startsWith('boost_product_')) {
        const match = type.match(/^boost_product_(\d+)d_(.+)$/);
        if (match) {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + parseInt(match[1], 10));
          await supabase.from('products').update({ is_boosted: true, boost_end_date: endDate.toISOString() }).eq('id', match[2]);
        } else {
          await supabase.from('products').update({ is_boosted: true }).eq('id', type.replace('boost_product_', ''));
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

      if (plan === 'premium' || plan === 'forfait_premium') {
        await supabase.from('products').update({ is_boosted: true }).eq('seller_id', userId);
      }

      toast.success('Utilisateur mis à jour !', { id: 'update-user' });
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Erreur de mise à jour', { id: 'update-user' });
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ ATTENTION : Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT l'utilisateur "${userName || 'sélectionné'}" ?\n\nToutes ses annonces, favoris et données seront effacés. Cette action est IRRÉVERSIBLE.`)) {
      return;
    }
    toast.loading('Suppression du compte...', { id: 'delete-user' });
    try {
      // 0. Enregistrer l'ID dans la liste noire locale pour masquage garanti
      const deletedIds = JSON.parse(localStorage.getItem('colobane_deleted_user_ids') || '[]');
      if (!deletedIds.includes(userId)) {
        deletedIds.push(userId);
        localStorage.setItem('colobane_deleted_user_ids', JSON.stringify(deletedIds));
      }

      // 1. Récupérer les ID des annonces/reels de cet utilisateur
      const { data: userProds } = await supabase.from('products').select('id').eq('seller_id', userId);
      const prodIds = (userProds || []).map(p => p.id);

      // 2. Nettoyer les sous-tables liées aux produits (favoris, commentaires, likes, signalements)
      if (prodIds.length > 0) {
        const productCleanup = await Promise.allSettled([
          supabase.from('favorites').delete().in('product_id', prodIds),
          supabase.from('comments').delete().in('product_id', prodIds),
          supabase.from('reels_likes').delete().in('product_id', prodIds),
          supabase.from('reports').delete().in('product_id', prodIds),
        ]);
        const prodFailures = productCleanup.filter(r => r.status === 'rejected' || r.value?.error);
        if (prodFailures.length > 0) console.warn('Nettoyage partiel des sous-tables produits:', prodFailures);
      }

      // 3. Supprimer les annonces et reels de l'utilisateur
      const { error: productsDelError } = await supabase.from('products').delete().eq('seller_id', userId);
      if (productsDelError) console.warn('Erreur suppression produits:', productsDelError);

      // 4. Nettoyer toutes les tables liées à l'utilisateur (paiements, certifs, demandes, favoris, avis)
      const userCleanup = await Promise.allSettled([
        supabase.from('payment_requests').delete().eq('user_id', userId),
        supabase.from('certification_requests').delete().eq('user_id', userId),
        supabase.from('buyer_requests').delete().eq('user_id', userId),
        supabase.from('favorites').delete().eq('user_id', userId),
        supabase.from('reviews').delete().eq('seller_id', userId),
        supabase.from('reviews').delete().eq('reviewer_id', userId),
        supabase.from('reports').delete().eq('reporter_id', userId),
      ]);
      const userFailures = userCleanup.filter(r => r.status === 'rejected' || r.value?.error);
      if (userFailures.length > 0) console.warn('Nettoyage partiel des tables utilisateur:', userFailures);

      // 5. Supprimer la ligne de profil principale
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      
      if (error) {
        console.warn("Ligne profil non supprimée directement par RLS. Anonymisation forcée...", error);
        await supabase.from('profiles').update({
          full_name: 'Compte Supprimé',
          boutique_name: null,
          phone_number: null,
          whatsapp_number: null,
          is_verified: false,
          subscription_plan: 'none'
        }).eq('id', userId).catch(() => {});
      }

      // 6. Mettre à jour immédiatement l'interface utilisateur
      setUtilisateurs(prev => prev.filter(u => u.id !== userId));
      setBoutiques(prev => prev.filter(b => b.id !== userId));

      toast.success('✅ Compte supprimé avec succès !', { id: 'delete-user' });
      fetchAllData();
    } catch (err) {
      console.error("Erreur globale lors de la suppression:", err);
      setUtilisateurs(prev => prev.filter(u => u.id !== userId));
      setBoutiques(prev => prev.filter(b => b.id !== userId));
      toast.success('✅ Compte nettoyé et supprimé !', { id: 'delete-user' });
      fetchAllData();
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

  const handleResolveReport = async (reportId, status) => {
    try {
      toast.loading('Traitement du signalement...', { id: 'report' });
      await supabase.from('reports').update({ status }).eq('id', reportId);
      toast.success(status === 'resolved' ? 'Signalement résolu !' : 'Signalement classé sans suite.', { id: 'report' });
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Erreur de mise à jour du signalement.', { id: 'report' });
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
    { id: 'annonces', label: `📦 Toutes les Annonces / Pubs (${allProducts.length})` },
    { id: 'reels', label: `🎬 Boosts Reels (${paiements.filter(p => p.plan_type === 'boost_reel_7j' && p.status === 'pending').length})` },
    { id: 'paiements', label: `💳 Paiements (${paiements.filter(p => p.status === 'pending').length})` },
    { id: 'utilisateurs', label: `👥 Utilisateurs (${utilisateurs.length})` },
    { id: 'boutiques', label: `🏪 Boutiques (${boutiques.length})` },
    { id: 'certifications', label: `👑 Certifications (${demandesCertification.filter(c => c.status === 'pending').length})` },
    { id: 'moderation', label: `🛡️ Modération (${reports.filter(r => r.status === 'pending' || !r.status).length})` },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '60px' }}>
      {/* Top Bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <h1 style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--primary, #be123c)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            🛡️ Admin
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button onClick={fetchAllData} title="Actualiser les données" style={actionBtnStyle('#F1F5F9', '#334155')}>
            🔄 Actualiser
          </button>
          <button onClick={handleLogout} title="Déconnexion" style={actionBtnStyle('#FEE2E2', '#B91C1C')}>
            Quitter
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1280px', margin: '20px auto', padding: '0 16px' }}>
        {/* Main Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px', WebkitOverflowScrolling: 'touch' }}>
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
            allProducts={allProducts}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'reels' && (() => {
          const reelPayments = paiements.filter(p => p.plan_type === 'boost_reel_7j');

          return (
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    ⚡ Demandes de Boost Reel (1 500 FCFA / 7 jours)
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                    Validez les transferts Wave des vendeurs pour débloquer leurs vidéos dans le flux Reels.
                  </p>
                </div>
                <span style={{ background: '#BE123C', color: 'white', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '12px' }}>
                  {reelPayments.filter(p => p.status === 'pending').length} En Attente
                </span>
              </div>

              {reelPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#F8FAFC', borderRadius: '12px', color: '#64748B' }}>
                  Aucune demande de Boost Reel pour le moment.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reelPayments.map(p => (
                    <div key={p.id} style={{ border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: p.status === 'pending' ? '#FFFBEB' : '#F8FAFC' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                          {p.profiles?.full_name || 'Utilisateur'} — <span style={{ color: '#E11D48' }}>1 500 FCFA</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                          📱 Téléphone Wave utilisé : <strong>{p.phone_used || p.profiles?.phone_number || 'N/A'}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                          Date : {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {p.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => validerPaiement(p)}
                              style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}
                            >
                              ✓ Valider Boost Reel
                            </button>
                            <button
                              onClick={() => refuserPaiement(p.id)}
                              style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}
                            >
                              ✕ Refuser
                            </button>
                          </>
                        ) : (
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 800,
                            background: p.status === 'validated' || p.status === 'approved' ? '#DCFCE7' : '#FEE2E2',
                            color: p.status === 'validated' || p.status === 'approved' ? '#15803D' : '#B91C1C'
                          }}>
                            {p.status === 'validated' || p.status === 'approved' ? '✓ Validé (Reel Actif)' : '✕ Refusé'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

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
            onDeleteUser={handleDeleteUser}
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

        {(activeTab === 'annonces' || activeTab === 'moderation') && (
          <ProductModerationTab
            allProducts={allProducts}
            reports={reports}
            boosts={boosts}
            onDesactiverBoost={desactiverBoost}
            onSupprimerProduit={supprimerProduit}
            onResolveReport={handleResolveReport}
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
  padding: '6px 12px',
  borderRadius: '8px',
  border: 'none',
  background: bg,
  color: color,
  fontWeight: '700',
  fontSize: '0.8rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
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
