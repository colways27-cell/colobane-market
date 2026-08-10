import fs from 'fs';

const content = fs.readFileSync('./src/pages/AuthPage.jsx', 'utf8');
const lines = content.split('\n');

console.log('--- AuthPage profiles logic ---');
lines.forEach((line, index) => {
  if (line.includes('profiles') || line.includes('signUp') || line.includes('insert') || line.includes('upsert')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});
