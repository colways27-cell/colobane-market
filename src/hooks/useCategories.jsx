import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { categories as defaultCategories } from '../data/categories';
import * as Icons from 'lucide-react';
import React from 'react';

// Construit le bon icône React à partir d'un nom de chaîne de caractères (ex: 'Smartphone')
const getIconComponent = (iconName, size = 28, strokeWidth = 1.5) => {
  const IconComponent = Icons[iconName] || Icons.HelpCircle;
  return <IconComponent size={size} strokeWidth={strokeWidth} />;
};

const defaultIconNames = {
  'telephones_tablettes': 'Smartphone',
  'informatique': 'Laptop',
  'electronique': 'Tv',
  'maison_jardin': 'Armchair',
  'habillement': 'Shirt',
  'friperie': 'ShoppingBag',
  'beaute': 'Sparkles',
  'vehicules': 'CarFront',
  'immobilier': 'Building',
  'materiaux_outils': 'Hammer',
  'agriculture': 'Sprout',
  'animaux': 'PawPrint',
  'alimentation': 'Utensils',
  'livres_papeterie': 'BookOpen',
  'jeux_video': 'Gamepad2',
  'pieces_auto': 'Wrench',
  'services': 'Handshake',
  'emplois': 'Briefcase',
  'telephones': 'Smartphone',
  'ordinateurs': 'Laptop',
  'vetements_homme': 'Shirt',
  'vetements_femme': 'Handbag',
  'chaussures': 'ShoppingBag',
  'montres_bijoux': 'Watch',
  'electromenager': 'Tv',
  'accessoires': 'Glasses',
  'beaute_sante': 'Flower2',
  'meubles': 'Armchair'
};

const legacyCategoryData = {
  'telephones': { name: 'Téléphones & Tablettes', color: '#007aff', iconName: 'Smartphone' },
  'ordinateurs': { name: 'Informatique', color: '#5856d6', iconName: 'Laptop' },
  'vetements_homme': { name: 'Vêtements Homme', color: '#ff2d55', iconName: 'Shirt' },
  'vetements_femme': { name: 'Vêtements Femme', color: '#ff2d55', iconName: 'Handbag' },
  'chaussures': { name: 'Chaussures', color: '#ff9500', iconName: 'ShoppingBag' },
  'montres_bijoux': { name: 'Montres & Bijoux', color: '#ffcc00', iconName: 'Watch' },
  'electromenager': { name: 'Électroménager', color: '#4cd964', iconName: 'Tv' },
  'meubles': { name: 'Meubles', color: '#ff2d55', iconName: 'Armchair' },
};

export const useCategories = () => {
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'dynamic_categories')
          .maybeSingle();

        if (data && data.setting_value && Array.isArray(data.setting_value)) {
          // Reconstruire les icônes React et merger avec les valeurs par défaut
          const dynamicCats = data.setting_value
            .filter(cat => cat.is_active !== false) // Filtrer les inactifs
            .map(cat => {
              const defaultCat = defaultCategories.find(dc => dc.id === cat.id) || legacyCategoryData[cat.id] || {};
              const iconName = cat.iconName || defaultCat.iconName || defaultIconNames[cat.id] || 'Box';
              return {
                ...defaultCat,
                ...cat,
                name: cat.name || defaultCat.name || cat.id,
                color: cat.color || defaultCat.color || '#475569',
                icon: getIconComponent(iconName)
              };
            });
          setCategories(dynamicCats);
        }
      } catch (err) {
        console.error("Error fetching dynamic categories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicCategories();
  }, []);

  return { categories, loading };
};
