const SkeletonCard = () => {
  return (
    <div className="product-card skeleton" style={{ pointerEvents: 'none' }}>
      <div className="product-image-container skeleton-pulse" style={{ background: '#e2e8f0', width: '100%', height: '100%' }}></div>
      <div className="product-content">
        <div className="skeleton-pulse" style={{ height: '20px', width: '40%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
        <div className="skeleton-pulse" style={{ height: '16px', width: '80%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
        <div className="skeleton-pulse" style={{ height: '12px', width: '50%', background: '#e2e8f0', borderRadius: '4px' }}></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
