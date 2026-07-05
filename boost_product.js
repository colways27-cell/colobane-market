import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://onxcfwmwtsotmexzaydk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueGNmd213dHNvdG1leHpheWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTMzNDEsImV4cCI6MjA5NjkyOTM0MX0.dit4WxL-3w2hjFQHzRaRFAiP-d2XJIFekeGFGkX8Qsw'
);

async function main() {
  // 1. Voir tous les produits
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, title, is_boosted')
    .order('created_at', { ascending: false })
    .limit(10);

  if (fetchError) {
    console.error('Erreur fetch:', fetchError.message);
    process.exit(1);
  }

  console.log(`\n📦 ${products.length} produits trouvés :`);
  products.forEach(p => {
    console.log(`  - [${p.id}] ${p.title} | boosted: ${p.is_boosted}`);
  });

  if (products.length === 0) {
    console.log('❌ Aucun produit en base !');
    process.exit(0);
  }

  // 2. Booster les 3 premiers produits
  const idsToBoost = products.slice(0, 3).map(p => p.id);
  console.log(`\n⚡ Boosting les produits: ${idsToBoost.join(', ')}`);

  const { error: updateError } = await supabase
    .from('products')
    .update({ is_boosted: true })
    .in('id', idsToBoost);

  if (updateError) {
    console.error('Erreur update:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Produits boostés avec succès !');

  // 3. Vérification
  const { data: boosted } = await supabase
    .from('products')
    .select('id, title, is_boosted')
    .eq('is_boosted', true);

  console.log(`\n🌟 Produits actuellement boostés: ${boosted?.length || 0}`);
  boosted?.forEach(p => console.log(`  ⚡ [${p.id}] ${p.title}`));
}

main();
