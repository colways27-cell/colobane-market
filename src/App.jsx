import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPWA from './components/InstallPWA';
import PushNotificationPrompt from './components/PushNotificationPrompt';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import PromoBanner from './components/PromoBanner';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import GlobalAnnouncement from './components/GlobalAnnouncement';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';

// Reset chunk reload flag if the application loads successfully
try {
  window.sessionStorage.removeItem('chunk-failed-reloaded');
} catch (_e) {
  // Ignore sessionStorage error
}

// Wrapper to handle dynamic import failures safely by purging caches and hard-redirecting
const lazyWithRetry = (componentImport) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Error loading lazy page, purging cache and retrying:", error);
      
      const hasReloaded = window.sessionStorage.getItem('chunk-failed-reloaded');
      if (!hasReloaded) {
        window.sessionStorage.setItem('chunk-failed-reloaded', 'true');
        try {
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let reg of registrations) reg.unregister();
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            for (let key of keys) await caches.delete(key);
          }
        } catch (_e) {}

        const cleanUrl = window.location.origin + window.location.pathname + '?v=' + Date.now();
        window.location.href = cleanUrl;
      }
      return { default: () => () => null };
    }
  });
};

// ─── Pages principales ────────────────────────────────────────────────────────
const ExplorePage        = lazyWithRetry(() => import('./pages/ExplorePage'));
const ProductPage        = lazyWithRetry(() => import('./pages/ProductPage'));
const ReelsPage          = lazyWithRetry(() => import('./pages/ReelsPage'));
const AuthPage           = lazyWithRetry(() => import('./pages/AuthPage'));

// Pages secondaires
const CategoryPage       = lazyWithRetry(() => import('./pages/CategoryPage'));
const BoutiquesPage      = lazyWithRetry(() => import('./pages/BoutiquesPage'));
const BoutiqueProfilePage= lazyWithRetry(() => import('./pages/BoutiqueProfilePage'));
const CreateBoutiquePage = lazyWithRetry(() => import('./pages/CreateBoutiquePage'));
const ProfilePage        = lazyWithRetry(() => import('./pages/ProfilePage'));
const PublishPage        = lazyWithRetry(() => import('./pages/PublishPage'));
const EditProductPage    = lazyWithRetry(() => import('./pages/EditProductPage'));
const CartPage           = lazyWithRetry(() => import('./pages/CartPage'));
const FavoritesPage      = lazyWithRetry(() => import('./pages/FavoritesPage'));
const SubscriptionPage   = lazyWithRetry(() => import('./pages/SubscriptionPage'));
const CertificationPage  = lazyWithRetry(() => import('./pages/CertificationPage'));
const BuyerRequestsPage  = lazyWithRetry(() => import('./pages/BuyerRequestsPage'));

// Pages statiques (rarement visitées)
const HowItWorksPage     = lazyWithRetry(() => import('./pages/HowItWorksPage'));
const PublishingRulesPage= lazyWithRetry(() => import('./pages/PublishingRulesPage'));
const SellingTipsPage    = lazyWithRetry(() => import('./pages/SellingTipsPage'));
const AboutUsPage        = lazyWithRetry(() => import('./pages/AboutUsPage'));
const ContactPage        = lazyWithRetry(() => import('./pages/ContactPage'));
const TermsOfServicePage = lazyWithRetry(() => import('./pages/TermsOfServicePage'));
const PrivacyPolicyPage  = lazyWithRetry(() => import('./pages/PrivacyPolicyPage'));
const NotFoundPage       = lazyWithRetry(() => import('./pages/NotFoundPage'));

// Admin — chargé séparément (le plus lourd)
const AdminPage          = lazyWithRetry(() => import('./pages/AdminPage'));

// ─── Composant de chargement ─────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      border: '3px solid #F1F5F9',
      borderTop: '3px solid var(--primary, #8a1c1c)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Layout principal ────────────────────────────────────────────────────────
const LayoutWrapper = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/adminsaer') || location.pathname.startsWith('/backoffice');

  if (isAdminRoute) {
    return (
      <div className="admin-container" style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
            <Route path="/adminsaer" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
            <Route path="/backoffice" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <div className="app-container">
      <ScrollToTop />
      <PromoBanner />
      <Navbar />
      <InstallPWA />
      <PushNotificationPrompt />
      <GlobalAnnouncement />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"                          element={<Home />} />
            <Route path="/reels"                     element={<ReelsPage />} />
            <Route path="/wutal-ma"                  element={<BuyerRequestsPage />} />
            <Route path="/explore"                   element={<ExplorePage />} />
            <Route path="/boutiques"                 element={<BoutiquesPage />} />
            <Route path="/boutique/:boutiqueId"      element={<BoutiqueProfilePage />} />
            <Route path="/category/:categoryId"      element={<CategoryPage />} />
            <Route path="/product/:productId"        element={<ProductPage />} />
            <Route path="/publish"                   element={<ProtectedRoute><PublishPage /></ProtectedRoute>} />
            <Route path="/edit-product/:productId"   element={<ProtectedRoute><EditProductPage /></ProtectedRoute>} />
            <Route path="/profile"                   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/cart"                      element={<CartPage />} />
            <Route path="/favorites"                 element={<FavoritesPage />} />
            <Route path="/auth"                      element={<AuthPage />} />
            <Route path="/create-boutique"           element={<ProtectedRoute><CreateBoutiquePage /></ProtectedRoute>} />
            <Route path="/comment-ca-marche"         element={<HowItWorksPage />} />
            <Route path="/regles-publication"        element={<PublishingRulesPage />} />
            <Route path="/astuces-vente"             element={<SellingTipsPage />} />
            <Route path="/a-propos"                  element={<AboutUsPage />} />
            <Route path="/contact"                   element={<ContactPage />} />
            <Route path="/conditions-generales"      element={<TermsOfServicePage />} />
            <Route path="/politique-confidentialite" element={<PrivacyPolicyPage />} />
            <Route path="/subscription"              element={<SubscriptionPage />} />
            <Route path="/certification"             element={<CertificationPage />} />
            <Route path="*"                          element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

import OneSignal from 'react-onesignal';

function App() {
  useEffect(() => {
    // Initialisation de OneSignal
    const initOneSignal = async () => {
      try {
        const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
        if (appId) {
          await OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
              enable: false, 
            },
            serviceWorkerParam: { scope: "/" },
            serviceWorkerPath: "sw.js"
          });
          
          // Si l'utilisateur avait déjà accepté les notifications avant OneSignal, on l'inscrit automatiquement
          if (window.Notification && Notification.permission === 'granted') {
            try {
              await OneSignal.User.PushSubscription.optIn();
            } catch(e) {}
          }
        }
      } catch (e) {
        console.error("OneSignal init error:", e);
      }
    };
    initOneSignal();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" />
        <LayoutWrapper />
      </Router>
    </AuthProvider>
  );
}

export default App;
