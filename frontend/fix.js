const fs = require('fs');
const files = ['app/dashboard.tsx','app/services.tsx','app/records.tsx','app/profile.tsx','app/scanner.tsx','app/login.tsx','app/onboarding.tsx'];
files.forEach(f => {
  const path = 'd:/sanarch/' + f;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  fs.writeFileSync(path, content);
});
console.log('done');
