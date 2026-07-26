import React from 'react';

const styles = {
  container: { minHeight: '100vh', padding: '100px 20px 80px', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center' },
  card: { background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 25px rgba(0,0,0,0.06)', maxWidth: '850px', width: '100%' },
  title: { color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', borderBottom: '3px solid #f1f5f9', paddingBottom: '1rem' },
  subtitle: { color: '#64748B', fontSize: '0.9rem', fontWeight: '600', marginBottom: '2rem' },
  h2: { color: 'var(--secondary)', fontSize: '1.25rem', fontWeight: '800', marginTop: '2rem', marginBottom: '0.8rem', borderLeft: '4px solid var(--primary)', paddingLeft: '10px' },
  p: { color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.75', marginBottom: '1rem' },
  ul: { paddingLeft: '22px', marginBottom: '1.5rem', color: 'var(--text-main)', lineHeight: '1.75' },
  li: { marginBottom: '0.6rem' }
};

const PrivacyPolicyPage = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Politique de Confidentialité</h1>
        <div style={styles.subtitle}>COLOBANEMARKET — Dernière mise à jour : Juillet 2026</div>
        <p style={styles.p} style={{ fontStyle: 'italic', color: '#64748B', marginBottom: '1.5rem' }}>
          Conformément à la loi sénégalaise n°2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel.
        </p>

        <h2 style={styles.h2}>Article 1 — Responsable du traitement</h2>
        <p style={styles.p}>Le responsable du traitement des données personnelles collectées sur ColobaneMarket est SG GlobalBusiness, basé à Sébikotane, Dakar, Sénégal. Contact : <a href="mailto:legal@colobanemarket.sn" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>legal@colobanemarket.sn</a></p>

        <h2 style={styles.h2}>Article 2 — Données collectées</h2>
        <p style={styles.p}>Lors de votre inscription et utilisation de ColobaneMarket, nous collectons :</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Prénom, nom et pseudo ;</li>
          <li style={styles.li}>Numéro de téléphone et numéro WhatsApp ;</li>
          <li style={styles.li}>Adresse email ;</li>
          <li style={styles.li}>Ville et quartier de résidence ;</li>
          <li style={styles.li}>Photos de profil (optionnel) ;</li>
          <li style={styles.li}>Contenu des annonces publiées (titre, description, photos, prix) ;</li>
          <li style={styles.li}>Données de navigation (pages visitées, recherches effectuées) ;</li>
          <li style={styles.li}>Date et heure d'acceptation des CGU.</li>
        </ul>

        <h2 style={styles.h2}>Article 3 — Finalités du traitement</h2>
        <p style={styles.p}>Vos données sont utilisées pour :</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Créer et gérer votre compte utilisateur ;</li>
          <li style={styles.li}>Permettre la publication et la consultation d'annonces ;</li>
          <li style={styles.li}>Faciliter la mise en relation entre acheteurs et vendeurs ;</li>
          <li style={styles.li}>Assurer la modération et la sécurité de la plateforme ;</li>
          <li style={styles.li}>Vous envoyer des notifications relatives à votre compte ;</li>
          <li style={styles.li}>Améliorer nos services.</li>
        </ul>

        <h2 style={styles.h2}>Article 4 — Conservation des données</h2>
        <p style={styles.p}>Vos données sont conservées pendant toute la durée de votre inscription sur ColobaneMarket, et pendant 12 mois après la suppression de votre compte pour des raisons légales. Les données de signalement sont conservées 24 mois.</p>

        <h2 style={styles.h2}>Article 5 — Partage des données</h2>
        <p style={styles.p}>ColobaneMarket ne vend jamais vos données personnelles à des tiers. Vos données peuvent être partagées uniquement avec :</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Supabase — hébergeur de la base de données (infrastructure technique) ;</li>
          <li style={styles.li}>Vercel — hébergeur du site (infrastructure technique) ;</li>
          <li style={styles.li}>Les autorités judiciaires sénégalaises en cas de réquisition légale.</li>
        </ul>
        <p style={styles.p}>Votre numéro de téléphone est visible par les autres utilisateurs uniquement si vous choisissez de le rendre public dans vos annonces.</p>

        <h2 style={styles.h2}>Article 6 — Vos droits</h2>
        <p style={styles.p}>Conformément à la loi n°2008-12, vous disposez des droits suivants :</p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Droit d'accès</strong> — obtenir une copie de vos données personnelles ;</li>
          <li style={styles.li}><strong>Droit de rectification</strong> — corriger vos données inexactes ;</li>
          <li style={styles.li}><strong>Droit de suppression</strong> — demander la suppression de votre compte et de vos données ;</li>
          <li style={styles.li}><strong>Droit d'opposition</strong> — vous opposer à certains traitements.</li>
        </ul>
        <p style={styles.p}>Pour exercer ces droits, contactez-nous à : <a href="mailto:legal@colobanemarket.sn" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>legal@colobanemarket.sn</a> — Nous répondons dans un délai de 30 jours.</p>

        <h2 style={styles.h2}>Article 7 — Sécurité des données</h2>
        <p style={styles.p}>ColobaneMarket met en œuvre les mesures techniques suivantes pour protéger vos données :</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Chiffrement HTTPS sur toutes les communications ;</li>
          <li style={styles.li}>Authentification sécurisée via Supabase Auth ;</li>
          <li style={styles.li}>Accès à la base de données limité aux seuls administrateurs autorisés ;</li>
          <li style={styles.li}>Clés d'accès stockées en variables d'environnement sécurisées.</li>
        </ul>

        <h2 style={styles.h2}>Article 8 — Cookies</h2>
        <p style={styles.p}>ColobaneMarket utilise uniquement des cookies techniques nécessaires au bon fonctionnement du service (session utilisateur, préférences d'affichage). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>

        <h2 style={styles.h2}>Article 9 — Mineurs</h2>
        <p style={styles.p}>ColobaneMarket est interdit aux personnes de moins de 18 ans. En vous inscrivant, vous certifiez être majeur. Si nous constatons qu'un mineur s'est inscrit, son compte sera supprimé immédiatement.</p>

        <h2 style={styles.h2}>Article 10 — Modification de la politique</h2>
        <p style={styles.p}>Cette politique peut être mise à jour à tout moment. Vous serez notifié de tout changement significatif via la plateforme.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
