import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, ShieldCheck, Heart, Users, ArrowRight, MessageCircle } from 'lucide-react';

const AboutUsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .about-container {
          min-height: 100vh;
          padding: 100px 24px 100px;
          background: radial-gradient(circle at 50% 0%, rgba(190, 18, 60, 0.03) 0%, var(--bg-color) 70%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 60px;
        }
        
        .about-hero {
          width: 100%;
          max-width: 1100px;
          text-align: center;
          padding: 60px 40px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.5));
          backdrop-filter: blur(20px);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }

        .about-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(190, 18, 60, 0.05) 0%, transparent 60%);
          pointer-events: none;
        }

        .about-badge {
          background: var(--primary-light);
          color: var(--primary);
          padding: 8px 16px;
          border-radius: var(--radius-pill);
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(190, 18, 60, 0.1);
        }

        .about-title {
          font-family: var(--font-heading);
          font-size: 3rem;
          font-weight: 800;
          color: var(--secondary);
          line-height: 1.15;
          max-width: 800px;
        }

        .about-title span {
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .about-subtitle {
          font-size: 1.15rem;
          color: var(--text-muted);
          max-width: 650px;
          line-height: 1.6;
        }

        /* Section Layouts */
        .about-section {
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }

        .about-visual {
          width: 100%;
          height: 380px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, #be123c, #881337);
          box-shadow: var(--shadow-glass);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          color: white;
          position: relative;
          overflow: hidden;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .about-visual::after {
          content: '🇸🇳';
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 2.5rem;
          opacity: 0.2;
        }

        .about-visual-circle {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          top: -100px;
          left: -100px;
        }

        .about-story {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .about-story h2 {
          font-family: var(--font-heading);
          font-size: 1.8rem;
          color: var(--secondary);
          font-weight: 800;
        }

        .about-story p {
          color: var(--text-main);
          font-size: 1.05rem;
          line-height: 1.7;
        }

        /* Statistics Grid */
        .about-stats {
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .stat-card {
          background: white;
          padding: 32px 24px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          transition: transform 0.3s var(--transition-spring), box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-md);
          border-color: rgba(190, 18, 60, 0.2);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-number {
          font-family: var(--font-heading);
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--secondary);
          margin-top: 4px;
        }

        .stat-label {
          font-size: 0.95rem;
          color: var(--text-muted);
          font-weight: 500;
          line-height: 1.4;
        }

        /* Values Grid */
        .values-section {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          align-items: center;
        }

        .values-header {
          text-align: center;
        }

        .values-header h2 {
          font-family: var(--font-heading);
          font-size: 2rem;
          color: var(--secondary);
          font-weight: 800;
          margin-bottom: 8px;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          width: 100%;
        }

        .value-card {
          background: linear-gradient(180deg, white 0%, rgba(250, 250, 249, 0.8) 100%);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: var(--transition);
        }

        .value-card:hover {
          border-color: var(--primary);
          background: white;
          box-shadow: var(--shadow-md);
        }

        .value-card h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          color: var(--secondary);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .value-card p {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* CTA Section */
        .about-cta {
          width: 100%;
          max-width: 1100px;
          padding: 60px 40px;
          background: var(--secondary);
          border-radius: var(--radius-lg);
          color: white;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          box-shadow: var(--shadow-md);
          position: relative;
          overflow: hidden;
        }

        .about-cta::before {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(190, 18, 60, 0.15) 0%, transparent 70%);
          bottom: -200px;
          right: -100px;
        }

        .about-cta h2 {
          font-family: var(--font-heading);
          font-size: 2.2rem;
          font-weight: 800;
          z-index: 1;
        }

        .about-cta p {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
          max-width: 600px;
          line-height: 1.6;
          z-index: 1;
        }

        .cta-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
          z-index: 1;
          width: 100%;
        }

        .btn-primary {
          background: var(--primary-gradient);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: var(--radius-pill);
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(190, 18, 60, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(190, 18, 60, 0.4);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 14px 28px;
          border-radius: var(--radius-pill);
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: var(--transition);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        /* Responsive Layouts */
        @media (max-width: 900px) {
          .about-section {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          
          .about-hero {
            padding: 40px 24px;
          }
          
          .about-title {
            font-size: 2.2rem;
          }
          
          .about-visual {
            height: 280px;
          }
        }
      `}</style>

      <div className="about-container">
        
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-badge">
            <Sparkles size={14} /> Qui sommes-nous ?
          </div>
          <h1 className="about-title">
            L'esprit de <span>Colobane</span>, réinventé en ligne
          </h1>
          <p className="about-subtitle">
            Colobane Market digitalise et dynamise le commerce de proximité et de friperie au Sénégal pour connecter directement acheteurs et vendeurs.
          </p>
        </section>

        {/* Story & Visual Section */}
        <section className="about-section">
          <div className="about-visual">
            <div className="about-visual-circle"></div>
            <ShoppingBag size={64} style={{ marginBottom: '16px', opacity: 0.95 }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: '800', margin: '0 0 10px' }}>
              Colobane Market
            </h3>
            <p style={{ fontSize: '0.95rem', opacity: 0.9, maxWidth: '320px', lineHeight: '1.5' }}>
              La vitrine digitale des commerçants sénégalais.
            </p>
          </div>

          <div className="about-story">
            <h2>Notre Histoire</h2>
            <p>
              Inspirés par l'incroyable vitalité et la diversité du célèbre <strong>marché de Colobane</strong> à Dakar, nous avons voulu recréer cette effervescence commerciale unique dans un format numérique moderne.
            </p>
            <p>
              Notre plateforme est née d'un constat simple : la plupart des vendeurs locaux ont besoin d'une visibilité directe, sans barrière technique ni frais exorbitants. Nous avons donc bâti un espace épuré où professionnels de la mode, vendeurs d'électronique et particuliers peuvent exposer leurs produits en quelques clics.
            </p>
          </div>
        </section>

        {/* Impact Numbers / Stats */}
        <section className="about-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-number">500+</div>
            <div className="stat-label">Boutiques créées et certifiées sur la plateforme</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <ShoppingBag size={24} />
            </div>
            <div className="stat-number">10k+</div>
            <div className="stat-label">Annonces et produits publiés par les commerçants</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <ShieldCheck size={24} />
            </div>
            <div className="stat-number">100%</div>
            <div className="stat-label">Conçu au Sénégal, optimisé pour l'économie locale</div>
          </div>
        </section>

        {/* Core Values */}
        <section className="values-section">
          <div className="values-header">
            <h2>Nos Valeurs Fondamentales</h2>
            <p style={{ color: 'var(--text-muted)' }}>Ce qui nous guide au quotidien pour vous offrir la meilleure expérience.</p>
          </div>

          <div className="values-grid">
            <div className="value-card">
              <h3>
                <MessageCircle size={20} style={{ color: 'var(--whatsapp-color)' }} /> Simplicité Absolue
              </h3>
              <p>
                Pas d'intermédiaires, pas de commissions sur vos ventes, ni de parcours de paiement complexes. Un coup de cœur ? Vous contactez directement le vendeur sur WhatsApp d'un simple clic et finalisez l'échange en toute liberté.
              </p>
            </div>

            <div className="value-card">
              <h3>
                <ShieldCheck size={20} style={{ color: 'var(--primary)' }} /> Confiance & Transparence
              </h3>
              <p>
                Nous mettons en place un système de certification des boutiques et de modération active des annonces pour que vous puissiez effectuer vos transactions dans un cadre sécurisé et transparent.
              </p>
            </div>

            <div className="value-card">
              <h3>
                <Heart size={20} style={{ color: '#ec4899' }} /> Économie Circulaire
              </h3>
              <p>
                En encourageant la revente d'articles de friperie et de seconde main, nous participons activement à un modèle économique plus durable, écologique et accessible à tous les budgets.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="about-cta">
          <h2>Prêt à propulser vos affaires ?</h2>
          <p>
            Rejoignez la communauté dynamique de Colobane Market, que ce soit pour dénicher la bonne affaire ou pour lancer votre boutique numérique en quelques secondes.
          </p>
          <div className="cta-buttons">
            <button className="btn-primary" onClick={() => navigate('/explore')}>
              Explorer les annonces <ArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={() => navigate('/publish')}>
              Publier un article
            </button>
          </div>
        </section>

      </div>
    </>
  );
};

export default AboutUsPage;
