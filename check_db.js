import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://onxcfwmwtsotmexzaydk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueGNmd213dHNvdG1leHpheWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTMzNDEsImV4cCI6MjA5NjkyOTM0MX0.dit4WxL-3w2hjFQHzRaRFAiP-d2XJIFekeGFGkX8Qsw');
async function check() { 
  const {data} = await supabase.from('profiles').select('*').limit(1); 
  console.log(data ? Object.keys(data[0]) : "No data"); 
}
check();
