import React, { useState } from 'react';
import toast from 'react-hot-toast';

const formatPlanType = (planType) => {
  if (!planType) return 'Inconnu';
  if (planType.startsWith('boost_product_')) {
    const match = planType.match(/^boost_product_(\d+)d_(.+)$/);
    if (match) return `🚀 Boost ${match[1]} Jours`;
    return '🚀 Boost Produit';
  }
  const types = {
    pass_semaine:        '⚡ Pass Semaine (7j - 1 000F)',
    pass_15jours:        '⚡ Pass 15 Jours (15j - 2 500F)',
    forfait_basique:     '📦 Forfait Basique (30j - 5 000F)',
    forfait_premium:     '⭐ Forfait Premium (30j - 10 000F)',
    forfait_boutique:    '🏪 Forfait Boutique (30j - 15 000F)',
    forfait_standard:    '📋 Forfait Standard',
    seller_pro:          '💼 Seller Pro',
    boutique_premium:    '🏆 Boutique Premium',
    Certification:       '👑 Certification (5 000F)',
    boost_reel_7j:       '🎬 Boost Reel (7j - 1 500F)'
  };
  return types[planType] || planType;
};

const PaymentRequestsTab = ({
  paiements = [],
  onValiderPaiement,
  onRefuserPaiement,
  onZoomImage
}) => {
  const [activeSubTab, setActiveSubTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedTemplatePaiement, setSelectedTemplatePaiement] = useState(null);

  const pendingList = paiements.filter(p => p.status === 'pending');
  const historyList = paiements.filter(p => p.status !== 'pending');

  const currentList = activeSubTab === 'pending' ? pendingList : historyList;

  const filteredList = currentList.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = !query || 
      p.transaction_id?.toLowerCase().includes(query) ||
      p.phone_number?.includes(query) ||
      p.profiles?.full_name?.toLowerCase().includes(query) ||
      p.profiles?.phone_number?.includes(query);

    const matchType = filterType === 'all' || 
      (filterType === 'boost' && p.plan_type?.startsWith('boost_product_')) ||
      (filterType === 'reel' && p.plan_type === 'boost_reel_7j') ||
      (filterType === 'certification' && p.plan_type === 'Certification') ||
      (filterType === 'abonnement' && !p.plan_type?.startsWith('boost_product_') && p.plan_type !== 'Certification' && p.plan_type !== 'boost_reel_7j');

    return matchSearch && matchType;
  });

  const exportToCSV = () => {
    if (filteredList.length === 0) {
      toast.error('Aucune donnée à exporter.');
      return;
    }
    const headers = ['Date', 'Nom Vendeur', 'Telephone', 'Offre / Plan', 'Montant (FCFA)', 'ID Transaction', 'Statut'];
    const rows = filteredList.map(p => [
      new Date(p.created_at).toLocaleDateString('fr-FR'),
      `"${(p.profiles?.full_name || 'Utilisateur').replace(/"/g, '""')}"`,
      `"${p.phone_used || p.phone_number || p.profiles?.phone_number || ''}"`,
      `"${formatPlanType(p.plan_type)}"`,
      p.amount || 0,
      `"${p.transaction_id || ''}"`,
      p.status === 'approved' ? 'VALIDE' : p.status === 'rejected' ? 'REFUSE' : 'EN_ATTENTE'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `colobane_paiements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rapport de paiements exporté en CSV !');
  };

  const getWaLink = (p, templateKey = 'confirm') => {
    const rawPhone = p.phone_used || p.phone_number || p.profiles?.phone_number || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const waPhone = cleanPhone.length === 9 ? `221${cleanPhone}` : cleanPhone;
    if (!waPhone) return null;

    const name = p.profiles?.full_name || 'Vendeur';
    const amount = p.amount || 0;
    const plan = formatPlanType(p.plan_type);

    let text = '';
    if (templateKey === 'confirm') {
      text = `Bonjour ${name} ! Votre paiement Wave de ${amount} FCFA (${plan}) a été VALIDÉ avec succès sur Colobane Market 🎉 Merci pour votre confiance !`;
    } else if (templateKey === 'receipt') {
      text = `Bonjour ${name} ! Nous avons bien reçu votre notification de paiement pour ${plan}, mais la capture d'écran reçue n'est pas lisible. Pouvez-vous nous renvoyer la preuve de transfert Wave ici ? Merci !`;
    } else if (templateKey === 'refuse') {
      text = `Bonjour ${name} ! Votre demande de paiement de ${amount} FCFA pour ${plan} n'a pas pu être validée. Merci de contacter le support si vous avez un doute.`;
    } else {
      text = `Bonjour ${name} ! Équipe Colobane Market au sujet de votre paiement Wave de ${amount} FCFA.`;
    }

    return `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar with Sub Tabs & Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveSubTab('pending')}
            style={subTabStyle(activeSubTab === 'pending')}
          >
            ⏳ En Attente ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            style={subTabStyle(activeSubTab === 'history')}
          >
            📜 Historique Traité ({historyList.length})
          </button>
        </div>

        <button
          onClick={exportToCSV}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: '1px solid #10B981',
            background: '#ECFDF5',
            color: '#047857',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📥 Exporter le Rapport (CSV)
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Rechercher par ID transaction, nom ou téléphone..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1' }}
        />

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: 'white' }}
        >
          <option value="all">Tous les types de paiement</option>
          <option value="reel">Boosts Reels (1 500 F)</option>
          <option value="abonnement">Abonnements / Forfaits</option>
          <option value="boost">Boosts Produits</option>
          <option value="certification">Certifications</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Vendeur</th>
              <th style={thStyle}>Formule / Offre</th>
              <th style={thStyle}>Montant</th>
              <th style={thStyle}>Trans. ID / Reçu</th>
              <th style={thStyle}>Statut</th>
              <th style={thStyle}>Actions & WhatsApp Templates</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  Aucune transaction enregistrée.
                </td>
              </tr>
            ) : (
              filteredList.map((p) => {
                const rawPhone = p.phone_used || p.phone_number || p.profiles?.phone_number || '';
                const confirmUrl = getWaLink(p, 'confirm');

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={tdStyle}>{new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={tdStyle}>
                      <strong>{p.profiles?.full_name || 'Utilisateur'}</strong>
                      <br />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <small style={{ color: '#64748B' }}>{rawPhone || 'N/A'}</small>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: '700', color: '#1E293B' }}>{formatPlanType(p.plan_type)}</span>
                    </td>
                    <td style={tdStyle}>
                      <strong style={{ color: '#059669' }}>{p.amount ? `${p.amount} FCFA` : '—'}</strong>
                    </td>
                    <td style={tdStyle}>
                      <code>{p.transaction_id || 'N/A'}</code>
                      {p.proof_url && (
                        <button
                          onClick={() => onZoomImage(p.proof_url)}
                          style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}
                        >
                          🖼️ Voir Reçu
                        </button>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(p.status)}>
                        {p.status === 'approved' ? '✅ Validé' : p.status === 'rejected' ? '❌ Refusé' : '⏳ En attente'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onValiderPaiement(p)}
                              style={{ padding: '6px 12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => onRefuserPaiement(p.id)}
                              style={{ padding: '6px 10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Refuser
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedTemplatePaiement(p)}
                          style={{
                            padding: '6px 10px',
                            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          💬 Modèles WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* WhatsApp Template Selector Modal */}
      {selectedTemplatePaiement && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                💬 Envoyer un message WhatsApp au Vendeur
              </h3>
              <button onClick={() => setSelectedTemplatePaiement(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '16px' }}>
              Vendeur : <strong>{selectedTemplatePaiement.profiles?.full_name || 'Utilisateur'}</strong> ({selectedTemplatePaiement.phone_used || selectedTemplatePaiement.profiles?.phone_number || 'N/A'})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={getWaLink(selectedTemplatePaiement, 'confirm')}
                target="_blank"
                rel="noreferrer"
                onClick={() => setSelectedTemplatePaiement(null)}
                style={templateBtnStyle('#DCFCE7', '#15803D')}
              >
                ✅ Confirmation de Validation du Paiement
              </a>

              <a
                href={getWaLink(selectedTemplatePaiement, 'receipt')}
                target="_blank"
                rel="noreferrer"
                onClick={() => setSelectedTemplatePaiement(null)}
                style={templateBtnStyle('#FEF3C7', '#D97706')}
              >
                🖼️ Demander un nouveau reçu (Reçu Ilisible)
              </a>

              <a
                href={getWaLink(selectedTemplatePaiement, 'refuse')}
                target="_blank"
                rel="noreferrer"
                onClick={() => setSelectedTemplatePaiement(null)}
                style={templateBtnStyle('#FEE2E2', '#B91C1C')}
              >
                ❌ Notification de Refus / Problème
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const subTabStyle = (active) => ({
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  background: active ? 'var(--primary, #8a1c1c)' : '#F1F5F9',
  color: active ? 'white' : '#475569',
  fontWeight: '700',
  fontSize: '0.85rem',
  cursor: 'pointer'
});

const templateBtnStyle = (bg, color) => ({
  padding: '12px 16px',
  borderRadius: '12px',
  background: bg,
  color: color,
  fontWeight: 700,
  fontSize: '0.88rem',
  textDecoration: 'none',
  display: 'block',
  border: '1px solid rgba(0,0,0,0.05)',
  transition: 'transform 0.2s'
});

const thStyle = { padding: '14px 16px', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' };
const tdStyle = { padding: '14px 16px', verticalAlign: 'middle' };

const statusBadgeStyle = (status) => ({
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '0.75rem',
  fontWeight: '700',
  background: status === 'approved' ? '#DCFCE7' : status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
  color: status === 'approved' ? '#15803D' : status === 'rejected' ? '#B91C1C' : '#D97706'
});

export default PaymentRequestsTab;
