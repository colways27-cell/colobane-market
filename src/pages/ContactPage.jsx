import React from 'react';
import Navbar from '../components/Navbar';

const styles = {
  container: { minHeight: '100vh', padding: '100px 20px 80px', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center' },
  card: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '800px', width: '100%', textAlign: 'center' },
  title: { color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', fontFamily: 'var(--font-heading)', borderBottom: '3px solid #f1f5f9', paddingBottom: '1rem' },
  p: { color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '1.5rem' },
  contactBox: { background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
  link: { color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', fontSize: '1.2rem' }
};

const ContactPage = () => {
  return (
    <>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Contactez-nous</h1>
          
          <p style={styles.p}>Une question ? Un problème avec une annonce ? Ou vous souhaitez simplement nous faire une suggestion d'amélioration ? L'équipe de Colobane Market est là pour vous !</p>

          <div style={styles.contactBox}>
            <span style={{ fontSize: '2rem' }}>📱</span>
            <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Assistance WhatsApp</span>
            <a href="https://wa.me/221773713175" target="_blank" rel="noopener noreferrer" style={styles.link}>
              +221 77 371 31 75
            </a>
          </div>

          <div style={styles.contactBox}>
            <span style={{ fontSize: '2rem' }}>📧</span>
            <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Email</span>
            <a href="mailto:colobanemarket9@gmail.com" style={styles.link}>
              colobanemarket9@gmail.com
            </a>
          </div>

          <p style={styles.p} style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Nous répondons généralement en moins de 24 heures (jours ouvrables).
          </p>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
