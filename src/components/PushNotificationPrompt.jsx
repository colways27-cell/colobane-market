import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  checkNotificationSupport, 
  getNotificationPermissionState, 
  requestNotificationPermission 
} from '../utils/pushNotifications';

const PushNotificationPrompt = () => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!checkNotificationSupport()) return;

    const currentPermission = getNotificationPermissionState();
    const isDismissed = localStorage.getItem('colobane_push_prompt_dismissed');

    if (currentPermission === 'default' && !isDismissed) {
      // Delai d'affichage pour ne pas agresser l'utilisateur immédiatement au chargement
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setShowPrompt(false);
    await requestNotificationPermission(user?.id);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('colobane_push_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      left: '20px',
      maxWidth: '400px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '20px',
      padding: '18px 20px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
      border: '1px solid #E2E8F0',
      zIndex: 999,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: '#FEF3C7',
          color: '#D97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          flexShrink: 0
        }}>
          🔔
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#1E293B' }}>
            Activer les Alertes Instantanées
          </h4>
          <p style={{ margin: '4px 0 12px 0', fontSize: '0.8rem', color: '#64748B', lineHeight: '1.4' }}>
            Soyez averti en direct des nouvelles demandes d'acheteurs (*Wutal Ma*), des messages et des validations de vos annonces.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleEnable}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--primary, #8a1c1c)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Activer 🔔
            </button>
            <button
              onClick={handleDismiss}
              style={{
                padding: '8px 12px',
                background: '#F1F5F9',
                color: '#64748B',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
