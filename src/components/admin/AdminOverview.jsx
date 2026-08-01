import React from 'react';

const AdminOverview = ({
  paiements = [],
  utilisateurs = [],
  boutiques = [],
  reports = [],
  demandesCertification = [],
  onNavigateTab
}) => {
  const pendingPayments = paiements.filter(p => p.status === 'pending');
  const pendingCerts = demandesCertification.filter(c => c.status === 'pending');
  const pendingReports = reports.filter(r => !r.resolved);

  const totalRevenue = paiements
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div style={cardStyle('#EFF6FF', '#1D4ED8')}>
          <div style={iconStyle}>💰</div>
          <div>
            <div style={labelStyle}>Revenu Total Validé</div>
            <div style={valueStyle}>{totalRevenue.toLocaleString()} FCFA</div>
          </div>
        </div>

        <div onClick={() => onNavigateTab('paiements')} style={{ ...cardStyle('#FEF3C7', '#D97706'), cursor: 'pointer' }}>
          <div style={iconStyle}>⏳</div>
          <div>
            <div style={labelStyle}>Paiements en Attente</div>
            <div style={valueStyle}>{pendingPayments.length}</div>
          </div>
        </div>

        <div onClick={() => onNavigateTab('certifications')} style={{ ...cardStyle('#F0FDF4', '#15803D'), cursor: 'pointer' }}>
          <div style={iconStyle}>👑</div>
          <div>
            <div style={labelStyle}>Certifications en Attente</div>
            <div style={valueStyle}>{pendingCerts.length}</div>
          </div>
        </div>

        <div onClick={() => onNavigateTab('reports')} style={{ ...cardStyle('#FEF2F2', '#B91C1C'), cursor: 'pointer' }}>
          <div style={iconStyle}>🚨</div>
          <div>
            <div style={labelStyle}>Signalements Non Traités</div>
            <div style={valueStyle}>{pendingReports.length}</div>
          </div>
        </div>
      </div>

      {/* Summary grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={panelStyle}>
          <h3 style={titleStyle}>👥 Utilisateurs & Boutiques</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #E2E8F0' }}>
            <span>Total Inscrits :</span>
            <strong>{utilisateurs.length}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
            <span>Total Boutiques Pros :</span>
            <strong>{boutiques.length}</strong>
          </div>
        </div>

        <div style={panelStyle}>
          <h3 style={titleStyle}>⚡ Actions Rapides</h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '16px' }}>
            Accédez directement aux onglets prioritaires pour traiter les demandes des vendeurs.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigateTab('paiements')} style={btnStyle('#2563EB')}>
              Voir les Paiements ({pendingPayments.length})
            </button>
            <button onClick={() => onNavigateTab('certifications')} style={btnStyle('#059669')}>
              Voir les Certifications ({pendingCerts.length})
            </button>
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
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
});

const iconStyle = {
  fontSize: '2rem',
  background: 'rgba(255,255,255,0.6)',
  width: '50px',
  height: '50px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const labelStyle = { fontSize: '0.85rem', fontWeight: '600', opacity: 0.9 };
const valueStyle = { fontSize: '1.4rem', fontWeight: '800', marginTop: '2px' };
const panelStyle = { background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' };
const titleStyle = { fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: '#1E293B' };
const btnStyle = (bg) => ({
  background: bg,
  color: 'white',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '10px',
  fontWeight: '700',
  fontSize: '0.85rem',
  cursor: 'pointer'
});

export default AdminOverview;
