import React, { useState } from 'react';

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
      (filterType === 'certification' && p.plan_type === 'Certification') ||
      (filterType === 'abonnement' && !p.plan_type?.startsWith('boost_product_') && p.plan_type !== 'Certification');

    return matchSearch && matchType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveSubTab('pending')}
          style={subTabStyle(activeSubTab === 'pending')}
        >
          En Attente de Validation ({pendingList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          style={subTabStyle(activeSubTab === 'history')}
        >
          Historique Traité ({historyList.length})
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
          <option value="abonnement">Abonnements / Forfaits</option>
          <option value="boost">Boosts Produits</option>
          <option value="certification">Certifications</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Utilisateur</th>
              <th style={thStyle}>Formule / Offre</th>
              <th style={thStyle}>Montant</th>
              <th style={thStyle}>Trans. ID / Capture</th>
              <th style={thStyle}>Statut</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  Aucune requête trouvée.
                </td>
              </tr>
            ) : (
              filteredList.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={tdStyle}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={tdStyle}>
                    <strong>{p.profiles?.full_name || 'Utilisateur'}</strong>
                    <br />
                    <small style={{ color: '#64748B' }}>{p.phone_number || p.profiles?.phone_number || 'N/A'}</small>
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
                    {p.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => onValiderPaiement(p)}
                          style={{ padding: '6px 12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => onRefuserPaiement(p.id)}
                          style={{ padding: '6px 12px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Refuser
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Traité</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
