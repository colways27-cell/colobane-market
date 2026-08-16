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
        {/* Revenu Net Plateforme */}
        <div style={cardStyle('linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', '#FFFFFF')}>
          <div style={{
            fontSize: '1.8rem',
            background: 'rgba(255,255,255,0.12)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>💳</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#94A3B8' }}>Revenu Net Plateforme</div>
            <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#34D399', marginTop: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {totalRevenue.toLocaleString('fr-FR')} FCFA
            </div>
            <div style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600, marginTop: '2px' }}>
              En attente Wave : +{pendingRevenue.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        </div>

        {/* Volume GMV Produits */}
        <div style={cardStyle('linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', '#FFFFFF')}>
          <div style={{
            fontSize: '1.8rem',
            background: 'rgba(255,255,255,0.18)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>💎</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#E0E7FF' }}>Volume GMV Produits</div>
            <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#FFFFFF', marginTop: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
              {gmvListings.toLocaleString('fr-FR')} FCFA
            </div>
            <div style={{ fontSize: '11px', color: '#C7D2FE', fontWeight: 700, marginTop: '2px' }}>
              {allProducts.length} annonces en ligne
            </div>
          </div>
        </div>

        {/* Revenus Boosts Reels */}
        <div onClick={() => onNavigateTab('reels')} style={{ ...cardStyle('linear-gradient(135deg, #881337 0%, #BE123C 100%)', '#FFFFFF'), cursor: 'pointer' }}>
          <div style={{
            fontSize: '1.8rem',
            background: 'rgba(255,255,255,0.18)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>🎬</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFE4E6' }}>Revenus Boosts Reels</div>
            <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#FFFFFF', marginTop: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {reelRevenue.toLocaleString('fr-FR')} FCFA
            </div>
            <div style={{ fontSize: '11px', color: '#FECDD3', fontWeight: 700, marginTop: '2px' }}>
              SLA moyen : &lt; 15 min
            </div>
          </div>
        </div>

        {/* Paiements en Attente */}
        <div onClick={() => onNavigateTab('paiements')} style={{ ...cardStyle('linear-gradient(135deg, #78350F 0%, #D97706 100%)', '#FFFFFF'), cursor: 'pointer' }}>
          <div style={{
            fontSize: '1.8rem',
            background: 'rgba(255,255,255,0.18)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>⏳</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FEF3C7' }}>Paiements en Attente</div>
            <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#FFFFFF', marginTop: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {pendingPayments.length}
            </div>
            <div style={{ fontSize: '11px', color: '#FDE68A', fontWeight: 700, marginTop: '2px' }}>À valider rapidement</div>
          </div>
        </div>

        {/* Signalements Acheteurs */}
        <div onClick={() => onNavigateTab('moderation')} style={{ ...cardStyle('linear-gradient(135deg, #7F1D1D 0%, #B91C1C 100%)', '#FFFFFF'), cursor: 'pointer' }}>
          <div style={{
            fontSize: '1.8rem',
            background: 'rgba(255,255,255,0.18)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>🚨</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FEE2E2' }}>Signalements Acheteurs</div>
            <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#FFFFFF', marginTop: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {pendingReports.length}
            </div>
            <div style={{ fontSize: '11px', color: '#FCA5A5', fontWeight: 700, marginTop: '2px' }}>Modération à traiter</div>
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

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Taux d'acceptation (Paiements) :</span>
              <strong style={{ color: '#059669', fontSize: '0.95rem' }}>
                {paiements.length > 0 ? Math.round((approvedPayments.length / paiements.length) * 100) : 100}%
              </strong>
            </div>

            <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Taux de Résolution (Signalements) :</span>
              <strong style={{ color: '#0284C7', fontSize: '0.95rem' }}>
                {reports.length > 0 ? Math.round((reports.filter(r => r.status === 'resolved').length / reports.length) * 100) : 100}%
              </strong>
            </div>

            <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Proportion Boutiques / Utilisateurs :</span>
              <strong style={{ color: '#9333EA', fontSize: '0.95rem' }}>
                {utilisateurs.length > 0 ? Math.round((boutiques.length / utilisateurs.length) * 100) : 0}% Boutiques
              </strong>
            </div>
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

      {/* Top Lists Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
        {/* Top Sellers */}
        <div style={panelStyle}>
          <h3 style={{ ...titleStyle, fontSize: '1.05rem', marginBottom: '16px' }}>🏆 Top Vendeurs (Annonces)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(() => {
              const sellerCounts = {};
              allProducts.forEach(p => {
                if (p.seller_id) {
                  if (!sellerCounts[p.seller_id]) {
                    sellerCounts[p.seller_id] = { count: 0, name: p.profiles?.boutique_name || p.profiles?.full_name || 'Utilisateur' };
                  }
                  sellerCounts[p.seller_id].count++;
                }
              });
              const topSellers = Object.values(sellerCounts).sort((a, b) => b.count - a.count).slice(0, 5);
              
              if (topSellers.length === 0) return <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Aucune donnée.</div>;

              const maxCount = topSellers[0].count;

              return topSellers.map((seller, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.2rem' }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                      <span style={{ color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seller.name}</span>
                      <span style={{ color: '#64748B' }}>{seller.count} annonces</span>
                    </div>
                    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(seller.count / maxCount) * 100}%`, height: '100%', background: '#3B82F6', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Top Ads */}
        <div style={panelStyle}>
          <h3 style={{ ...titleStyle, fontSize: '1.05rem', marginBottom: '16px' }}>💰 Annonces les plus chères</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(() => {
              const topAds = [...allProducts]
                .filter(p => p.price)
                .sort((a, b) => Number(b.price) - Number(a.price))
                .slice(0, 5);
              
              if (topAds.length === 0) return <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Aucune donnée.</div>;

              return topAds.map((ad, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '10px', borderRadius: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#E2E8F0', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    {ad.images?.[0] ? <img src={ad.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📸</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ad.title || 'Sans titre'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Vendeur: {ad.profiles?.boutique_name || ad.profiles?.full_name || 'Inconnu'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: '#059669', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    {Number(ad.price).toLocaleString()} F
                  </div>
                </div>
              ));
            })()}
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
