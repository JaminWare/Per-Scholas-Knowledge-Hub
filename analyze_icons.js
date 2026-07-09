const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/HomePage.tsx',
  'src/pages/SectionPage.tsx',
  'src/pages/LearnerExperiencePage.tsx',
  'src/pages/DeskolasPage.tsx',
  'src/pages/RecognitionPage.tsx',
  'src/pages/AdminControlPage.tsx',
  'src/pages/ArticlePage.tsx'
];

// Lucide-react icon names to look for
const lucideIconPattern = /<([A-Z][a-zA-Z0-9]*)\s+className="([^"]*)"/g;

const results = {};

files.forEach(file => {
  const fullPath = path.join('/tmp/cc-agent/68254250/project', file);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  
  results[file] = {
    imports: [],
    usages: []
  };
  
  // Extract imports
  let inImportBlock = false;
  let importLine = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('from \'lucide-react\'') || line.includes('from "lucide-react"')) {
      // Found lucide import - work backwards to get full import
      let start = i;
      while (start > 0 && !lines[start].includes('import')) start--;
      let end = i;
      while (end < lines.length && !lines[end].includes(';')) end++;
      const importText = lines.slice(start, end + 1).join(' ');
      const match = importText.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/);
      if (match) {
        const icons = match[1]
          .split(',')
          .map(s => s.trim())
          .filter(s => s);
        results[file].imports.push(...icons);
      }
    }
  }
  
  // Extract usages with line numbers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    const regex = /<([A-Z][a-zA-Z0-9]*)\s+className="([^"]*)"/g;
    while ((match = regex.exec(line)) !== null) {
      const componentName = match[1];
      const className = match[2];
      
      // Check if it looks like a lucide icon (PascalCase and imported)
      if (results[file].imports.includes(componentName) || /^[A-Z][a-zA-Z0-9]+$/.test(componentName)) {
        results[file].usages.push({
          line: i + 1,
          component: componentName,
          className: className,
          hasW: /w-\d+/.test(className),
          hasH: /h-\d+/.test(className),
          hasShrink: /shrink-0|flex-shrink-0/.test(className)
        });
      }
    }
  }
});

console.log(JSON.stringify(results, null, 2));
