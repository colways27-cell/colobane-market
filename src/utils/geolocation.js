// Coordonnées GPS approximatives des principaux quartiers et villes du Sénégal
export const SENEGAL_LOCATION_COORDS = {
  // Dakar et Quartiers
  "dakar": { lat: 14.6937, lng: -17.4441 },
  "dakar-plateau": { lat: 14.6670, lng: -17.4333 },
  "médina": { lat: 14.6800, lng: -17.4460 },
  "fass-colobane": { lat: 14.6890, lng: -17.4470 },
  "colobane": { lat: 14.6890, lng: -17.4470 },
  "point e": { lat: 14.6930, lng: -17.4580 },
  "amitié": { lat: 14.6970, lng: -17.4550 },
  "grand dakar": { lat: 14.7000, lng: -17.4480 },
  "sicap-liberté": { lat: 14.7100, lng: -17.4520 },
  "dieuppeul-derklé": { lat: 14.7130, lng: -17.4490 },
  "hann-bel air": { lat: 14.7100, lng: -17.4300 },
  "yoff": { lat: 14.7600, lng: -17.4680 },
  "ngor": { lat: 14.7550, lng: -17.5180 },
  "ouakam": { lat: 14.7230, lng: -17.4870 },
  "mermoz-sacré-cœur": { lat: 14.7080, lng: -17.4720 },
  "parcelles assainies": { lat: 14.7550, lng: -17.4380 },
  "patte d'oie": { lat: 14.7380, lng: -17.4420 },
  "grand yoff": { lat: 14.7300, lng: -17.4480 },
  "pikine": { lat: 14.7540, lng: -17.3930 },
  "guédiawaye": { lat: 14.7700, lng: -17.3870 },
  "rufisque": { lat: 14.7160, lng: -17.2720 },
  "keur massar": { lat: 14.7750, lng: -17.3100 },
  "diamniadio": { lat: 14.7200, lng: -17.1800 },
  "sébikotane": { lat: 14.7450, lng: -17.1330 },

  // Thiès & Petite Côte
  "thiès": { lat: 14.7900, lng: -16.9260 },
  "mbour": { lat: 14.4220, lng: -16.9640 },
  "saly": { lat: 14.4440, lng: -16.9850 },
  "saly portudal": { lat: 14.4440, lng: -16.9850 },
  "somone": { lat: 14.4880, lng: -17.0810 },
  "tivaouane": { lat: 14.9540, lng: -16.8120 },
  "joal-fadiouth": { lat: 14.1670, lng: -16.8330 },
  "popenguine": { lat: 14.5500, lng: -17.1100 },

  // Autres Villes Majeures
  "diourbel": { lat: 14.6540, lng: -16.2300 },
  "touba": { lat: 14.8630, lng: -15.8830 },
  "mbacké": { lat: 14.7900, lng: -15.9100 },
  "saint-louis": { lat: 16.0240, lng: -16.4890 },
  "ziguinchor": { lat: 12.5830, lng: -16.2720 },
  "cap skirring": { lat: 12.3780, lng: -16.7420 },
  "kaolack": { lat: 14.1500, lng: -16.0750 },
  "louga": { lat: 15.6180, lng: -16.2240 },
  "fatick": { lat: 14.3330, lng: -16.4000 },
  "tambacounda": { lat: 13.7700, lng: -13.6700 },
  "matam": { lat: 15.6560, lng: -13.2550 },
  "kolda": { lat: 12.8830, lng: -14.9500 },
  "kédougou": { lat: 12.5570, lng: -12.1740 },
  "sédhiou": { lat: 12.7080, lng: -15.5570 }
};

/**
 * Calcul de distance entre 2 coordonnées GPS via formule Haversine (en km)
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formate proprement une distance en km ou mètres
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) return '';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Retrouve ou estime les coordonnées d'un produit basé sur son texte de localisation
 */
export const getCoordinatesForLocation = (locationText, productMetadata = {}) => {
  // Si le produit possède des coordonnées GPS réelles dans ses métadonnées
  if (productMetadata?.latitude && productMetadata?.longitude) {
    return {
      lat: parseFloat(productMetadata.latitude),
      lng: parseFloat(productMetadata.longitude)
    };
  }

  if (!locationText) return SENEGAL_LOCATION_COORDS["colobane"];

  const cleanLoc = locationText.toLowerCase().trim();

  // Recherche d'une correspondance exacte ou partielle
  for (const [key, coords] of Object.entries(SENEGAL_LOCATION_COORDS)) {
    if (cleanLoc.includes(key) || key.includes(cleanLoc)) {
      return coords;
    }
  }

  // Par défaut au Sénégal (Dakar Colobane)
  return SENEGAL_LOCATION_COORDS["colobane"];
};

/**
 * Récupère les coordonnées GPS du navigateur
 */
export const getUserCoordinates = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas supportée par votre navigateur."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
};

/**
 * Trie et filtre une liste de produits par rapport à la position de l'utilisateur
 */
export const sortProductsByProximity = (userCoords, products, maxRadiusKm = null) => {
  if (!userCoords || !products || products.length === 0) return products;

  const productsWithDistance = products.map((product) => {
    const itemCoords = getCoordinatesForLocation(product.location, product.metadata);
    const distanceKm = calculateHaversineDistance(
      userCoords.lat,
      userCoords.lng,
      itemCoords.lat,
      itemCoords.lng
    );

    return {
      ...product,
      distanceKm,
      formattedDistance: formatDistance(distanceKm)
    };
  });

  // Filtrer par rayon max si spécifié
  let filtered = productsWithDistance;
  if (maxRadiusKm && maxRadiusKm > 0) {
    const withinRadius = productsWithDistance.filter(p => p.distanceKm !== null && p.distanceKm <= maxRadiusKm);
    if (withinRadius.length > 0) {
      filtered = withinRadius;
    }
  }

  // Trier du plus proche au plus éloigné
  return filtered.sort((a, b) => (a.distanceKm || 99999) - (b.distanceKm || 99999));
};
