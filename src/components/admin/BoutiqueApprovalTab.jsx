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

      {/* Boutiques List Container */}
      {filteredBoutiques.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94A3B8', border: '1px solid #E2E8F0' }}>
          Aucune boutique enregistrée.
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW */}
          <div className="mobile-only-payments" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredBoutiques.map((b) => {
              const rawPhone = b.whatsapp_number || b.phone_number || '';
              const cleanPhone = rawPhone.replace(/\D/g, '');
              const waPhone = cleanPhone.length === 9 ? `221${cleanPhone}` : cleanPhone;
              const waMsg = encodeURIComponent(
                `Bonjour ${b.full_name || 'Gérant'} de la boutique "${b.boutique_name || 'Boutique'}" ! Équipe Colobane Market au sujet de votre compte.`
              );
              const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : null;

              return (
                <div
                  key={b.id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {b.avatar_url && (
                        <img
                          src={b.avatar_url}
                          alt=""
                          onClick={() => onZoomImage(b.avatar_url)}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                        />
                      )}
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                          🏪 {b.boutique_name || 'Boutique Sans Nom'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          👤 Gérant : {b.full_name || 'Inconnu'}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '12px', color: b.is_verified ? '#15803D' : '#94A3B8' }}>
                      {b.is_verified ? '👑 Certifiée' : 'Non Certifiée'}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#64748B', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📍 Location : {b.location || 'Sénégal'}</span>
                    <span>📞 {rawPhone || 'N/A'}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!b.is_verified ? (
                      <button
                        onClick={() => onValiderBoutique(b.id)}
                        style={{ flex: 1, padding: '10px', background: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}
                      >
                        👑 Certifier la Boutique
                      </button>
                    ) : (
                      <div style={{ flex: 1, padding: '8px', textAlign: 'center', color: '#15803D', fontWeight: 800, fontSize: '13px', background: '#DCFCE7', borderRadius: '10px' }}>
                        ✅ Boutique Certifiée Officielle
                      </div>
                    )}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '10px 14px',
                          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                          color: 'white',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '12px',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="desktop-only-payments" style={{ background: 'white', borderRadius: '16px', overflowX: 'auto', border: '1px solid #E2E8F0' }}>
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
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
                {filteredBoutiques.map((b) => {
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
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

const thStyle = { padding: '14px 16px', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' };
const tdStyle = { padding: '14px 16px', verticalAlign: 'middle' };

export default BoutiqueApprovalTab;
