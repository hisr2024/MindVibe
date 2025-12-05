#!/usr/bin/env node
/**
 * Scans React/Next.js components for common React Error #418 causes
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

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
    pattern: /<>\s*[A-Za-z][^<>]*\s*</g,
    issue: 'Text directly in fragment without wrapper',
    example: '<>Text content</>',
    fix: '<><span>Text content</span></>'
  },
  {
    pattern: /\.map\([^)]*=>\s*[^<{][^)]*\)/g,
    issue: 'Array map returning unwrapped text',
    example: '.map(x => x.name)',
    fix: '.map(x => <span key={x.id}>{x.name}</span>)'
  }
];

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
  
  const files = [
    ...glob.sync(`${componentsDir}/**/*.{tsx,jsx}`),
    ...glob.sync(`${appDir}/**/*.{tsx,jsx}`)
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
