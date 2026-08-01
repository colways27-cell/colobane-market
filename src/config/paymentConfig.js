// Lien officiel du compte Wave Business Colobane Market pour les abonnements et boosts
export const WAVE_PAYMENT_URL = "https://pay.wave.com/m/M_sn_DDpGp25B76P7/c/sn/?src=d";

export const openWavePayment = () => {
  if (typeof window !== 'undefined') {
    window.open(WAVE_PAYMENT_URL, '_blank');
  }
};
