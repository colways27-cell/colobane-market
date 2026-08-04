import React, { useState } from 'react';

const BoutiqueApprovalTab = ({
  boutiques = [],
  onValiderBoutique,
  onZoomImage
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBoutiques = boutiques.filter(b => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      b.boutique_name?.toLowerCase().includes(query) ||
      b.full_name?.toLowerCase().includes(query) ||
      b.phone_number?.includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <input
        type="text"
        placeholder="Rechercher une boutique..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #CBD5E1' }}
      />

      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
            <tr>
              <th style={thStyle}>Boutique</th>
              <th style={thStyle}>Gérant</th>
              <th style={thStyle}>Contact</th>
              <th style={thStyle}>Badge Officiel</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBoutiques.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  Aucune boutique enregistrée.
                </td>
              </tr>
            ) : (
              filteredBoutiques.map((b) => {
                const rawPhone = b.whatsapp_number || b.phone_number || '';
                const cleanPhone = rawPhone.replace(/\D/g, '');
                const waPhone = cleanPhone.length === 9 ? `221${cleanPhone}` : cleanPhone;
                const waMsg = encodeURIComponent(
                  `Bonjour ${b.full_name || 'Gérant'} de la boutique "${b.boutique_name || 'Boutique'}" ! Équipe Colobane Market au sujet de votre compte.`
                );
                const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : null;

                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {b.avatar_url && (
                          <img
                            src={b.avatar_url}
                            alt=""
                            onClick={() => onZoomImage(b.avatar_url)}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                          />
                        )}
                        <div>
                          <strong>🏪 {b.boutique_name || 'Boutique Sans Nom'}</strong>
                          {b.location && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>📍 {b.location}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>{b.full_name || 'Inconnu'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{rawPhone || 'N/A'}</span>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#25D366',
                              color: 'white',
                              borderRadius: '6px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: 800,
                              textDecoration: 'none'
                            }}
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: '700', color: b.is_verified ? '#15803D' : '#94A3B8' }}>
                        {b.is_verified ? '👑 Certifiée' : 'Non Certifiée'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {!b.is_verified ? (
                          <button
                            onClick={() => onValiderBoutique(b.id)}
                            style={{ padding: '6px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            👑 Accorder la Certification
                          </button>
                        ) : (
                          <span style={{ color: '#15803D', fontSize: '0.8rem', fontWeight: '700' }}>Actif</span>
                        )}
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '6px 10px',
                              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                              color: 'white',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '11px',
                              textDecoration: 'none'
                            }}
                          >
                            💬 Contact
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle = { padding: '14px 16px', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' };
const tdStyle = { padding: '14px 16px', verticalAlign: 'middle' };

export default BoutiqueApprovalTab;
