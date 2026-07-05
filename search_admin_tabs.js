import fs from 'fs';

const content = fs.readFileSync('./src/pages/AdminPage.jsx', 'utf8');
const lines = content.split('\n');

console.log('--- Search activeTab in AdminPage.jsx ---');
lines.forEach((line, index) => {
  if (line.includes('activeTab ===') && line.includes('&&')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});
