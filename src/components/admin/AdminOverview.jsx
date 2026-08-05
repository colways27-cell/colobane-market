import React, { useState } from 'react';

const AdminOverview = ({
  paiements = [],
  utilisateurs = [],
  boutiques = [],
  reports = [],
  demandesCertification = [],
  allProducts = [],
  onNavigateTab
}) => {
  const [timeRange, setTimeRange] = useState('all');

  // Filter items by selected time range
  const filterByRange = (items, dateKey = 'created_at') => {
    if (timeRange === 'all') return items;
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === 'today') {
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRange === '7d') {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      cutoff.setDate(now.getDate() - 30);
    }
    return items.filter(item => {
      if (!item[dateKey]) return false;
      return new Date(item[dateKey]) >= cutoff;
    });
  };

  const filteredPaiements = filterByRange(paiements);
  const filteredUsers = filterByRange(utilisateurs);
  const filteredCerts = filterByRange(demandesCertification);
  const filteredReports = filterByRange(reports);

  const pendingPayments = filteredPaiements.filter(p => p.status === 'pending');
  const pendingCerts = filteredCerts.filter(c => c.status === 'pending');
  const pendingReports = filteredReports.filter(r => r.status === 'pending' || !r.status);

  const approvedPayments = filteredPaiements.filter(p => p.status === 'approved' || p.status === 'validated');
  
  const totalRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingRevenue = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // GMV (Gross Merchandise Value of active listings)
  const gmvListings = allProducts.reduce((sum, p) => sum + Number(p.price || 0), 0);

  // Revenue Breakdown
  const reelRevenue = approvedPayments
    .filter(p => p.plan_type === 'boost_reel_7j')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const subRevenue = approvedPayments
    .filter(p => ['forfait_basique', 'forfait_premium', 'forfait_boutique', 'forfait_standard', 'pass_semaine', 'pass_15jours'].includes(p.plan_type))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const certRevenue = approvedPayments
    .filter(p => p.plan_type === 'Certification')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const productBoostRevenue = approvedPayments
    .filter(p => p.plan_type?.startsWith('boost_product_'))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const getPercent = (amount) => (totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0);

  // Live Activity Log Feed (combining recent events chronologically)
  const systemEvents = [
    ...paiements.map(p => ({
      id: `pay-${p.id}`,
      date: new Date(p.created_at),
      type: 'payment',
      title: `Paiement Wave (${p.amount || 0} F)`,
      subtitle: `${p.profiles?.full_name || 'Utilisateur'} • ${p.plan_type || 'Forfait'}`,
      badge: p.status === 'approved' ? '✅ Validé' : p.status === 'rejected' ? '❌ Refusé' : '⏳ En attente',
      badgeBg: p.status === 'approved' ? '#DCFCE7' : p.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
      badgeColor: p.status === 'approved' ? '#15803D' : p.status === 'rejected' ? '#B91C1C' : '#D97706',
      tabTarget: 'paiements'
    })),
    ...demandesCertification.map(c => ({
      id: `cert-${c.id}`,
      date: new Date(c.created_at),
      type: 'cert',
      title: `Demande de Certification 👑`,
      subtitle: `Boutique "${c.boutique_name || c.profiles?.full_name || 'Boutique'}"`,
      badge: c.status === 'approved' ? '✅ Approuvé' : c.status === 'rejected' ? '❌ Refusé' : '⏳ En attente',
      badgeBg: c.status === 'approved' ? '#DCFCE7' : c.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
      badgeColor: c.status === 'approved' ? '#15803D' : c.status === 'rejected' ? '#B91C1C' : '#D97706',
      tabTarget: 'certifications'
    })),
    ...reports.map(r => ({
      id: `rep-${r.id}`,
      date: new Date(r.created_at),
      type: 'report',
      title: `Signalement Produit 🚨`,
      subtitle: `Motif : ${r.reason || 'Annonce suspecte'}`,
      badge: r.status === 'resolved' ? '✅ Traité' : '🚨 À traiter',
      badgeBg: r.status === 'resolved' ? '#DCFCE7' : '#FEE2E2',
      badgeColor: r.status === 'resolved' ? '#15803D' : '#B91C1C',
      tabTarget: 'moderation'
    }))
  ].sort((a, b) => b.date - a.date).slice(0, 7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Time Filter Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'white',
        padding: '14px 20px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>⏱️</span>
          <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Période d'analyse</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
          {[
            { id: 'today', label: "Aujourd'hui" },
            { id: '7d', label: '7 Derniers Jours' },
            { id: '30d', label: 'Ce Mois' },
            { id: 'all', label: 'Tout le Temps' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: 'none',
                background: timeRange === t.id ? '#0F172A' : '#F1F5F9',
                color: timeRange === t.id ? 'white' : '#475569',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div style={cardStyle('linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', '#FFFFFF')}>
          <div style={iconStyle}>💳</div>
          <div>
            <div style={labelStyle}>Revenu Net Plateforme</div>
            <div style={{ ...valueStyle, color: '#34D399' }}>{totalRevenue.toLocaleString()} FCFA</div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
              En attente Wave : +{pendingRevenue.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        <div style={cardStyle('linear-gradient(135deg, #312E81 0%, #4338CA 100%)', '#FFFFFF')}>
          <div style={iconStyle}>💎</div>
          <div>
            <div style={labelStyle}>Volume GMV Produits</div>
            <div style={{ ...valueStyle, color: '#A5B4FC' }}>{gmvListings.toLocaleString()} FCFA</div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
              {allProducts.length} annonces en ligne
            </div>
          </div>
        </div>

        <div onClick={() => onNavigateTab('reels')} style={{ ...cardStyle('#FFF1F2', '#BE123C'), cursor: 'pointer' }}>
          <div style={iconStyle}>🎬</div>
          <div>
            <div style={labelStyle}>Revenus Boosts Reels</div>
            <div style={valueStyle}>{reelRevenue.toLocaleString()} FCFA</div>
            <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '2px' }}>
              SLA moyen : &lt; 15 min
            </div>
          </div>
        </div>

        <div onClick={() => onNavigateTab('paiements')} style={{ ...cardStyle('#FEF3C7', '#D97706'), cursor: 'pointer' }}>
          <div style={iconStyle}>⏳</div>
          <div>
            <div style={labelStyle}>Paiements en Attente</div>
            <div style={valueStyle}>{pendingPayments.length}</div>
            <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>À valider rapidement</div>
          </div>
        </div>

        <div onClick={() => onNavigateTab('moderation')} style={{ ...cardStyle('#FEF2F2', '#B91C1C'), cursor: 'pointer' }}>
          <div style={iconStyle}>🚨</div>
          <div>
            <div style={labelStyle}>Signalements Acheteurs</div>
            <div style={valueStyle}>{pendingReports.length}</div>
            <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>Modération à traiter</div>
          </div>
        </div>
      </div>

      {/* Financial Breakdown & Live System Feed Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
        
        {/* Financial Breakdown Panel */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ ...titleStyle, fontSize: '1.05rem', margin: 0 }}>📊 Revenus par Offre</h3>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: '12px' }}>
              Direct Wave Sénégal
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Boosts Reels */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', gap: '8px' }}>
                <span style={{ color: '#E11D48' }}>🎬 Boosts Reels (1 500 FCFA / 7j)</span>
                <span style={{ whiteSpace: 'nowrap' }}>{reelRevenue.toLocaleString()} FCFA ({getPercent(reelRevenue)}%)</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercent(reelRevenue)}%`, height: '100%', background: '#E11D48', borderRadius: '4px', transition: 'width 0.5s' }} />
              </div>
            </div>

            {/* Abonnements & Forfaits */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', gap: '8px' }}>
                <span style={{ color: '#2563EB' }}>📦 Forfaits Pro & Premium</span>
                <span style={{ whiteSpace: 'nowrap' }}>{subRevenue.toLocaleString()} FCFA ({getPercent(subRevenue)}%)</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercent(subRevenue)}%`, height: '100%', background: '#2563EB', borderRadius: '4px', transition: 'width 0.5s' }} />
              </div>
            </div>

            {/* Certifications */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', gap: '8px' }}>
                <span style={{ color: '#D97706' }}>👑 Badges de Certification</span>
                <span style={{ whiteSpace: 'nowrap' }}>{certRevenue.toLocaleString()} FCFA ({getPercent(certRevenue)}%)</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercent(certRevenue)}%`, height: '100%', background: '#D97706', borderRadius: '4px', transition: 'width 0.5s' }} />
              </div>
            </div>

            {/* Boosts Produit */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', gap: '8px' }}>
                <span style={{ color: '#059669' }}>🚀 Boosts Produits Classiques</span>
                <span style={{ whiteSpace: 'nowrap' }}>{productBoostRevenue.toLocaleString()} FCFA ({getPercent(productBoostRevenue)}%)</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercent(productBoostRevenue)}%`, height: '100%', background: '#059669', borderRadius: '4px', transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Taux d'acceptation :</span>
            <strong style={{ color: '#059669', fontSize: '0.95rem' }}>
              {paiements.length > 0 ? Math.round((approvedPayments.length / paiements.length) * 100) : 100}%
            </strong>
          </div>
        </div>

        {/* Live System Activity Feed Panel */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ ...titleStyle, fontSize: '1.05rem', margin: 0 }}>⚡ Fil d'Activité Système</h3>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#3B82F6', background: '#EFF6FF', padding: '4px 10px', borderRadius: '12px' }}>
              En direct
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {systemEvents.length === 0 ? (
              <div style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                Aucun événement récent enregistré.
              </div>
            ) : (
              systemEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => onNavigateTab(event.tabTarget)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.subtitle} • {event.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: event.badgeBg,
                    color: event.badgeColor,
                    marginLeft: '8px',
                    flexShrink: 0
                  }}>
                    {event.badge}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const cardStyle = (bg, color) => ({
  background: bg,
  color: color,
  borderRadius: '16px',
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  border: '1px solid rgba(0,0,0,0.05)',
  boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
});

const iconStyle = {
  fontSize: '1.8rem',
  background: 'rgba(255,255,255,0.6)',
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const labelStyle = { fontSize: '0.85rem', fontWeight: '600', opacity: 0.9 };
const valueStyle = { fontSize: '1.4rem', fontWeight: '800', marginTop: '2px' };
const panelStyle = { background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' };
const titleStyle = { fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px', color: '#1E293B', margin: 0 };

export default AdminOverview;
