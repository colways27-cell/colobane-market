import { useState, useEffect } from 'react';
import { isFollowingBoutique, toggleFollowBoutique } from '../utils/followHelpers';
import { Bell, BellOff, Check } from 'lucide-react';

const FollowButton = ({ boutiqueId, boutiqueName, size = 'md', showIcon = true, style = {} }) => {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (boutiqueId) {
      setFollowing(isFollowingBoutique(boutiqueId));
    }
  }, [boutiqueId]);

  useEffect(() => {
    const handleFollowChange = (e) => {
      if (e.detail?.boutiqueId === boutiqueId) {
        setFollowing(e.detail.isFollowing);
      }
    };
    window.addEventListener('colobane_follow_change', handleFollowChange);
    return () => window.removeEventListener('colobane_follow_change', handleFollowChange);
  }, [boutiqueId]);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!boutiqueId) return;
    const newState = toggleFollowBoutique(boutiqueId, boutiqueName);
    setFollowing(newState);
  };

  const getPadding = () => {
    if (size === 'sm') return '6px 12px';
    if (size === 'lg') return '12px 24px';
    return '9px 18px';
  };

  const getFontSize = () => {
    if (size === 'sm') return '0.78rem';
    if (size === 'lg') return '1.05rem';
    return '0.88rem';
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="active-scale hover-lift"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: getPadding(),
        borderRadius: '20px',
        fontWeight: '800',
        fontSize: getFontSize(),
        cursor: 'pointer',
        border: following ? '1.5px solid #10B981' : 'none',
        background: following
          ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
          : 'linear-gradient(135deg, #8A1C1C 0%, #B91C1C 100%)',
        color: following ? '#047857' : 'white',
        boxShadow: following
          ? '0 2px 8px rgba(16, 185, 129, 0.15)'
          : '0 4px 14px rgba(139, 28, 49, 0.3)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
    >
      {showIcon && (
        following ? <Check size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} strokeWidth={3} /> : <Bell size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} strokeWidth={2.5} />
      )}
      <span>{following ? 'Abonné' : "S'abonner"}</span>
    </button>
  );
};

export default FollowButton;
