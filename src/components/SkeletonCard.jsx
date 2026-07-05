const SkeletonCard = () => {
  return (
    <div className="product-card skeleton" style={{ pointerEvents: 'none', background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="product-image-container skeleton-pulse" style={{ background: '#f1f5f9', width: '100%', height: '100%' }}></div>
      <div className="product-content" style={{ padding: '12px' }}>
        <div className="skeleton-pulse" style={{ height: '24px', width: '60%', background: '#e2e8f0', borderRadius: '6px', marginBottom: '8px' }}></div>
        <div className="skeleton-pulse" style={{ height: '16px', width: '90%', background: '#f1f5f9', borderRadius: '4px', marginBottom: '6px' }}></div>
        <div className="skeleton-pulse" style={{ height: '16px', width: '70%', background: '#f1f5f9', borderRadius: '4px', marginBottom: '12px' }}></div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="skeleton-pulse" style={{ height: '16px', width: '16px', background: '#e2e8f0', borderRadius: '50%' }}></div>
          <div className="skeleton-pulse" style={{ height: '12px', width: '40%', background: '#f1f5f9', borderRadius: '4px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
