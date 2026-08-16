import BulkActionBar from './BulkActionBar';

const ProductModerationTab = ({
  allProducts = [],
  reports = [],
  boosts = [],
  onDesactiverBoost,
  onSupprimerProduit,
  onSupprimerPlusieursProduits,
  onResolveReport,
  onResoudrePlusieursReports,
  onEditProduct,
  onZoomImage
}) => {
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editModalProd, setEditModalProd] = useState(null);
  
  const [editForm, setEditForm] = useState({ title: '', price: '', category: '' });

  const reportedProductsList = reports.map(r => ({
    ...r.products,
    reportReason: r.reason,
    reportDetails: r.details,
    reportStatus: r.status || 'pending',
    reporter: r.reporter,
    seller: r.seller,
    reportId: r.id
  }));

  const currentList = activeSubTab === 'reports' ? reportedProductsList : activeSubTab === 'boosts' ? boosts : allProducts;

  const filteredProducts = currentList.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.title?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.profiles?.full_name?.toLowerCase().includes(query) ||
      p.seller?.full_name?.toLowerCase().includes(query)
    );
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => activeSubTab === 'reports' ? p.reportId : p.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!onSupprimerPlusieursProduits) return;
    if (!window.confirm(`⚠️ Supprimer définitivement ces ${selectedIds.length} annonces ?`)) return;
    setIsProcessing(true);
    await onSupprimerPlusieursProduits(selectedIds);
    setIsProcessing(false);
    setSelectedIds([]);
  };

  const handleBulkResolveReports = async () => {
    if (!onResoudrePlusieursReports) return;
    setIsProcessing(true);
    await onResoudrePlusieursReports(selectedIds, 'resolved');
    setIsProcessing(false);
    setSelectedIds([]);
  };

  const openEditModal = (prod) => {
    setEditForm({ title: prod.title || '', price: prod.price || '', category: prod.category || '' });
    setEditModalProd(prod);
  };

  const submitEdit = async () => {
    if (!onEditProduct || !editModalProd) return;
    setIsProcessing(true);
    await onEditProduct(editModalProd.id, editForm);
    setIsProcessing(false);
    setEditModalProd(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
        <button
          onClick={() => { setActiveSubTab('all'); setSelectedIds([]); }}
          style={subTabStyle(activeSubTab === 'all')}
        >
          Toutes les Annonces ({allProducts.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('reports'); setSelectedIds([]); }}
          style={subTabStyle(activeSubTab === 'reports')}
        >
          🚨 Annonces Signalées ({reports.filter(r => r.status === 'pending' || !r.status).length} En Attente)
        </button>
        <button
          onClick={() => { setActiveSubTab('boosts'); setSelectedIds([]); }}
          style={subTabStyle(activeSubTab === 'boosts')}
        >
          ⚡ Annonces Boostées ({boosts.length})
        </button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Filtrer par titre d'annonce, catégorie ou vendeur..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #CBD5E1' }}
        />
        {filteredProducts.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap', padding: '0 10px' }}>
            <input
              type="checkbox"
              checked={selectedIds.length === filteredProducts.length}
              onChange={toggleSelectAll}
              style={{ width: '18px', height: '18px' }}
            />
            Tout sélectionner
          </label>
        )}
      </div>

      {/* Products & Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', color: '#94A3B8' }}>
            Aucune annonce trouvée.
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const sellerPhone = prod.seller?.whatsapp_number || prod.seller?.phone_number || prod.profiles?.phone_number || '';
            const cleanPhone = sellerPhone.replace(/\D/g, '');
            const waPhone = cleanPhone.length === 9 ? `221${cleanPhone}` : cleanPhone;
            const waMsg = encodeURIComponent(
              `Bonjour ! Équipe Modération Colobane Market au sujet de votre annonce "${prod.title || 'Annonce'}" suite à des remarques d'utilisateurs.`
            );
            const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : null;
            const itemId = activeSubTab === 'reports' ? prod.reportId : prod.id;
            const isSelected = selectedIds.includes(itemId);

            return (
              <div 
                key={itemId} 
                onClick={() => toggleSelect(itemId)}
                style={{ 
                  background: isSelected ? '#F0F9FF' : 'white', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  border: `1px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // handled by parent div click
                    style={{ width: '20px', height: '20px', pointerEvents: 'none' }}
                  />
                  {prod.images && prod.images[0] && (
                    <img
                      src={prod.images[0]}
                      alt=""
                      onClick={(e) => { e.stopPropagation(); onZoomImage(prod.images[0]); }}
                      style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prod.title}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                      {prod.price ? `${prod.price} FCFA` : ''} • {prod.category}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Vendeur : {prod.seller?.full_name || prod.profiles?.full_name || 'Inconnu'}
                    </div>
                  </div>
                </div>

                {/* Report Info Banner */}
                {prod.reportReason && (
                  <div style={{ background: '#FEF2F2', padding: '10px 12px', borderRadius: '10px', borderLeft: '4px solid #DC2626', fontSize: '0.8rem', color: '#991B1B' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong>🚨 Motif :</strong>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: prod.reportStatus === 'resolved' ? '#DCFCE7' : prod.reportStatus === 'dismissed' ? '#E2E8F0' : '#FEE2E2',
                        color: prod.reportStatus === 'resolved' ? '#15803D' : prod.reportStatus === 'dismissed' ? '#475569' : '#991B1B'
                      }}>
                        {prod.reportStatus === 'resolved' ? '✅ Traité' : prod.reportStatus === 'dismissed' ? '🙈 Sans suite' : '⏳ En attente'}
                      </span>
                    </div>
                    <div>{prod.reportReason}</div>
                    {prod.reporter?.full_name && (
                      <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '4px' }}>
                        Signalé par : {prod.reporter.full_name}
                      </div>
                    )}
                  </div>
                )}

                {prod.is_boosted && (
                  <div style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: '700' }}>
                    🚀 Boosté jusqu'au : {prod.boost_end_date ? new Date(prod.boost_end_date).toLocaleDateString('fr-FR') : 'Permanence'}
                  </div>
                )}

                {/* Actions Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                  {prod.reportId && onResolveReport && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onResolveReport(prod.reportId, 'resolved'); }}
                        style={{ flex: 1, padding: '6px', background: '#DCFCE7', color: '#15803D', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                      >
                        ✓ Classer Résolu
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onResolveReport(prod.reportId, 'dismissed'); }}
                        style={{ padding: '6px 10px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        🙈 Ignorer
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(prod); }}
                      style={{ flex: 1, padding: '6px 10px', background: '#DBEAFE', color: '#1E3A8A', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                    >
                      ✏️ Éditer
                    </button>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          textDecoration: 'none',
                          textAlign: 'center'
                        }}
                      >
                        💬 Avertir
                      </a>
                    )}

                    {prod.is_boosted && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDesactiverBoost(prod.id); }}
                        style={{ flex: 1, padding: '6px 8px', background: '#FEF3C7', color: '#D97706', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Désactiver Boost
                      </button>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); onSupprimerProduit(prod.id, prod.title); }}
                      style={{ padding: '6px 10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Supprimer 🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Edit Modal */}
      {editModalProd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>Édition Rapide</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Titre</label>
                <input 
                  type="text" 
                  value={editForm.title} 
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Prix (FCFA)</label>
                <input 
                  type="number" 
                  value={editForm.price} 
                  onChange={e => setEditForm({...editForm, price: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Catégorie</label>
                <select 
                  value={editForm.category} 
                  onChange={e => setEditForm({...editForm, category: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white' }}
                >
                  <option value="Électronique">Électronique</option>
                  <option value="Mode">Mode</option>
                  <option value="Véhicules">Véhicules</option>
                  <option value="Immobilier">Immobilier</option>
                  <option value="Maison & Décoration">Maison & Décoration</option>
                  <option value="Services">Services</option>
                  <option value="Loisirs">Loisirs</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                onClick={() => setEditModalProd(null)} 
                style={{ flex: 1, padding: '12px', background: '#F1F5F9', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button 
                onClick={submitEdit} 
                disabled={isProcessing}
                style={{ flex: 1, padding: '12px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                {isProcessing ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {activeSubTab === 'reports' ? (
        <BulkActionBar 
          selectedCount={selectedIds.length} 
          onClear={() => setSelectedIds([])}
          onValidate={handleBulkResolveReports}
          isLoading={isProcessing}
        />
      ) : (
        <BulkActionBar 
          selectedCount={selectedIds.length} 
          onClear={() => setSelectedIds([])}
          onReject={handleBulkDelete}
          isLoading={isProcessing}
        />
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

export default ProductModerationTab;
