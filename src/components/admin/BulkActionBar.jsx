import React from 'react';

const BulkActionBar = ({ selectedCount, onClear, onValidate, onReject, isLoading }) => {
  if (selectedCount === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1E293B',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      zIndex: 4000,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}
      </style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#334155', padding: '6px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem' }}>
          {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
        </div>
        <button 
          onClick={onClear} 
          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: '4px' }}
        >
          Annuler
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', background: '#334155' }} />

      <div style={{ display: 'flex', gap: '12px' }}>
        {onReject && (
          <button
            onClick={onReject}
            disabled={isLoading}
            style={{
              background: '#EF4444',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            Refuser {selectedCount}
          </button>
        )}
        
        {onValidate && (
          <button
            onClick={onValidate}
            disabled={isLoading}
            style={{
              background: '#10B981',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
            }}
          >
            {isLoading ? 'Traitement...' : `Valider ${selectedCount}`}
          </button>
        )}
      </div>
    </div>
  );
};

export default BulkActionBar;
