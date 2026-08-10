import { createClient } from '@supabase/supabase-js';  
import dotenv from 'dotenv';  
dotenv.config();  
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);  
async function test() { 
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:seller_id (account_type, boutique_name, is_verified)
    `)
    .order('is_boosted', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(0, 14);
  console.log('Home.jsx Query Error:', error);
  console.log('Home.jsx Query Data count:', data ? data.length : null);
}  
test();
