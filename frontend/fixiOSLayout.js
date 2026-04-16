const fs = require('fs');

const files = [
  'app/dashboard.tsx',
  'app/services.tsx',
  'app/records.tsx',
  'app/profile.tsx',
  'app/scanner.tsx',
  'app/login.tsx',
];

files.forEach(f => {
  const path = 'd:/sanarch/' + f;
  let content = fs.readFileSync(path, 'utf8');

  // 1. Swap SafeAreaView with View if not imported
  content = content.replace(/import \{([^}]*?)SafeAreaView([^}]*?)\} from 'react-native';/, "import {$1$2} from 'react-native';");
  // Clean up empty imports
  content = content.replace(/import \{\s*\} from 'react-native';/, "");
  
  // 2. Add useSafeAreaInsets
  if (!content.includes('react-native-safe-area-context')) {
    content = content.replace(/import \{ useRouter \} from 'expo-router';/, "import { useRouter } from 'expo-router';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';");
  }

  // 3. Inject inset declaration
  content = content.replace(/const router = useRouter\(\);/g, "const router = useRouter();\n  const insets = useSafeAreaInsets();");

  // 4. Replace <SafeAreaView className="flex-1..."> with <View ... style={{...}}>
  content = content.replace(/<SafeAreaView([\s\S]*?)>/g, (match, p1) => {
    // If it doesn't already have relative, add it
    let classes = p1;
    if (!classes.includes('relative')) {
      classes = classes.replace(/className="/, 'className="relative ');
    }
    return `<View${classes} style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>`;
  });

  // 5. Replace </SafeAreaView>
  content = content.replace(/<\/SafeAreaView>/g, "</View>");

  // 6. Fix Bottom Nav and FAB absolute positioning inside padded flex container
  // So the FAB sits correctly
  content = content.replace(/absolute bottom-28/g, "absolute bottom-[112px]");

  fs.writeFileSync(path, content);
});

console.log('Fixed safe areas');
