import React from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const ReportsTab = ({ reports, setReports, fetchAllData }) => {
  
  const handleResolve = async (reportId) => {
    if (!window.confirm("Marquer ce signalement comme résolu ?")) return;
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', reportId);
        
      if (error) throw error;
      toast.success("Signalement résolu.");
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la résolution.");
    }
  };

  const handleHideProduct = async (productId, reportId) => {
    if (!window.confirm("Masquer ce produit du site (et résoudre le signalement) ?")) return;
    try {
      await supabase.from('products').update({ is_hidden: true, status: 'hidden' }).eq('id', productId);
      await supabase.from('reports').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', reportId);
      toast.success("Produit masqué et signalement résolu.");
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error("Erreur.");
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending' || !r.status);
  const resolvedReports = reports.filter(r => r.status === 'resolved');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: '#FFF5F5', padding: '20px', borderRadius: '16px', border: '1px solid #FECACA' }}>
        <h3 style={{ color: '#991B1B', margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>🚨 Nouveaux Signalements ({pendingReports.length})</h3>
        
        {pendingReports.length === 0 ? (
          <p style={{ color: '#F87171', fontSize: '0.9rem', margin: 0 }}>Aucun signalement en attente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingReports.map(report => (
              <div key={report.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #FECACA', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      {report.type === 'product' ? 'Produit' : 'Boutique'}
                    </span>
                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '1rem', color: '#1E293B', fontWeight: 800 }}>{report.reason}</h4>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Signalé par : {report.reporter?.full_name || 'Anonyme'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Date : {new Date(report.created_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => handleResolve(report.id)} style={{ padding: '8px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                    ✔ Marquer comme lu
                  </button>
                </div>
                
                {report.type === 'product' && report.products && (
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {report.products.images && report.products.images[0] && (
                      <img src={report.products.images[0]} alt="Produit" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{report.products.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Vendeur: {report.seller?.full_name || report.seller?.boutique_name || 'Inconnu'}</div>
                      {report.products.is_hidden && <span style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 800 }}>Ce produit est déjà masqué.</span>}
                    </div>
                    {!report.products.is_hidden && (
                      <button onClick={() => handleHideProduct(report.products.id, report.id)} style={{ padding: '8px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        Masquer ce produit
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <h3 style={{ color: '#0F172A', margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>✅ Signalements Résolus ({resolvedReports.length})</h3>
        {resolvedReports.length === 0 ? (
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>Aucun historique.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {resolvedReports.map(report => (
              <div key={report.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>{report.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{new Date(report.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ color: '#10B981', fontWeight: 800, fontSize: '0.8rem' }}>Résolu</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;
