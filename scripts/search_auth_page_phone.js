import fs from 'fs';

const content = fs.readFileSync('./src/pages/AuthPage.jsx', 'utf8');
const lines = content.split('\n');

console.log('--- Search phone / contact in AuthPage.jsx ---');
lines.forEach((line, index) => {
  if (line.includes('phone') || line.includes('telephone') || line.includes('contact') || line.includes('whatsapp')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});
