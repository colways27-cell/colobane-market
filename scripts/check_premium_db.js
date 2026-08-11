import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://onxcfwmwtsotmexzaydk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueGNmd213dHNvdG1leHpheWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTMzNDEsImV4cCI6MjA5NjkyOTM0MX0.dit4WxL-3w2hjFQHzRaRFAiP-d2XJIFekeGFGkX8Qsw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('--- ALL PRODUCTS BY PREMIUM SELLERS ---');
  const premiumSellerIds = [
    "3cea7679-aaf5-4677-8b05-0d50f81ab299", // Paco Gaye
    "c5860b91-ef85-4968-802e-a9b60b750c27", // Saer Gaye
    "c6c8ee00-b771-46a8-9a55-29581a600af1"  // Lena Cisse
  ];

  const { data: prods, error } = await supabase
    .from('products')
    .select('id, title, seller_id, is_boosted, created_at')
    .in('seller_id', premiumSellerIds);

  if (error) console.error('Err:', error);
  else {
    console.log(`Found ${prods.length} products for premium sellers:`);
    prods.forEach(p => {
      console.log(`- Seller [${p.seller_id}] | Product [${p.id}] "${p.title}" | is_boosted: ${p.is_boosted}`);
    });
  }
}

check();
