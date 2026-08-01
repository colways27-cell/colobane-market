

const styles = {
  container: { minHeight: '100vh', padding: '100px 20px 80px', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center' },
  card: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '800px', width: '100%' },
  title: { color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', fontFamily: 'var(--font-heading)', borderBottom: '3px solid #f1f5f9', paddingBottom: '1rem' },
  h2: { color: 'var(--secondary)', fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' },
  p: { color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '1rem' },
  ul: { paddingLeft: '20px', marginBottom: '1.5rem', color: 'var(--text-main)', lineHeight: '1.7' },
  li: { marginBottom: '0.5rem' }
};

const HowItWorksPage = () => {
  return (
    <>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Comment ça marche ?</h1>
          
          <p style={styles.p}>Bienvenue sur Colobane Market ! Que vous soyez là pour acheter ou vendre, notre plateforme a été conçue pour être la plus simple et la plus directe possible.</p>

          <h2 style={styles.h2}>🛒 Pour les Acheteurs</h2>
          <ul style={styles.ul}>
            <li style={styles.li}><strong>Trouvez ce que vous cherchez :</strong> Parcourez nos catégories (Friperie, Électronique, Immobilier, etc.) ou utilisez la barre de recherche.</li>
            <li style={styles.li}><strong>Contactez directement le vendeur :</strong> Cliquez sur le bouton "Contacter sur WhatsApp" ou "Appeler" sur la fiche du produit. Pas d'intermédiaire, vous discutez directement avec le propriétaire !</li>
            <li style={styles.li}><strong>Négociez et Finalisez :</strong> Mettez-vous d'accord sur le prix et le lieu de livraison (ou de rendez-vous) avec le vendeur.</li>
          </ul>

          <h2 style={styles.h2}>🏪 Pour les Vendeurs</h2>
          <ul style={styles.ul}>
            <li style={styles.li}><strong>Créez un compte :</strong> C'est gratuit et ça prend moins d'une minute.</li>
            <li style={styles.li}><strong>Prenez de belles photos :</strong> C'est le secret pour vendre vite ! Ajoutez jusqu'à 5 photos de votre article.</li>
            <li style={styles.li}><strong>Publiez votre annonce :</strong> Remplissez le titre, le prix et une petite description.</li>
            <li style={styles.li}><strong>Répondez aux clients :</strong> Les acheteurs intéressés vous contacteront directement sur votre numéro WhatsApp ou par appel. Soyez réactif !</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default HowItWorksPage;
