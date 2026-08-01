import React, { useState } from 'react';

const UserManagementTab = ({
  utilisateurs = [],
  onUpdateUserPlan,
  updatingUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editPlan, setEditPlan] = useState('none');
  const [editAccountType, setEditAccountType] = useState('particulier');
  const [editIsVerified, setEditIsVerified] = useState(false);

  const filteredUsers = utilisateurs.filter(u => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      u.full_name?.toLowerCase().includes(query) ||
      u.phone_number?.includes(query) ||
      u.whatsapp_number?.includes(query) ||
      u.boutique_name?.toLowerCase().includes(query)
    );
  });

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditPlan(user.subscription_plan || 'none');
    setEditAccountType(user.account_type || 'particulier');
    setEditIsVerified(!!user.is_verified);
  };

  const handleSave = () => {
    if (!editingUser) return;
    onUpdateUserPlan({
      userId: editingUser.id,
      plan: editPlan,
      accountType: editAccountType,
      isVerified: editIsVerified
    });
    setEditingUser(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="Rechercher un utilisateur (Nom, Téléphone, Boutique...)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #CBD5E1' }}
        />
      </div>

      {/* Users Table */}
      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
            <tr>
              <th style={thStyle}>Utilisateur</th>
              <th style={thStyle}>Contact</th>
              <th style={thStyle}>Type Compte</th>
              <th style={thStyle}>Forfait Actif</th>
              <th style={thStyle}>Certifié</th>
              <th style={thStyle}>Date d'inscription</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={tdStyle}>
                    <strong>{u.full_name || 'Anonyme'}</strong>
                    {u.boutique_name && (
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>🏪 {u.boutique_name}</div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <div>{u.phone_number || u.whatsapp_number || 'N/A'}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={accountBadgeStyle(u.account_type)}>
                      {u.account_type === 'boutique' ? '🏪 PRO' : '👤 Particulier'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <strong>{u.subscription_plan || 'Gratuit'}</strong>
                  </td>
                  <td style={tdStyle}>
                    {u.is_verified ? '👑 Oui' : 'Non'}
                  </td>
                  <td style={tdStyle}>
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => openEditModal(u)}
                      style={{ padding: '6px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      ✏️ Éditer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Edition */}
      {editingUser && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>
              Modifier {editingUser.full_name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Forfait Abonnement :</label>
                <select
                  value={editPlan}
                  onChange={e => setEditPlan(e.target.value)}
                  style={selectStyle}
                >
                  <option value="none">Aucun (Gratuit)</option>
                  <option value="pass_semaine">Pass Semaine (7j)</option>
                  <option value="pass_15jours">Pass 15 Jours (15j)</option>
                  <option value="basique">Forfait Basique (30j)</option>
                  <option value="premium">Forfait Premium (30j)</option>
                  <option value="boutique">Forfait Boutique (30j)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Type de Compte :</label>
                <select
                  value={editAccountType}
                  onChange={e => setEditAccountType(e.target.value)}
                  style={selectStyle}
                >
                  <option value="particulier">Particulier</option>
                  <option value="boutique">Boutique Pro</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="certCheck"
                  checked={editIsVerified}
                  onChange={e => setEditIsVerified(e.target.checked)}
                />
                <label htmlFor="certCheck" style={{ cursor: 'pointer', fontWeight: '600' }}>
                  Compte Certifié (Badge Vendeur de Confiance)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={handleSave}
                  disabled={updatingUser}
                  style={{ flex: 1, padding: '10px', background: 'var(--primary, #8a1c1c)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {updatingUser ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  style={{ padding: '10px 16px', background: '#E2E8F0', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = { padding: '14px 16px', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' };
const tdStyle = { padding: '14px 16px', verticalAlign: 'middle' };
const labelStyle = { fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' };
const selectStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' };

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  background: 'white',
  padding: '24px',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '440px'
};

const accountBadgeStyle = (type) => ({
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: '700',
  background: type === 'boutique' ? '#FEF3C7' : '#F1F5F9',
  color: type === 'boutique' ? '#D97706' : '#475569'
});

export default UserManagementTab;
