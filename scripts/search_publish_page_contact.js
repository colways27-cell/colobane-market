import fs from 'fs';

const content = fs.readFileSync('./src/pages/PublishPage.jsx', 'utf8');
const lines = content.split('\n');

console.log('--- Search contact / phone in PublishPage.jsx ---');
lines.forEach((line, index) => {
  if (line.includes('contact') || line.includes('phone') || line.includes('telephone') || line.includes('whatsapp')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});
