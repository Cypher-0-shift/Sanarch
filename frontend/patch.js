const fs = require('fs');
const file = 'node_modules/react-native-css-interop/dist/runtime/native/render-component.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/function stringify\(object\) \{[\s\S]*?\}, 2\);\s*\}/, 'function stringify(object) { return "[Component Props Omitted]"; }');
fs.writeFileSync(file, content);
