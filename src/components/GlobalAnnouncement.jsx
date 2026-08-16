import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

const GlobalAnnouncement = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'global_announcement')
          .maybeSingle();

        if (data && data.setting_value && data.setting_value.is_active) {
          setAnnouncement(data.setting_value);
        }
      } catch (err) {
        console.error("Error fetching announcement:", err);
      }
    };

    fetchAnnouncement();
  }, []);

  if (!announcement || !isVisible) return null;
  if (location.pathname.startsWith('/admin')) return null;

  const bgColors = {
    info: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
    success: 'linear-gradient(135deg, #064E3B 0%, #10B981 100%)',
    warning: 'linear-gradient(135deg, #78350F 0%, #F59E0B 100%)',
    error: 'linear-gradient(135deg, #7F1D1D 0%, #EF4444 100%)'
  };

  const icons = {
    info: 'ℹ️',
    success: '🎉',
    warning: '⚠️',
    error: '🚨'
  };

  return (
    <div style={{
      background: bgColors[announcement.type || 'info'],
      color: 'white',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      position: 'relative',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
        <div style={{ fontSize: '1.2rem', marginTop: '2px' }}>{icons[announcement.type || 'info']}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '2px' }}>{announcement.title}</div>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.4, opacity: 0.9 }}>
            {announcement.message}
            {announcement.link_url && (
              <a 
                href={announcement.link_url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#FFF', 
                  textDecoration: 'underline', 
                  fontWeight: 700, 
                  marginLeft: '8px',
                  display: 'inline-block'
                }}
              >
                En savoir plus ↗
              </a>
            )}
          </div>
        </div>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.2s'
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default GlobalAnnouncement;
