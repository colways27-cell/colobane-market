import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { categories as defaultCategories } from '../../data/categories';
import toast from 'react-hot-toast';
import * as Icons from 'lucide-react';

const CategoriesTab = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchDynamicCategories();
  }, []);

  const fetchDynamicCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'dynamic_categories')
        .maybeSingle();

      if (data && data.setting_value && Array.isArray(data.setting_value)) {
        setCategories(data.setting_value);
      } else {
        // Init from default
        const initCats = defaultCategories.map(c => ({
          ...c,
          iconName: c.id === 'telephones_tablettes' ? 'Smartphone' :
                    c.id === 'informatique' ? 'Laptop' :
                    c.id === 'electronique' ? 'Tv' :
                    c.id === 'maison_jardin' ? 'Armchair' :
                    c.id === 'habillement' ? 'Shirt' :
                    c.id === 'friperie' ? 'ShoppingBag' :
                    c.id === 'beaute' ? 'Sparkles' :
                    c.id === 'vehicules' ? 'CarFront' :
                    c.id === 'immobilier' ? 'Building' :
                    c.id === 'materiaux_outils' ? 'Hammer' :
                    c.id === 'agriculture' ? 'Sprout' :
                    c.id === 'animaux' ? 'PawPrint' :
                    c.id === 'alimentation' ? 'Utensils' :
                    c.id === 'livres_papeterie' ? 'BookOpen' :
                    c.id === 'jeux_video' ? 'Gamepad2' :
                    c.id === 'pieces_auto' ? 'Wrench' :
                    c.id === 'services' ? 'Handshake' :
                    c.id === 'emplois' ? 'Briefcase' : 'Box',
          is_active: true,
          // on enlève l'icon React
          icon: undefined 
        }));
        setCategories(initCats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    toast.loading('Enregistrement...', { id: 'save-cats' });
    try {
      const { error } = await supabase.from('app_settings').upsert({
        setting_key: 'dynamic_categories',
        setting_value: categories,
        description: 'Configuration dynamique des catégories du site'
      });

      if (error) throw error;
      toast.success('Catégories mises à jour !', { id: 'save-cats' });
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la sauvegarde.', { id: 'save-cats' });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategoryActive = (id) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
  };

  const moveCategory = (index, direction) => {
    const newCats = [...categories];
    if (direction === 'up' && index > 0) {
      [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
    } else if (direction === 'down' && index < newCats.length - 1) {
      [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
    }
    setCategories(newCats);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ flex: '1 1 200px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A', fontWeight: 900 }}>Gestion des Catégories</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
            Activez, désactivez et réorganisez les catégories affichées sur le site.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          style={{ width: '100%', maxWidth: '280px', padding: '12px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap', textAlign: 'center' }}
        >
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder les modifications'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {categories.map((cat, index) => {
          const IconComp = Icons[cat.iconName || 'Box'] || Icons.HelpCircle;
          return (
            <div key={cat.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', opacity: cat.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 200px', minWidth: '0' }}>
                <div style={{ color: cat.color || '#475569', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <IconComp size={24} strokeWidth={1.5} />
                </div>
                <div style={{ minWidth: '0' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <span>ID: {cat.id}</span>
                    <span>|</span>
                    <span>{cat.fields?.length || 0} champs</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => moveCategory(index, 'up')} disabled={index === 0} style={{ padding: '6px', background: '#E2E8F0', border: 'none', borderRadius: '6px', cursor: index === 0 ? 'not-allowed' : 'pointer' }}>↑</button>
                  <button onClick={() => moveCategory(index, 'down')} disabled={index === categories.length - 1} style={{ padding: '6px', background: '#E2E8F0', border: 'none', borderRadius: '6px', cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer' }}>↓</button>
                </div>

                <button
                  onClick={() => toggleCategoryActive(cat.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    background: cat.is_active ? '#DC2626' : '#10B981',
                    color: 'white'
                  }}
                >
                  {cat.is_active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesTab;
