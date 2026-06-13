import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const FavoriteButton = ({ productId, style }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkFavorite = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .maybeSingle();

        if (isMounted) {
          setIsFavorite(!!data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking favorite:', err);
        if (isMounted) setLoading(false);
      }
    };

    checkFavorite();

    return () => {
      isMounted = false;
    };
  }, [productId, user]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      navigate('/auth');
      return;
    }

    try {
      if (isFavorite) {
        setIsFavorite(false);
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) {
          setIsFavorite(true);
          throw error;
        }
      } else {
        setIsFavorite(true);
        toast.success('Ajouté aux favoris ❤️', { duration: 2000 });
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
        if (error) {
          setIsFavorite(false);
          throw error;
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  return (
    <button 
      onClick={toggleFavorite} 
      className="touch-target active-scale" 
      style={{ 
        background: 'rgba(255,255,255,0.9)', 
        backdropFilter: 'blur(4px)', 
        border: 'none', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
        cursor: 'pointer',
        color: isFavorite ? '#e74c3c' : '#94A3B8',
        opacity: loading ? 0.5 : 1,
        transition: 'all 0.2s',
        ...style 
      }}
      disabled={loading}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
};

export default FavoriteButton;
