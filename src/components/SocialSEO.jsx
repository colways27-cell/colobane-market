import React from 'react';
import { Helmet } from 'react-helmet-async';

const SocialSEO = ({
  title = "Colobane Market 🇸🇳 — La Marketplace #1 du Sénégal",
  description = "Achetez et vendez facilement au Sénégal. Des milliers d'annonces vérifiées : Téléphones, Véhicules, Friperie, Immobilier & Services.",
  image = null,
  url = null,
  price = null,
  currency = "FCFA",
  type = "website"
}) => {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://colobanemarket.com');
  const defaultImage = `${typeof window !== 'undefined' ? window.location.origin : 'https://colobanemarket.com'}/hero-banner.jpg`;
  
  // Garantir une URL d'image absolue
  let fullImageUrl = defaultImage;
  if (image) {
    if (image.startsWith('http://') || image.startsWith('https://')) {
      fullImageUrl = image;
    } else {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://colobanemarket.com';
      fullImageUrl = `${origin}${image.startsWith('/') ? '' : '/'}${image}`;
    }
  }

  const pageTitle = title.includes('Colobane') ? title : `${title} — Colobane Market 🇸🇳`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />

      {/* OpenGraph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:secure_url" content={fullImageUrl} />
      <meta property="og:site_name" content="Colobane Market" />
      <meta property="og:locale" content="fr_SN" />

      {price && (
        <>
          <meta property="og:price:amount" content={String(price)} />
          <meta property="og:price:currency" content={currency} />
        </>
      )}

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
    </Helmet>
  );
};

export default SocialSEO;
