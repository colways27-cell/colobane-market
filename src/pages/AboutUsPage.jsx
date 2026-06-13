import React from 'react';
import Navbar from '../components/Navbar';

const styles = {
  container: { minHeight: '100vh', padding: '100px 20px 80px', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center' },
  card: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '800px', width: '100%' },
  title: { color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', fontFamily: 'var(--font-heading)', borderBottom: '3px solid #f1f5f9', paddingBottom: '1rem' },
  h2: { color: 'var(--secondary)', fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' },
  p: { color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '1rem' }
};

const AboutUsPage = () => {
  return (
    <>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Qui sommes-nous ?</h1>
          
          <p style={styles.p}><strong>Colobane Market</strong> est né d'une idée simple : digitaliser et faciliter le commerce de proximité au Sénégal.</p>
          
          <h2 style={styles.h2}>Notre Mission</h2>
          <p style={styles.p}>Inspirés par l'énergie et la diversité du célèbre marché de Colobane, nous avons voulu recréer cette effervescence en ligne. Notre mission est de donner une vitrine numérique à tous les vendeurs sénégalais, qu'ils soient des professionnels de la friperie, des boutiques d'électronique, ou de simples particuliers souhaitant vider leur armoire.</p>

          <h2 style={styles.h2}>Nos Valeurs</h2>
          <p style={styles.p}><strong>Simplicité :</strong> Pas de processus de paiement compliqués. Vous trouvez ce qui vous plaît, vous contactez le vendeur sur WhatsApp, vous réglez vos affaires entre vous.</p>
          <p style={styles.p}><strong>Confiance :</strong> Nous mettons tout en œuvre pour vérifier les annonces et modérer les contenus illicites afin de garder un environnement sain pour nos acheteurs.</p>
          <p style={styles.p}><strong>Local :</strong> Fièrement conçu et géré depuis le Sénégal, pour le marché sénégalais.</p>
        </div>
      </div>
    </>
  );
};

export default AboutUsPage;
