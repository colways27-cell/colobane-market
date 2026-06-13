import React from 'react';
import Navbar from '../components/Navbar';

const styles = {
  container: { minHeight: '100vh', padding: '100px 20px 80px', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center' },
  card: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '800px', width: '100%' },
  title: { color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', fontFamily: 'var(--font-heading)', borderBottom: '3px solid #f1f5f9', paddingBottom: '1rem' },
  h2: { color: 'var(--secondary)', fontSize: '1.2rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' },
  p: { color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1rem' },
  ul: { paddingLeft: '20px', marginBottom: '1.5rem', color: 'var(--text-main)', lineHeight: '1.7' },
  li: { marginBottom: '0.5rem' }
};

const PrivacyPolicyPage = () => {
  return (
    <>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Politique de Confidentialité</h1>
          
          <h2 style={styles.h2}>1. Données collectées</h2>
          <p style={styles.p}>Lors de votre inscription, nous collectons les informations suivantes :</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Votre prénom et nom.</li>
            <li style={styles.li}>Votre numéro de téléphone (utilisé comme identifiant et contact WhatsApp).</li>
            <li style={styles.li}>Votre localisation (Région/Ville).</li>
          </ul>

          <h2 style={styles.h2}>2. Utilisation de vos données</h2>
          <p style={styles.p}>Vos données sont utilisées dans le but unique de faire fonctionner la plateforme. Votre nom et votre numéro de téléphone (WhatsApp) seront affichés publiquement sur vos annonces pour permettre aux acheteurs de vous contacter.</p>

          <h2 style={styles.h2}>3. Protection de vos données</h2>
          <p style={styles.p}>Nous ne revendons en aucun cas vos informations personnelles (numéros de téléphone, noms) à des entreprises tierces à des fins publicitaires. Vos mots de passe sont cryptés et sécurisés.</p>

          <h2 style={styles.h2}>4. Suppression de compte</h2>
          <p style={styles.p}>Vous pouvez à tout moment demander la suppression complète de votre compte et de toutes vos annonces en contactant notre support client.</p>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
