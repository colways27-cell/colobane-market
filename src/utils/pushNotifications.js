import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const checkNotificationSupport = () => {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
};

export const getNotificationPermissionState = () => {
  if (!checkNotificationSupport()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (userId = null) => {
  if (!checkNotificationSupport()) {
    toast.error("Votre navigateur ne supporte pas les notifications push.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('colobane_push_enabled', 'true');
      toast.success("🔔 Notifications activées avec succès !");
      
      // Déclencher une notification de bienvenue
      await sendSystemNotification(
        "👋 Bienvenue sur Colobane Market !",
        {
          body: "Vous recevrez désormais les alertes instantanées (nouvelles demandes, validation de boosts, etc.).",
          url: "/profile",
          tag: "welcome-notif"
        }
      );

      if (userId) {
        await saveNotificationPreferenceInSupabase(userId, true);
      }
      return true;
    } else if (permission === 'denied') {
      localStorage.setItem('colobane_push_enabled', 'false');
      toast.error("Notifications bloquées dans les paramètres de votre navigateur.");
      return false;
    }
  } catch (err) {
    console.error("Error requesting notification permission:", err);
  }
  return false;
};

export const sendSystemNotification = async (title, options = {}) => {
  if (!checkNotificationSupport() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions = {
    body: options.body || "Vous avez une nouvelle notification ColobaneMarket.",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [200, 100, 200],
    data: { url: options.url || '/' },
    tag: options.tag || 'general-notification'
  };

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration && registration.showNotification) {
      await registration.showNotification(title, defaultOptions);
      return true;
    }
  } catch (_e) {
    // Fallback direct si le Service Worker n'est pas prêt
  }

  try {
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.warn("Could not send system notification:", err);
    return false;
  }
};

export const saveNotificationPreferenceInSupabase = async (userId, enabled) => {
  if (!userId) return;
  try {
    await supabase
      .from('profiles')
      .update({
        push_notifications_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  } catch (err) {
    console.warn("Could not save push preference to Supabase:", err);
  }
};
