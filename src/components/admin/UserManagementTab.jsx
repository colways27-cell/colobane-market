import React, { useState } from 'react';

const calculateTrustScore = (u) => {
  let score = 50;
  if (u.is_verified) score += 30;
  if (u.account_type === 'boutique') score += 10;
  if (u.subscription_plan && u.subscription_plan !== 'none' && u.subscription_plan !== 'gratuit') score += 10;
  return Math.min(100, Math.max(0, score));
};

const UserManagementTab = ({
  utilisateurs = [],
  onUpdateUserPlan,
  onDeleteUser,
  updatingUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccountType, setFilterAccountType] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editPlan, setEditPlan] = useState('none');
  const [editAccountType, setEditAccountType] = useState('particulier');
  const [editIsVerified, setEditIsVerified] = useState(false);
  const [editIsSponsored, setEditIsSponsored] = useState(false);

  const filteredUsers = utilisateurs.filter(u => {
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = !query ||
      u.full_name?.toLowerCase().includes(query) ||
      u.phone_number?.includes(query) ||
      u.whatsapp_number?.includes(query) ||
      u.boutique_name?.toLowerCase().includes(query);

    const matchType = filterAccountType === 'all' ||
      (filterAccountType === 'boutique' && u.account_type === 'boutique') ||
      (filterAccountType === 'verified' && u.is_verified) ||
      (filterAccountType === 'admin' && u.is_admin) ||
      (filterAccountType === 'particulier' && u.account_type !== 'boutique');

    return matchSearch && matchType;
  });

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditPlan(user.subscription_plan || 'none');
    setEditAccountType(user.account_type || 'particulier');
    setEditIsVerified(!!user.is_verified);
    setEditIsSponsored(!!user.is_sponsored);
  };

  const handleSave = () => {
    if (!editingUser) return;
    onUpdateUserPlan({
      userId: editingUser.id,
      plan: editPlan,
      accountType: editAccountType,
      isVerified: editIsVerified,
      isSponsored: editIsSponsored
    });
    setEditingUser(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher un utilisateur (Nom, Téléphone, Boutique...)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '240px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #CBD5E1' }}
        />

        <select
          value={filterAccountType}
          onChange={e => setFilterAccountType(e.target.value)}
          style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #CBD5E1', background: 'white' }}
        >
          <option value="all">Tous les utilisateurs ({utilisateurs.length})</option>
          <option value="admin">Administrateurs</option>
          <option value="boutique">Boutiques PRO uniquement</option>
          <option value="verified">Vendeurs Certifiés 👑</option>
          <option value="particulier">Particuliers</option>
        </select>
      </div>

      {/* Users List Container */}
      {filteredUsers.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94A3B8', border: '1px solid #E2E8F0' }}>
          Aucun utilisateur trouvé.
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW */}
          <div className="mobile-only-payments" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredUsers.map((u) => {
              const trustScore = calculateTrustScore(u);
              const rawPhone = u.whatsapp_number || u.phone_number || '';
              const cleanPhone = rawPhone.replace(/\D/g, '');
              const waPhone = cleanPhone.length === 9 ? `221${cleanPhone}` : cleanPhone;
              const waMsg = encodeURIComponent(`Bonjour ${u.full_name || 'Utilisateur'} ! Équipe Colobane Market.`);
              const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : null;

              return (
                <div
                  key={u.id}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                        {u.full_name || 'Anonyme'} {u.is_verified && '👑'}
                      </div>
                      {u.boutique_name && (
                        <div style={{ fontSize: '13px', color: '#0284C7', fontWeight: 700, marginTop: '2px' }}>
                          🏪 {u.boutique_name}
                        </div>
                      )}
                      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                        📞 {rawPhone || 'Pas de numéro'}
                      </div>
                    </div>
                    <span style={accountBadgeStyle(u.account_type, u.is_admin)}>
                      {u.is_admin ? '🛡️ ADMIN' : u.account_type === 'boutique' ? '🏪 PRO' : '👤 Particulier'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Plan Actif</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{u.subscription_plan || 'Gratuit'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Trust Score</div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: trustScore >= 80 ? '#16A34A' : trustScore >= 50 ? '#D97706' : '#DC2626' }}>
                        {trustScore}%
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => openEditModal(u)}
                      style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✏️ Plan
                    </button>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          padding: '10px',
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
                        💬 Contact
                      </a>
                    )}
                    {onDeleteUser && (
                      <button
                        onClick={() => onDeleteUser(u.id, u.full_name)}
                        style={{ padding: '10px 12px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}
                      >
                        🗑️ Supprimer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="desktop-only-payments" style={{ background: 'white', borderRadius: '16px', overflowX: 'auto', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <tr>
                  <th style={thStyle}>Utilisateur</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Type Compte</th>
                  <th style={thStyle}>Trust Index</th>
                  <th style={thStyle}>Forfait Actif</th>
                  <th style={thStyle}>Inscription</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const trustScore = calculateTrustScore(u);
                  const rawPhone = u.whatsapp_number || u.phone_number || '';
                  const cleanPhone = rawPhone.replace(/\D/g, '');
                  const waPhone = cleanPhone.length === 9 ? `221${cleanPhone}` : cleanPhone;
                  const waMsg = encodeURIComponent(`Bonjour ${u.full_name || 'Utilisateur'} ! Équipe Colobane Market.`);
                  const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : null;

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={tdStyle}>
                        <strong>{u.full_name || 'Anonyme'}</strong>
                        {u.boutique_name && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>🏪 {u.boutique_name}</div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <small style={{ color: '#64748B' }}>{rawPhone || 'N/A'}</small>
                      </td>
                      <td style={tdStyle}>
                        <span style={accountBadgeStyle(u.account_type, u.is_admin)}>
                          {u.is_admin ? '🛡️ ADMIN' : u.account_type === 'boutique' ? '🏪 PRO' : '👤 Particulier'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            color: trustScore >= 80 ? '#15803D' : trustScore >= 50 ? '#D97706' : '#B91C1C'
                          }}>
                            {trustScore}%
                          </span>
                          <div style={{ width: '50px', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${trustScore}%`,
                              height: '100%',
                              background: trustScore >= 80 ? '#16A34A' : trustScore >= 50 ? '#F59E0B' : '#DC2626'
                            }} />
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <strong>{u.subscription_plan || 'Gratuit'}</strong>
                      </td>
                      <td style={tdStyle}>
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => openEditModal(u)}
                            style={{ padding: '6px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✏️ Modifier Plan
                          </button>
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
                          {onDeleteUser && (
                            <button
                              onClick={() => onDeleteUser(u.id, u.full_name)}
                              style={{ padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '11px' }}
                            >
                              🗑️ Supprimer
                            </button>
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

      {/* Modal Edition */}
      {editingUser && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              Éditer le profil : {editingUser.full_name || 'Utilisateur'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0' }}>
              <div>
                <label style={labelFormStyle}>Type de Compte</label>
                <select
                  value={editAccountType}
                  onChange={e => setEditAccountType(e.target.value)}
                  style={inputFormStyle}
                >
                  <option value="particulier">Particulier</option>
                  <option value="boutique">Boutique PRO</option>
                </select>
              </div>

              <div>
                <label style={labelFormStyle}>Plan d'Abonnement</label>
                <select
                  value={editPlan}
                  onChange={e => setEditPlan(e.target.value)}
                  style={inputFormStyle}
                >
                  <option value="none">Gratuit / Aucun</option>
                  <option value="pass_semaine">Pass Semaine (7j)</option>
                  <option value="pass_15jours">Pass 15 Jours</option>
                  <option value="basique">Forfait Basique (30j)</option>
                  <option value="premium">Forfait Premium (30j)</option>
                  <option value="boutique">Forfait Boutique (30j)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={editIsVerified}
                  onChange={e => setEditIsVerified(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isVerified" style={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                  👑 Badge Vendeur Certifié Officiel
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="isSponsored"
                  checked={editIsSponsored}
                  onChange={e => setEditIsSponsored(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isSponsored" style={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', color: '#B45309' }}>
                  ⭐ Boutique Sponsorisée (Mise en avant)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setEditingUser(null)}
                style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={updatingUser}
                style={{ padding: '8px 16px', background: 'var(--primary, #8a1c1c)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                {updatingUser ? 'Mise à jour...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = { padding: '14px 16px', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' };
const tdStyle = { padding: '14px 16px', verticalAlign: 'middle' };

const accountBadgeStyle = (type, isAdmin) => ({
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '0.75rem',
  fontWeight: '700',
  background: isAdmin ? '#FEF2F2' : type === 'boutique' ? '#EFF6FF' : '#F1F5F9',
  color: isAdmin ? '#DC2626' : type === 'boutique' ? '#1D4ED8' : '#475569'
});

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '20px'
};

const modalContentStyle = {
  background: 'white',
  borderRadius: '16px',
  padding: '24px',
  maxWidth: '460px',
  width: '100%',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
};

const labelFormStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '6px' };
const inputFormStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' };

export default UserManagementTab;
