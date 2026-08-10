const https = require('https');

const SUPABASE_URL = 'onxcfwmwtsotmexzaydk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueGNmd213dHNvdG1leHpheWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTMzNDEsImV4cCI6MjA5NjkyOTM0MX0.dit4WxL-3w2hjFQHzRaRFAiP-d2XJIFekeGFGkX8Qsw';

const ids = [
  'b3d48c13-abeb-4f58-b6a3-0e07a7caddfe',
  '72ad685d-2eef-4a25-953a-f63259d125e0',
  '6ea91dac-31be-4084-9771-200f3efc6e78'
];

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: SUPABASE_URL,
      path: path,
      method: method,
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  // Booster chaque produit un par un
  for (const id of ids) {
    console.log(`\nBoosting: ${id}`);
    const path = `/rest/v1/products?id=eq.${id}`;
    const result = await apiRequest('PATCH', path, { is_boosted: true });
    console.log('Résultat:', JSON.stringify(result).slice(0, 200));
  }
  
  // Vérifier
  console.log('\n--- Vérification ---');
  const check = await apiRequest('GET', '/rest/v1/products?is_boosted=eq.true&select=id,title,is_boosted', null);
  console.log('Produits boostés:', JSON.stringify(check).slice(0, 500));
}

main().catch(console.error);
