import toast from 'react-hot-toast';

export const getFollowedBoutiques = () => {
  try {
    const list = JSON.parse(localStorage.getItem('colobane_followed_boutiques') || '[]');
    return Array.isArray(list) ? list : [];
  } catch (_e) {
    return [];
  }
};

export const isFollowingBoutique = (boutiqueId) => {
  if (!boutiqueId) return false;
  const followed = getFollowedBoutiques();
  return followed.includes(boutiqueId);
};

export const toggleFollowBoutique = (boutiqueId, boutiqueName = 'la boutique') => {
  if (!boutiqueId) return false;
  try {
    const current = getFollowedBoutiques();
    let updated = [];
    let isNowFollowing = false;

    if (current.includes(boutiqueId)) {
      updated = current.filter(id => id !== boutiqueId);
      isNowFollowing = false;
      toast(`Vous ne suivez plus ${boutiqueName}`, { icon: '🔕' });
    } else {
      updated = [boutiqueId, ...current];
      isNowFollowing = true;
      toast.success(`🔔 Vous êtes abonné à ${boutiqueName} ! Vous recevrez ses nouveaux arrivages.`, { duration: 4000 });
    }

    localStorage.setItem('colobane_followed_boutiques', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('colobane_follow_change', { detail: { boutiqueId, isFollowing: isNowFollowing } }));
    return isNowFollowing;
  } catch (_e) {
    return false;
  }
};
