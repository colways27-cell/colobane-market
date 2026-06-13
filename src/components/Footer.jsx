import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column">
          <h4 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src="/image marque.jpg" alt="Colobane Market" style={{ height: '70px', objectFit: 'contain', borderRadius: '4px', transform: 'scale(1.1)', transformOrigin: 'left' }} />
            </Link>
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            La première marketplace sénégalaise pour acheter et vendre la mode, la fripe et les accessoires en toute simplicité.
          </p>
        </div>
        
        <div className="footer-column">
          <h4>Acheter</h4>
          <ul>
            <li><Link to="/explore">Toutes les annonces</Link></li>
            <li><Link to="/category/habillement">Vêtements</Link></li>
            <li><Link to="/category/chaussures">Chaussures</Link></li>
            <li><Link to="/category/friperie">Friperie</Link></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>Vendre</h4>
          <ul>
            <li><Link to="/publish">Publier une annonce</Link></li>
            <li><Link to="/comment-ca-marche">Comment ça marche ?</Link></li>
            <li><Link to="/regles-publication">Règles de publication</Link></li>
            <li><Link to="/astuces-vente">Astuces de vente</Link></li>
          </ul>
        </div>
        
        <div className="footer-column">
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
