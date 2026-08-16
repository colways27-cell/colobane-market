const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://onxcfwmwtsotmexzaydk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueGNmd213dHNvdG1leHpheWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTMzNDEsImV4cCI6MjA5NjkyOTM0MX0.dit4WxL-3w2hjFQHzRaRFAiP-d2XJIFekeGFGkX8Qsw');

async function run() {
  const { data, error } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'dynamic_categories').single();
  
  if (error) {
    console.error(error);
    return;
  }
  
  let cats = data.setting_value;
  
  // Find "montres_bijoux" and replace it with two separate ones
  const idx = cats.findIndex(c => c.id === 'montres_bijoux');
  if (idx !== -1) {
    cats.splice(idx, 1, 
      { id: 'montres', icon: 'Watch', label: 'Montres', subcategories: ['Montres Homme', 'Montres Femme'] },
      { id: 'bijoux', icon: 'Gem', label: 'Bijoux', subcategories: ['Colliers', 'Bagues', 'Bracelets', 'Boucles d\'oreilles'] }
    );
  }
  
  // Make sure chaussures uses Footprints (it already does, but let's confirm)
  const chaussures = cats.find(c => c.id === 'chaussures');
  if (chaussures) {
    chaussures.icon = 'Footprints';
  }

  const { error: updateError } = await supabase.from('app_settings').update({ setting_value: cats }).eq('setting_key', 'dynamic_categories');
  if (updateError) {
    console.error(updateError);
  } else {
    console.log("Success");
  }
}

run();
