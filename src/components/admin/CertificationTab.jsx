import React, { useState } from 'react';

const CertificationTab = ({
  demandesCertification = [],
  onValiderCertification,
  onRefuserCertification,
  onZoomImage
}) => {
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCerts = demandesCertification.filter(c => {
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = !query ||
      c.id_card_number?.toLowerCase().includes(query) ||
      c.profiles?.full_name?.toLowerCase().includes(query) ||
      c.profiles?.whatsapp_number?.includes(query);

    return matchStatus && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher par CNI, nom ou téléphone..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1' }}
        />

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: 'white' }}
        >
          <option value="pending">En attente uniquement</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Refusées</option>
          <option value="all">Toutes les demandes</option>
        </select>
      </div>

      {/* Grid of Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredCerts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', color: '#94A3B8' }}>
            Aucune demande de certification dans cette catégorie.
          </div>
        ) : (
          filteredCerts.map((cert) => {
            const rawPhone = cert.phone || cert.profiles?.whatsapp_number || cert.profiles?.phone_number || '';
            const cleanPhone = rawPhone.replace(/\D/g, '');
            const waPhone = cleanPhone.length === 9 ? `221${cleanPhone}` : cleanPhone;
            const waMsg = encodeURIComponent(
              `Bonjour ${cert.owner_name || cert.profiles?.full_name || 'Vendeur'} ! Équipe Colobane Market au sujet de votre demande de certification pour la boutique "${cert.boutique_name || 'Boutique'}". Statut : ${cert.status === 'approved' ? 'VALIDÉE ✅' : cert.status === 'rejected' ? 'REFUSÉE ❌' : 'EN COURS ⏳'}.`
            );
            const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : null;

            return (
              <div key={cert.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{cert.owner_name || cert.profiles?.full_name || 'Demandeur'}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span>📞 {rawPhone || 'N/A'}</span>
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
                  </div>
                  <span style={statusBadgeStyle(cert.status)}>
                    {cert.status === 'approved' ? '✅ Approuvé' : cert.status === 'rejected' ? '❌ Refusé' : '⏳ En attente'}
                  </span>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong>Boutique :</strong> {cert.boutique_name || 'Non renseigné'}<br />
                  <strong>Adresse :</strong> {cert.address || 'Non renseignée'}
                </div>

                {/* Photos Documents */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {cert.photo_boutique_url && (
                    <img
                      src={cert.photo_boutique_url}
                      alt="Boutique"
                      onClick={() => onZoomImage(cert.photo_boutique_url)}
                      style={imgThumbnailStyle}
                      title="Photo Boutique (Cliquer pour agrandir)"
                    />
                  )}
                  {cert.photo_identity_url && (
                    <img
                      src={cert.photo_identity_url}
                      alt="CNI"
                      onClick={() => onZoomImage(cert.photo_identity_url)}
                      style={imgThumbnailStyle}
                      title="CNI (Cliquer pour agrandir)"
                    />
                  )}
                  {cert.photo_selfie_url && (
                    <img
                      src={cert.photo_selfie_url}
                      alt="Selfie"
                      onClick={() => onZoomImage(cert.photo_selfie_url)}
                      style={imgThumbnailStyle}
                      title="Selfie (Cliquer pour agrandir)"
                    />
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                  {cert.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onValiderCertification(cert)}
                        style={{ flex: 1, padding: '8px 12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => onRefuserCertification(cert.id)}
                        style={{ flex: 1, padding: '8px 12px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Refuser
                      </button>
                    </>
                  )}
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      💬 Contacter WhatsApp
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const imgThumbnailStyle = {
  width: '70px',
  height: '50px',
  objectFit: 'cover',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  cursor: 'pointer'
};

const statusBadgeStyle = (status) => ({
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: '700',
  background: status === 'approved' ? '#DCFCE7' : status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
  color: status === 'approved' ? '#15803D' : status === 'rejected' ? '#B91C1C' : '#D97706'
});

export default CertificationTab;
