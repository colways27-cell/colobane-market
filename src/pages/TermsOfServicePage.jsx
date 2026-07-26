import React from 'react';

const styles = {
  container: { minHeight: '100vh', padding: '100px 20px 80px', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center' },
  card: { background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 25px rgba(0,0,0,0.06)', maxWidth: '850px', width: '100%' },
  title: { color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', borderBottom: '3px solid #f1f5f9', paddingBottom: '1rem' },
  subtitle: { color: '#64748B', fontSize: '0.9rem', fontWeight: '600', marginBottom: '2rem' },
  h2: { color: 'var(--secondary)', fontSize: '1.25rem', fontWeight: '800', marginTop: '2rem', marginBottom: '0.8rem', borderLeft: '4px solid var(--primary)', paddingLeft: '10px' },
  p: { color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.75', marginBottom: '1rem' },
  ul: { paddingLeft: '22px', marginBottom: '1.5rem', color: 'var(--text-main)', lineHeight: '1.75' },
  li: { marginBottom: '0.6rem' }
};

const TermsOfServicePage = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Conditions Générales d'Utilisation (CGU)</h1>
        <div style={styles.subtitle}>COLOBANEMARKET — Dernière mise à jour : Juillet 2026</div>

        <h2 style={styles.h2}>Article 1 — Présentation du service</h2>
        <p style={styles.p}>ColobaneMarket est une plateforme de mise en relation entre particuliers et professionnels souhaitant acheter et vendre des biens et services au Sénégal. ColobaneMarket n'est pas vendeur, ne stocke aucun produit, et n'intervient pas dans les transactions entre utilisateurs. Toute transaction se fait directement entre acheteur et vendeur, sous leur entière responsabilité.</p>

        <h2 style={styles.h2}>Article 2 — Acceptation des conditions</h2>
        <p style={styles.p}>L'utilisation de ColobaneMarket implique l'acceptation pleine et entière des présentes CGU. Tout utilisateur qui s'inscrit certifie avoir lu, compris et accepté ces conditions. L'acceptation est enregistrée avec horodatage lors de l'inscription.</p>

        <h2 style={styles.h2}>Article 3 — Inscription et compte utilisateur</h2>
        <p style={styles.p}>Pour publier une annonce ou contacter un vendeur, l'utilisateur doit créer un compte en fournissant des informations exactes et à jour. L'utilisateur est seul responsable de la confidentialité de ses identifiants. ColobaneMarket se réserve le droit de suspendre ou supprimer tout compte dont les informations sont fausses ou qui viole les présentes CGU, sans préavis et sans indemnité.</p>

        <h2 style={styles.h2}>Article 4 — Publication d'annonces</h2>
        <p style={styles.p}>L'utilisateur s'engage à :</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Être propriétaire ou avoir le droit de vendre les articles publiés ;</li>
          <li style={styles.li}>Fournir des informations exactes sur l'état, le prix et la description des articles ;</li>
          <li style={styles.li}>Utiliser uniquement ses propres photos ou des photos dont il détient les droits ;</li>
          <li style={styles.li}>Ne publier qu'un seul article par annonce ;</li>
          <li style={styles.li}>Respecter les limites de publication selon son abonnement.</li>
        </ul>

        <h2 style={styles.h2}>Article 5 — Contenu interdit</h2>
        <p style={styles.p}>Il est strictement interdit de publier sur ColobaneMarket :</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Des annonces à caractère sexuel, pornographique ou prostitutionnel ;</li>
          <li style={styles.li}>Des armes, munitions ou objets dangereux ;</li>
          <li style={styles.li}>Des drogues, stupéfiants ou médicaments sans ordonnance ;</li>
          <li style={styles.li}>Des faux documents, billets contrefaits ou produits contrefaits ;</li>
          <li style={styles.li}>Des animaux protégés ou produits issus d'espèces protégées ;</li>
          <li style={styles.li}>Des produits cosmétiques interdits au Sénégal (crèmes au mercure, hydroquinone forte) ;</li>
          <li style={styles.li}>Des annonces frauduleuses, arnaques ou escroqueries de toute nature ;</li>
          <li style={styles.li}>Des services de maraboutage frauduleux ou multiplication d'argent ;</li>
          <li style={styles.li}>Tout contenu illégal selon la législation sénégalaise en vigueur.</li>
        </ul>
        <p style={styles.p}>Tout contenu interdit détecté entraîne la suppression immédiate de l'annonce et la suspension du compte. ColobaneMarket se réserve le droit de signaler tout contenu illicite aux autorités compétentes.</p>

        <h2 style={styles.h2}>Article 6 — Responsabilité de ColobaneMarket</h2>
        <p style={styles.p}>ColobaneMarket agit en qualité d'hébergeur de contenu au sens de la loi sénégalaise. À ce titre :</p>
        <ul style={styles.ul}>
          <li style={styles.li}>ColobaneMarket n'est pas responsable du contenu publié par les utilisateurs ;</li>
          <li style={styles.li}>ColobaneMarket ne garantit pas l'exactitude des annonces, la qualité des produits, ni la bonne exécution des transactions ;</li>
          <li style={styles.li}>ColobaneMarket ne peut être tenu responsable des litiges entre acheteurs et vendeurs ;</li>
          <li style={styles.li}>ColobaneMarket n'est pas partie aux transactions effectuées entre utilisateurs ;</li>
          <li style={styles.li}>ColobaneMarket met en œuvre tous les moyens raisonnables pour modérer les contenus illicites signalés.</li>
        </ul>

        <h2 style={styles.h2}>Article 7 — Transactions et paiements</h2>
        <p style={styles.p}>Les transactions se font directement entre acheteur et vendeur. ColobaneMarket ne perçoit aucune commission sur les ventes entre particuliers. Les abonnements et boosts sont des services proposés par ColobaneMarket aux vendeurs souhaitant augmenter leur visibilité. ColobaneMarket ne garantit pas les résultats obtenus grâce aux abonnements.</p>

        <h2 style={styles.h2}>Article 8 — Signalement</h2>
        <p style={styles.p}>Tout utilisateur peut signaler une annonce ou un vendeur suspect via le menu contextuel disponible sur chaque annonce. ColobaneMarket s'engage à examiner tout signalement dans un délai raisonnable et à prendre les mesures appropriées.</p>

        <h2 style={styles.h2}>Article 9 — Propriété intellectuelle</h2>
        <p style={styles.p}>Le nom ColobaneMarket, son logo, son design et son code sont la propriété exclusive de SG GlobalBusiness. Toute reproduction ou utilisation sans autorisation est interdite. En publiant des photos sur ColobaneMarket, l'utilisateur accorde à ColobaneMarket une licence non exclusive d'utilisation de ces images à des fins de promotion du service.</p>

        <h2 style={styles.h2}>Article 10 — Suspension et suppression de compte</h2>
        <p style={styles.p}>ColobaneMarket se réserve le droit de suspendre ou supprimer sans préavis tout compte qui :</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Publie du contenu interdit ;</li>
          <li style={styles.li}>Reçoit 3 signalements ou plus validés par l'équipe de modération ;</li>
          <li style={styles.li}>Utilise la plateforme à des fins frauduleuses ;</li>
          <li style={styles.li}>Fournit de fausses informations lors de l'inscription.</li>
        </ul>

        <h2 style={styles.h2}>Article 11 — Modification des CGU</h2>
        <p style={styles.p}>ColobaneMarket se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par notification sur la plateforme. La poursuite de l'utilisation du service vaut acceptation des nouvelles conditions.</p>

        <h2 style={styles.h2}>Article 12 — Droit applicable et juridiction</h2>
        <p style={styles.p}>Les présentes CGU sont soumises au droit sénégalais. Tout litige relatif à leur interprétation ou exécution sera soumis aux tribunaux compétents de Dakar, Sénégal.</p>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
