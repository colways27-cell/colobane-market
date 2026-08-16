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
          // Reconstruire les icônes React
          const dynamicCats = data.setting_value
            .filter(cat => cat.is_active !== false) // Filtrer les inactifs
            .map(cat => ({
              ...cat,
              icon: getIconComponent(cat.iconName || 'Box')
            }));
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
