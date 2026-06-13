import React from 'react';
import Navbar from '../components/Navbar';

const styles = {
  container: { minHeight: '100vh', padding: '100px 20px 80px', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center' },
  card: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '800px', width: '100%' },
  title: { color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', fontFamily: 'var(--font-heading)', borderBottom: '3px solid #f1f5f9', paddingBottom: '1rem' },
  h2: { color: 'var(--secondary)', fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' },
  p: { color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '1rem' },
  ul: { paddingLeft: '20px', marginBottom: '1.5rem', color: 'var(--text-main)', lineHeight: '1.7' },
  li: { marginBottom: '0.5rem' },
  alert: { background: '#fdf0ed', color: '#e74c3c', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #e74c3c' }
};

const PublishingRulesPage = () => {
  return (
    <>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Règles de publication</h1>
          
          <p style={styles.p}>Pour garantir une expérience de qualité à tous nos utilisateurs, nous vous demandons de respecter ces quelques règles lors de la publication de vos annonces.</p>

          <h2 style={styles.h2}>Ce qui est AUTORISÉ ✅</h2>
          <ul style={styles.ul}>
            <li style={styles.li}>Publier des articles réels dont vous êtes le propriétaire.</li>
            <li style={styles.li}>Utiliser vos propres photos (pas d'images prises sur internet).</li>
            <li style={styles.li}>Mettre un prix exact et cohérent avec la valeur du marché.</li>
            <li style={styles.li}>Rédiger des descriptions honnêtes et détaillées.</li>
          </ul>

          <h2 style={styles.h2}>Ce qui est STRICTEMENT INTERDIT 🚫</h2>
          <div style={styles.alert}>
            Le non-respect de ces règles entraînera la suppression immédiate de l'annonce et potentiellement le bannissement de votre compte.
          </div>
          <ul style={styles.ul}>
            <li style={styles.li}><strong>Les annonces en double :</strong> Ne publiez pas plusieurs fois le même article.</li>
            <li style={styles.li}><strong>Les articles illégaux :</strong> Armes, drogues, médicaments sur ordonnance, etc.</li>
            <li style={styles.li}><strong>Les contrefaçons :</strong> Interdiction de vendre de fausses marques en les faisant passer pour des vraies.</li>
            <li style={styles.li}><strong>L'usurpation d'identité :</strong> Utiliser le numéro de téléphone ou les photos de quelqu'un d'autre.</li>
            <li style={styles.li}><strong>Les annonces trompeuses :</strong> Les prix "1 FCFA" ou "Contactez-moi pour le prix" sont découragés pour les produits standards.</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default PublishingRulesPage;
