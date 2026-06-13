import React from 'react';
import Navbar from '../components/Navbar';

const styles = {
  container: { minHeight: '100vh', padding: '100px 20px 80px', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center' },
  card: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '800px', width: '100%' },
  title: { color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', fontFamily: 'var(--font-heading)', borderBottom: '3px solid #f1f5f9', paddingBottom: '1rem' },
  h2: { color: 'var(--secondary)', fontSize: '1.2rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' },
  p: { color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1rem' }
};

const TermsOfServicePage = () => {
  return (
    <>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Conditions Générales d'Utilisation</h1>
          
          <p style={styles.p}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

          <h2 style={styles.h2}>1. Rôle de Colobane Market</h2>
          <p style={styles.p}>Colobane Market est une plateforme de mise en relation entre vendeurs et acheteurs. Nous n'intervenons pas dans les transactions, ni dans les paiements, ni dans les livraisons. La vente se fait directement et exclusivement entre l'acheteur et le vendeur.</p>

          <h2 style={styles.h2}>2. Responsabilité de l'utilisateur</h2>
          <p style={styles.p}>En publiant une annonce, vous vous engagez à ce que celle-ci soit véridique, qu'elle ne soit pas trompeuse et qu'elle respecte les lois en vigueur au Sénégal. Les contrefaçons, les biens volés et les produits dangereux sont formellement interdits.</p>

          <h2 style={styles.h2}>3. Litiges</h2>
          <p style={styles.p}>Puisque Colobane Market n'est pas partie prenante dans la transaction, nous ne pourrons être tenus responsables en cas de litige entre un acheteur et un vendeur. Nous vous conseillons de toujours vérifier la marchandise avant de payer, idéalement lors d'une rencontre dans un lieu public.</p>

          <h2 style={styles.h2}>4. Modération</h2>
          <p style={styles.p}>L'équipe de Colobane Market se réserve le droit de supprimer sans préavis toute annonce jugée non conforme, frauduleuse ou inappropriée, ainsi que de bannir les utilisateurs ne respectant pas ces conditions.</p>
        </div>
      </div>
    </>
  );
};

export default TermsOfServicePage;
