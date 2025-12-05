#!/usr/bin/env node
/**
 * Scans React/Next.js components for common React Error #418 causes
 */
const fs = require('fs');
const path = require('path');

const PATTERNS_TO_CHECK = [
  {
    pattern: /\{[^}]*&&\s*["'`][^"'`]+["'`]\s*\}/g,
    issue: 'Conditional rendering with unwrapped string literal',
    example: '{condition && "text"}',
    fix: '{condition && <span>text</span>}'
  },
  {
    pattern: /\{[^}]*\?\s*["'`][^"'`]+["'`]\s*:/g,
    issue: 'Ternary with unwrapped string literal',
    example: '{condition ? "yes" : "no"}',
    fix: '{condition ? <span>yes</span> : <span>no</span>}'
  },
  {
    pattern: /<>\s*[A-Za-z][^<]*<\/>/g,
    issue: 'Text directly in fragment without wrapper',
    example: '<>Text content</>',
    fix: '<><span>Text content</span></>'
  },
  {
    pattern: /\.map\(\s*\w+\s*=>\s*["'`][^"'`]+["'`]\s*\)/g,
    issue: 'Array map returning string literal',
    example: '.map(x => "text")',
    fix: '.map(x => <span key={...}>text</span>)'
  }
];

/**
 * Recursively get all files matching extensions in a directory
 */
function getFilesRecursive(dir, extensions) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        files.push(...getFilesRecursive(fullPath, extensions));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  PATTERNS_TO_CHECK.forEach(({ pattern, issue, example, fix }) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        file: filePath,
        issue,
        example,
        fix,
        count: matches.length
      });
    }
  });
  
  return issues;
}

function main() {
  const componentsDir = path.join(process.cwd(), 'components');
  const appDir = path.join(process.cwd(), 'app');
  const extensions = ['.tsx', '.jsx'];
  
  const files = [
    ...getFilesRecursive(componentsDir, extensions),
    ...getFilesRecursive(appDir, extensions)
  ];
  
  console.log('🔍 Scanning for React Error #418 patterns...\n');
  
  let totalIssues = 0;
  files.forEach(file => {
    const issues = scanFile(file);
    if (issues.length > 0) {
      console.log(`\n📄 ${file}`);
      issues.forEach(issue => {
        console.log(`  ⚠️  ${issue.issue} (${issue.count} occurrence(s))`);
        console.log(`     Example: ${issue.example}`);
        console.log(`     Fix:     ${issue.fix}`);
        totalIssues += issue.count;
      });
    }
  });
  
  console.log(`\n\n📊 Total potential issues: ${totalIssues}`);
  
  if (totalIssues > 0) {
    console.log('\n💡 Run in dev mode for exact error locations:');
    console.log('   npm run dev\n');
  }
}

main();
