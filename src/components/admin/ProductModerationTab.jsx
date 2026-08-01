import React, { useState } from 'react';

const ProductModerationTab = ({
  allProducts = [],
  reports = [],
  boosts = [],
  onDesactiverBoost,
  onSupprimerProduit,
  onZoomImage
}) => {
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const reportedProductsList = reports.map(r => ({
    ...r.products,
    reportReason: r.reason,
    reportDetails: r.details,
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
      p.profiles?.full_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveSubTab('all')}
          style={subTabStyle(activeSubTab === 'all')}
        >
          Toutes les Annonces ({allProducts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('reports')}
          style={subTabStyle(activeSubTab === 'reports')}
        >
          Annonces Signalées ({reports.length})
        </button>
        <button
          onClick={() => setActiveSubTab('boosts')}
          style={subTabStyle(activeSubTab === 'boosts')}
        >
          Annonces Boostées ({boosts.length})
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Filtrer par titre d'annonce, catégorie ou vendeur..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #CBD5E1' }}
      />

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', color: '#94A3B8' }}>
            Aucune annonce dans cette catégorie.
          </div>
        ) : (
          filteredProducts.map((prod) => (
            <div key={prod.id || prod.reportId} style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {prod.images && prod.images[0] && (
                  <img
                    src={prod.images[0]}
                    alt=""
                    onClick={() => onZoomImage(prod.images[0])}
                    style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer' }}
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
                    Vendeur : {prod.profiles?.full_name || prod.seller?.full_name || 'Inconnu'}
                  </div>
                </div>
              </div>

              {prod.reportReason && (
                <div style={{ background: '#FEF2F2', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #DC2626', fontSize: '0.8rem', color: '#991B1B' }}>
                  <strong>Motif :</strong> {prod.reportReason}
                </div>
              )}

              {prod.is_boosted && (
                <div style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: '700' }}>
                  🚀 Boosté jusqu'au : {prod.boost_end_date ? new Date(prod.boost_end_date).toLocaleDateString('fr-FR') : 'Permanence'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                {prod.is_boosted && (
                  <button
                    onClick={() => onDesactiverBoost(prod.id)}
                    style={{ padding: '6px 10px', background: '#FEF3C7', color: '#D97706', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Désactiver Boost
                  </button>
                )}
                <button
                  onClick={() => onSupprimerProduit(prod.id, prod.title)}
                  style={{ flex: 1, padding: '6px 10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Supprimer 🗑️
                </button>
              </div>
            </div>
          ))
        )}
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

export default ProductModerationTab;
