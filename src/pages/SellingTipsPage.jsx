import React from 'react';
import Navbar from '../components/Navbar';

const styles = {
  container: { minHeight: '100vh', padding: '100px 20px 80px', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center' },
  card: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '800px', width: '100%' },
  title: { color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', fontFamily: 'var(--font-heading)', borderBottom: '3px solid #f1f5f9', paddingBottom: '1rem' },
  h2: { color: 'var(--secondary)', fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' },
  p: { color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '1rem' },
  ul: { paddingLeft: '20px', marginBottom: '1.5rem', color: 'var(--text-main)', lineHeight: '1.7' },
  li: { marginBottom: '0.5rem' }
};

const SellingTipsPage = () => {
  return (
    <>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Astuces de Vente</h1>
          
          <p style={styles.p}>Vous voulez vendre vos articles rapidement ? Suivez ces conseils simples mais terriblement efficaces pour attirer plus de clients sur Colobane Market.</p>

          <h2 style={styles.h2}>📸 1. Une bonne image vaut 1000 mots</h2>
          <ul style={styles.ul}>
            <li style={styles.li}><strong>La lumière :</strong> Prenez vos photos à la lumière du jour. Évitez les photos sombres ou floues.</li>
            <li style={styles.li}><strong>Le fond :</strong> Placez votre article sur un fond neutre (un drap blanc, une table en bois propre).</li>
            <li style={styles.li}><strong>Les angles :</strong> Prenez plusieurs photos (de face, de dos, et les détails importants).</li>
          </ul>

          <h2 style={styles.h2}>✍️ 2. Une description qui donne envie</h2>
          <ul style={styles.ul}>
            <li style={styles.li}>Ne vous contentez pas de dire "A Vendre". Expliquez pourquoi l'article est génial.</li>
            <li style={styles.li}>Précisez les dimensions, la taille, la marque et la couleur.</li>
            <li style={styles.li}><strong>Soyez honnête :</strong> S'il y a une petite égratignure, dites-le. Les acheteurs apprécient la transparence.</li>
          </ul>

          <h2 style={styles.h2}>💰 3. Fixez un prix juste</h2>
          <ul style={styles.ul}>
            <li style={styles.li}>Regardez à quel prix les autres vendeurs proposent des articles similaires sur la plateforme.</li>
            <li style={styles.li}>Si vous êtes ouvert à la négociation, vous pouvez le mentionner dans la description.</li>
          </ul>

          <h2 style={styles.h2}>⚡ 4. Soyez hyper réactif</h2>
          <ul style={styles.ul}>
            <li style={styles.li}>Lorsqu'un client vous contacte sur WhatsApp, répondez-lui dans les minutes qui suivent si possible.</li>
            <li style={styles.li}>Un client qui attend est un client qui part acheter ailleurs !</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default SellingTipsPage;
