import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Sparkles, X } from 'lucide-react';

const PromoBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(true);
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(50); // Default, could be fetched dynamically

  useEffect(() => {
    // Check local storage so we don't annoy users who closed it
    const dismissed = localStorage.getItem('colobane_promo_dismissed');
    if (dismissed) {
      setShow(false);
    }
    
    if (user) {
      checkClaimStatus();
    } else {
      fetchRemainingCount();
    }
  }, [user]);

  const checkClaimStatus = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('claimed_launch_promo')
        .eq('id', user.id)
        .single();
        
      if (data?.claimed_launch_promo) {
        setClaimed(true);
        setShow(false);
      } else {
        fetchRemainingCount();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRemainingCount = async () => {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('claimed_launch_promo', true);
      
      const spotsLeft = 50 - (count || 0);
      setRemaining(spotsLeft > 0 ? spotsLeft : 0);
      
      if (spotsLeft <= 0) {
        setShow(false);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleClaim = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectUrl: '/' } });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_first_50_premium');
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(data.message, { duration: 5000 });
        setClaimed(true);
        setShow(false);
      } else {
        toast.error(data.message);
        if (data.message.includes('déjà été réclamées')) {
          setShow(false);
        }
      }
    } catch (e) {
      toast.error('Une erreur est survenue lors de la réclamation.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    localStorage.setItem('colobane_promo_dismissed', 'true');
    setShow(false);
  };

  if (!show || claimed || remaining <= 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #BE123C 0%, #E11D48 100%)',
      color: 'white',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1000,
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
        <Sparkles size={18} />
        <span>Lancement ColobaneMarket : Boutique Premium 1 Mois OFFERTE !</span>
        <span style={{ 
          background: 'rgba(255,255,255,0.2)', 
          padding: '2px 8px', 
          borderRadius: '12px', 
          fontSize: '0.75rem', 
          whiteSpace: 'nowrap'
        }}>
          Plus que {remaining} places
        </span>
      </div>
      
      <button 
        onClick={handleClaim}
        disabled={loading}
        style={{
          background: 'white',
          color: '#BE123C',
          border: 'none',
          padding: '6px 14px',
          borderRadius: '20px',
          fontWeight: 800,
          fontSize: '0.85rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap'
        }}
      >
        {loading ? '...' : user ? '🎁 Réclamer mon offre' : 'Créer mon compte'}
      </button>
      
      <button 
        onClick={handleClose}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default PromoBanner;
