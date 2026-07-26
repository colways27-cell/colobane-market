import { Link } from 'react-router-dom';
import { MessageCircle, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <style>{`
        .social-icon-hover {
          transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
        }
        .social-icon-hover:hover {
          background-color: var(--primary) !important;
          color: white !important;
          transform: translateY(-3px);
        }
        @media (max-width: 768px) {
          .footer {
            padding: 3.5rem 1.5rem 2rem !important;
            margin-top: 3.5rem !important;
          }
          .footer-container {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            text-align: center !important;
          }
          .footer-brand {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .footer-logo-link {
            justify-content: center !important;
          }
          .footer-logo-img {
            margin: 0 auto !important;
            height: 100px !important;
            border-radius: 20px !important;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
            border: 1px solid var(--border-color);
            background: white;
            padding: 8px;
          }
          .footer-desc {
            max-width: 440px;
            margin: 0.5rem auto 1.2rem !important;
            font-size: 0.88rem !important;
            color: var(--text-muted) !important;
            line-height: 1.5 !important;
          }
          .footer-bottom {
            margin-top: 2.5rem !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>

      <div className="footer-container">
        <div className="footer-column footer-brand">
          <h4 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <Link to="/" className="footer-logo-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img 
                src="/image marque.jpg" 
                alt="Colobane Market" 
                className="footer-logo-img"
                style={{ height: '110px', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)', border: '1px solid var(--border-color)', background: 'white', padding: '8px', transition: 'transform 0.2s' }} 
              />
            </Link>
          </h4>
          <p className="footer-desc" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            La première marketplace sénégalaise pour acheter et vendre la mode, l'électronique et tous vos articles en toute simplicité.
          </p>
          
          <div className="footer-socials" style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
            <a 
              href="https://wa.me/221773713175" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366' }} 
              className="social-icon-hover"
              title="Discuter sur WhatsApp"
            >
              <MessageCircle size={18} />
            </a>
            <a 
              href="tel:+221773713175" 
              style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }} 
              className="social-icon-hover"
              title="Nous appeler"
            >
              <Phone size={18} />
            </a>
          </div>
        </div>
        
        <div className="footer-column hide-on-mobile">
          <h4>Acheter</h4>
          <ul>
            <li><Link to="/explore">Toutes les annonces</Link></li>
            <li><Link to="/category/habillement">Vêtements</Link></li>
            <li><Link to="/category/chaussures">Chaussures</Link></li>
            <li><Link to="/category/telephones-accessoires">Électronique</Link></li>
          </ul>
        </div>
        
        <div className="footer-column hide-on-mobile">
          <h4>Vendre</h4>
          <ul>
            <li><Link to="/publish">Publier une annonce</Link></li>
            <li><Link to="/comment-ca-marche">Comment ça marche ?</Link></li>
            <li><Link to="/regles-publication">Règles de publication</Link></li>
            <li><Link to="/astuces-vente">Astuces de vente</Link></li>
          </ul>
        </div>
        
        <div className="footer-column hide-on-mobile">
          <h4>À propos</h4>
          <ul>
            <li><Link to="/a-propos">Qui sommes-nous ?</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/conditions-generales">Conditions Générales</Link></li>
            <li><Link to="/politique-confidentialite">Politique de confidentialité</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} ColobaneMarket. Tous droits réservés. Fabriqué avec ❤️ au Sénégal.
      </div>
    </footer>
  );
};

export default Footer;
