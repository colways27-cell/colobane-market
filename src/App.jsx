import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import InstallPWA from './components/InstallPWA';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import PublishPage from './pages/PublishPage';
import ExplorePage from './pages/ExplorePage';
import AuthPage from './pages/AuthPage';
import BoutiquesPage from './pages/BoutiquesPage';
import BoutiqueProfilePage from './pages/BoutiqueProfilePage';
import CreateBoutiquePage from './pages/CreateBoutiquePage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import FavoritesPage from './pages/FavoritesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import PublishingRulesPage from './pages/PublishingRulesPage';
import SellingTipsPage from './pages/SellingTipsPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactPage from './pages/ContactPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import SubscriptionPage from './pages/SubscriptionPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <ScrollToTop />
          <Navbar />
          <InstallPWA />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/boutiques" element={<BoutiquesPage />} />
              <Route path="/boutique/:boutiqueId" element={<BoutiqueProfilePage />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route path="/product/:productId" element={<ProductPage />} />
              <Route path="/publish" element={<PublishPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/create-boutique" element={<CreateBoutiquePage />} />
              <Route path="/comment-ca-marche" element={<HowItWorksPage />} />
              <Route path="/regles-publication" element={<PublishingRulesPage />} />
              <Route path="/astuces-vente" element={<SellingTipsPage />} />
              <Route path="/a-propos" element={<AboutUsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/conditions-generales" element={<TermsOfServicePage />} />
              <Route path="/politique-confidentialite" element={<PrivacyPolicyPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
            </Routes>
          </main>
          <Footer />
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
