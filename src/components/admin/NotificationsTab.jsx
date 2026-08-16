import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const NotificationsTab = () => {
  const [announcement, setAnnouncement] = useState({
    is_active: false,
    title: '',
    message: '',
    link_url: '',
    type: 'info'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'global_announcement')
        .maybeSingle();

      if (data && data.setting_value) {
        setAnnouncement(data.setting_value);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'global_announcement',
          setting_value: announcement,
          description: 'Notification push globale affichée à tous les utilisateurs'
        });

      if (error) throw error;
      toast.success("Notification enregistrée avec succès.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAnnouncement(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ fontSize: '2rem' }}>💌</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A', fontWeight: 900 }}>Notification Globale</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
            Affichez un message d'alerte en haut de l'écran pour tous les utilisateurs du site.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: announcement.is_active ? '#ECFDF5' : '#F1F5F9', borderRadius: '12px', border: `1px solid ${announcement.is_active ? '#A7F3D0' : '#E2E8F0'}` }}>
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={announcement.is_active}
            onChange={handleChange}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <label htmlFor="is_active" style={{ cursor: 'pointer', fontWeight: 800, color: announcement.is_active ? '#059669' : '#475569' }}>
            Activer la notification pour tous les utilisateurs
          </label>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>Type d'alerte</label>
          <select
            name="type"
            value={announcement.type}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
          >
            <option value="info">ℹ️ Information (Bleu)</option>
            <option value="success">🎉 Succès / Promo (Vert)</option>
            <option value="warning">⚠️ Avertissement (Orange)</option>
            <option value="error">🚨 Alerte Critique (Rouge)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>Titre de la notification</label>
          <input
            type="text"
            name="title"
            value={announcement.title}
            onChange={handleChange}
            placeholder="Ex: Promo Tabaski ! -50% sur les Boutiques"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>Message</label>
          <textarea
            name="message"
            value={announcement.message}
            onChange={handleChange}
            placeholder="Détails de l'annonce..."
            rows="3"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>Lien d'action (Optionnel)</label>
          <input
            type="url"
            name="link_url"
            value={announcement.link_url}
            onChange={handleChange}
            placeholder="Ex: https://wa.me/221..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: '10px',
            padding: '12px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? 'Enregistrement...' : 'Sauvegarder et Diffuser'}
        </button>
      </div>
    </div>
  );
};

export default NotificationsTab;
