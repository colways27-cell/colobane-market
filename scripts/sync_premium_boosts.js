import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://onxcfwmwtsotmexzaydk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueGNmd213dHNvdG1leHpheWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTMzNDEsImV4cCI6MjA5NjkyOTM0MX0.dit4WxL-3w2hjFQHzRaRFAiP-d2XJIFekeGFGkX8Qsw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sync() {
  console.log('🔑 Connexion en tant qu\'Admin...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@colobanemarket.com',
    password: 'Bayeniass1975'
  });

  if (authErr) {
    console.error('⚠️ Connexion admin échouée, essai sans auth:', authErr.message);
  } else {
    console.log('✅ Connecté en tant qu\'Admin (', authData.user.id, ')');
  }

  console.log('🚀 Synchronisation des rôles Admin et des annonces Premium...');

  // 1. Définir is_admin = true pour les comptes Saer Gaye & Admin
  const adminProfileIds = [
    'c5860b91-ef85-4968-802e-a9b60b750c27',
    '40a63605-fbce-472a-8fe9-65552eca8cd1',
    'c8f28a8e-c467-4ac3-a2b9-30d561274bf2'
  ];

  const { error: adminErr } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .in('id', adminProfileIds);

  if (adminErr) {
    console.error('❌ Erreur lors de la mise à jour des rôles admin:', adminErr.message);
  } else {
    console.log('✅ Profils Saer Gaye et Admin mis à jour avec is_admin = true !');
  }

  // 2. Trouver tous les vendeurs avec un forfait premium actif
  const { data: premiumProfiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, subscription_plan')
    .or('subscription_plan.eq.premium,subscription_plan.eq.forfait_premium');

  if (profErr) {
    console.error('❌ Erreur lors de la recherche des profils premium:', profErr.message);
    return;
  }

  const premiumSellerIds = premiumProfiles ? premiumProfiles.map(p => p.id) : [];
  console.log(`📋 ${premiumSellerIds.length} profils Premium trouvés:`, premiumProfiles?.map(p => p.full_name || p.id).join(', '));

  if (premiumSellerIds.length > 0) {
    // Premier essai: update global
    const { data: updatedProds, error: boostErr } = await supabase
      .from('products')
      .update({ is_boosted: true })
      .in('seller_id', premiumSellerIds)
      .select('id, title, seller_id');

    if (boostErr) {
      console.error('❌ Erreur lors du boost des annonces:', boostErr.message);
    } else {
      console.log(`⚡ ${updatedProds?.length || 0} annonces passées en is_boosted = true !`);
      updatedProds?.forEach(p => console.log(`  - [${p.id}] ${p.title}`));
    }

    // Deuxième essai produit par produit si RLS filtre
    const { data: allProds } = await supabase
      .from('products')
      .select('id, title, seller_id, is_boosted')
      .in('seller_id', premiumSellerIds);
    
    console.log(`🔍 Vérification finale de ${allProds?.length || 0} produits premium:`);
    for (const p of (allProds || [])) {
      if (!p.is_boosted) {
        const { error: indErr } = await supabase
          .from('products')
          .update({ is_boosted: true })
          .eq('id', p.id);
        if (indErr) console.error(`  ❌ Failed to boost ${p.title}:`, indErr.message);
        else console.log(`  ✅ Boosté individuellement: ${p.title}`);
      } else {
        console.log(`  ⚡ Déjà boosté: ${p.title}`);
      }
    }
  }

  console.log('🎉 Synchronisation terminée avec succès !');
}

sync();
