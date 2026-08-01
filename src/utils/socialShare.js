import toast from 'react-hot-toast';

export const copyToClipboard = async (text, successMsg = "Lien copié dans le presse-papier ! 📋") => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      toast.success(successMsg);
      return true;
    }
  } catch (_e) {
    // Fallback legacy
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast.success(successMsg);
    return true;
  } catch (err) {
    console.error("Could not copy to clipboard:", err);
    toast.error("Impossible de copier le lien.");
    return false;
  }
};

export const shareProduct = async (product) => {
  if (!product) return;

  const url = `${window.location.origin}/product/${product.id}`;
  const formattedPrice = product.price ? `${Number(product.price).toLocaleString('fr-FR')} FCFA` : 'Sur demande';
  const location = product.location || 'Dakar';

  const shareTitle = `🛍️ ${product.title}`;
  const shareText = `🛍️ *${product.title}*\n💰 *Prix :* ${formattedPrice}\n📍 *Lieu :* ${location}\n\n👉 *Voir l'annonce complète sur ColobaneMarket :*\n${url}`;

  // Si Web Share API disponible (sur mobile Android / iOS)
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: `Découvrez "${product.title}" (${formattedPrice}) sur Colobane Market 🇸🇳`,
        url: url
      });
      return;
    } catch (_e) {
      // Utilisateur a annulé ou navigateur incompatible -> Fallback WhatsApp
    }
  }

  // Fallback direct vers WhatsApp
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(whatsappUrl, '_blank');
};

export const shareBoutique = async (boutique) => {
  if (!boutique) return;

  const url = `${window.location.origin}/boutique/${boutique.id}`;
  const name = boutique.boutique_name || boutique.full_name || 'Boutique';
  const badge = boutique.is_verified ? '👑 Vendeur de Confiance' : '🏪 Boutique Officielle';

  const shareText = `🏪 *${name}* (${badge})\n📍 *Stock disponible à :* ${boutique.location || 'Dakar'}\n\n👉 *Découvrez tout le catalogue en ligne sur ColobaneMarket :*\n${url}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: name,
        text: `Découvrez la boutique officielle "${name}" sur Colobane Market 🇸🇳`,
        url: url
      });
      return;
    } catch (_e) {
      // Fallback
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(whatsappUrl, '_blank');
};

export const shareBuyerRequest = async (request) => {
  if (!request) return;

  const url = `${window.location.origin}/wutal-ma`;
  const shareText = `🙋‍♂️ *DEMANDE D'ACHAT WUTAL MA (SÉNÉGAL)*\n\n📦 *Recherche :* ${request.title}\n📍 *Ville :* ${request.location || 'Dakar'}\n💰 *Budget :* ${request.budget ? `${Number(request.budget).toLocaleString('fr-FR')} FCFA` : 'Non précisé'}\n\n👉 *Vous avez cet article ? Répondez directement sur ColobaneMarket :*\n${url}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Recherche Acheteur : ${request.title}`,
        text: shareText,
        url: url
      });
      return;
    } catch (_e) {
      // Fallback
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(whatsappUrl, '_blank');
};
