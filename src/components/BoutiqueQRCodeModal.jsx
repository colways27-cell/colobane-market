import { useState } from 'react';
import { QrCode, Download, Share2, Copy, Check, X, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../utils/socialShare';

const BoutiqueQRCodeModal = ({ isOpen, onClose, boutiqueProfile }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !boutiqueProfile) return null;

  const boutiqueName = boutiqueProfile.boutique_name || boutiqueProfile.full_name || 'Boutique Colobane';
  const boutiqueId = boutiqueProfile.id;
  const storeUrl = `${window.location.origin}/boutique/${boutiqueId}`;
  
  // High quality QR Code image generated via reliable API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(storeUrl)}&color=0f172a&bgcolor=ffffff&margin=10`;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(storeUrl, "Lien de la boutique copié ! 📋");
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR_Code_${boutiqueName.replace(/\s+/g, '_')}_ColobaneMarket.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("QR Code téléchargé avec succès ! 📥");
    } catch (err) {
      window.open(qrCodeImageUrl, '_blank');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(9, 9, 11, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '28px',
        maxWidth: '440px',
        width: '100%',
        padding: '28px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        textAlign: 'center',
        border: '1px solid #E2E8F0'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#475569'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '50%', background: '#FFF1F2', border: '2px solid #FFE4E6', marginBottom: '12px' }}>
          <QrCode size={28} color="#BE123C" />
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: '900', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)', color: '#0F172A' }}>
          QR Code Officiel Boutique
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0 0 20px 0' }}>
          Imprimez ce QR Code sur vos emballages ou cartes de visite pour vos clients à Dakar !
        </p>

        {/* Printable Card Container */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
          borderRadius: '20px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(15,23,42,0.25)',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Store Name Badge */}
          <div style={{ fontSize: '1.1rem', fontWeight: '900', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#FFFFFF' }}>
            <Store size={18} color="#F43F5E" /> {boutiqueName}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '16px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '800' }}>
            Boutique Officielle • Colobane Market 🇸🇳
          </div>

          {/* QR Image Box */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '14px',
            display: 'inline-block',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
          }}>
            <img
              src={qrCodeImageUrl}
              alt={`QR Code ${boutiqueName}`}
              style={{ width: '180px', height: '180px', objectFit: 'contain', display: 'block' }}
            />
          </div>

          <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#CBD5E1', fontWeight: '600' }}>
            Scannez avec l'appareil photo de votre smartphone
          </div>
        </div>

        {/* Actions Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleDownload}
            className="active-scale"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--primary) 0%, #BE123C 100%)',
              color: 'white',
              border: 'none',
              padding: '13px',
              borderRadius: '16px',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(190,18,60,0.3)'
            }}
          >
            <Download size={18} /> Télécharger le QR Code (HD)
          </button>

          <button
            onClick={handleCopyLink}
            className="active-scale"
            style={{
              width: '100%',
              background: '#F8FAFC',
              color: '#334155',
              border: '1.5px solid #E2E8F0',
              padding: '12px',
              borderRadius: '16px',
              fontWeight: '800',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {copied ? <Check size={18} color="#10B981" /> : <Copy size={18} />}
            {copied ? 'Lien copié !' : 'Copier le lien direct'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoutiqueQRCodeModal;
