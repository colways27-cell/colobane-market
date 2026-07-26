/**
 * Vérifie si une boutique gratuite non abonnée a dépassé sa période d'essai de 15 jours.
 * @param {Object} profile - Le profil de l'utilisateur/boutique.
 * @returns {Boolean} - true si la boutique est bloquée/expirée, false si elle est active.
 */
export const isBoutiqueExpired = (profile) => {
  if (!profile || profile.account_type !== 'boutique') return false;

  // Si le vendeur a souscrit à un abonnement actif (Pro 5000, Premium 10000, etc.)
  const activePlans = ['pro', '5000', 'forfait_basique', 'premium', 'forfait_premium', 'pass_semaine', 'pass_15jours'];
  const hasActivePlan = activePlans.includes(profile.subscription_plan) || profile.subscription_status === 'active';
  
  if (hasActivePlan) {
    return false; // Boutique active sans limite de jours
  }

  // Si le vendeur n'a AUCUN abonnement payant ('none' ou null) :
  // Calcul de la date de création ou d'expiration (15 jours d'essai)
  let expirationDate = null;

  if (profile.trial_end_date) {
    expirationDate = new Date(profile.trial_end_date);
  } else if (profile.created_at) {
    const createdAtDate = new Date(profile.created_at);
    expirationDate = new Date(createdAtDate.getTime() + 15 * 24 * 60 * 60 * 1000);
  }

  if (!expirationDate) return false;

  // Si la date du jour est supérieure à la date d'expiration -> Bloqué !
  return new Date() > expirationDate;
};

/**
 * Retourne le nombre de jours d'essai restant pour une boutique gratuite (0 à 15 jours).
 */
export const getTrialDaysRemaining = (profile) => {
  if (!profile || profile.account_type !== 'boutique') return 0;
  
  const activePlans = ['pro', '5000', 'forfait_basique', 'premium', 'forfait_premium', 'pass_semaine', 'pass_15jours'];
  if (activePlans.includes(profile.subscription_plan) || profile.subscription_status === 'active') {
    return 999; // Illimité
  }

  let expirationDate = null;
  if (profile.trial_end_date) {
    expirationDate = new Date(profile.trial_end_date);
  } else if (profile.created_at) {
    expirationDate = new Date(new Date(profile.created_at).getTime() + 15 * 24 * 60 * 60 * 1000);
  }

  if (!expirationDate) return 0;

  const diffTime = expirationDate.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};
