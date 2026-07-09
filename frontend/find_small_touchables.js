const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.expo')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./app').concat(walk('./components'));
let matches = [];

const twSizes = { '4': 16, '5': 20, '6': 24, '7': 28, '8': 32, '9': 36, '10': 40, '11': 44 };

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  const regex = /<(TouchableOpacity|Pressable)[\s\S]*?>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tag = match[0];
    const index = match.index;
    const lineNumber = content.substring(0, index).split('\n').length;
    
    let isSmall = false;
    let detectedSize = '';
    
    const twMatch = tag.match(/\b(w-|h-)(\d+)\b/g);
    if (twMatch) {
      twMatch.forEach(m => {
        const val = m.split('-')[1];
        if (twSizes[val] && twSizes[val] < 44 && twSizes[val] >= 20) {
          isSmall = true;
          detectedSize += m + '(' + twSizes[val] + 'px) ';
        }
      });
    }
    
    const twPxMatch = tag.match(/\b(w-|h-)\[(\d+)px\]/g);
    if (twPxMatch) {
      twPxMatch.forEach(m => {
        const val = parseInt(m.match(/\d+/)[0]);
        if (val < 44 && val >= 20) {
          isSmall = true;
          detectedSize += m + ' ';
        }
      });
    }
    
    const inlineMatch = tag.match(/(?:width|height)\s*:\s*(\d+)/g);
    if (inlineMatch) {
      inlineMatch.forEach(m => {
        const val = parseInt(m.match(/\d+/)[0]);
        if (val < 44 && val >= 20) {
          isSmall = true;
          detectedSize += m + ' ';
        }
      });
    }
    
    if (isSmall) {
      matches.push(`${file}:${lineNumber} -> ${detectedSize.trim()}`);
    }
  }
});

console.log(matches.join('\n'));
