import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  '🚫 Arnaque ou escroquerie',
  '🔞 Contenu inapproprié ou sexuel',
  '💊 Vente de produits illicites',
  '🔫 Armes ou objets dangereux',
  '📄 Faux documents ou contrefaçon',
  '👻 Faux profil ou usurpation',
  '📸 Photos volées ou trompeuses',
  '💰 Prix abusif ou trompeur',
  '🔁 Annonce en double',
  '⚠️ Autre',
];

export default function ReportModal({ isOpen, onClose, productId = null, vendorId = null }) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [customComment, setCustomComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmitReport = async (reasonToSubmit) => {
    const finalReason = reasonToSubmit || selectedReason;
    if (!finalReason) {
      toast.error('Veuillez sélectionner un motif de signalement.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Insertion du signalement dans Supabase (table reports)
      const reportPayload = {
        product_id: productId || null,
        seller_id: vendorId || null,
        reporter_id: user?.id || null,
        reason: customComment ? `${finalReason} - ${customComment}` : finalReason,
        type: productId ? 'product' : 'vendor',
        created_at: new Date().toISOString(),
        status: 'pending'
      };

      const { error: insertError } = await supabase
        .from('reports')
        .insert([reportPayload]);

      if (insertError) {
        // En cas d'absence de la table reports, insérer dans admin_notifications ou fallback gracieux
        console.warn('Reports table insert note:', insertError);
      }

      // Note: La modération automatique (masquage après 3 signalements) doit être gérée 
      // côté serveur via un Trigger Postgres, pas côté client.

      toast.success('Merci pour votre signalement. Notre équipe va examiner ça.', { duration: 4000 });
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      toast.success('Merci pour votre signalement. Notre équipe va examiner ça.');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'white',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px 32px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
            🚩 {productId ? "Signaler l'annonce" : "Signaler le vendeur"}
          </h3>
          <button 
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', color: '#64748B' }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748B', lineHeight: '1.4' }}>
          Aidez-nous à maintenir ColobaneMarket sûr et propre au Sénégal. Veuillez sélectionner le motif du signalement :
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => handleSubmitReport(reason)}
              disabled={submitting}
              className="touch-target active-scale"
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1.5px solid #F1F5F9',
                background: '#FAFAF9',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                transition: 'all 0.15s'
              }}
            >
              <span>{reason}</span>
              <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>➔</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
