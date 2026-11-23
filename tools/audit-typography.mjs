import fs from 'node:fs';

const pages = ['index.html', 'events.html', 'hackathon.html', 'team.html', 'contact.html'];

console.log('=== AUDITING TYPOGRAPHY & READABILITY ISSUES ===\n');

pages.forEach(p => {
  if (!fs.existsSync(p)) return;
  const html = fs.readFileSync(p, 'utf-8');
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleMatch) return;
  const css = styleMatch[1];

  console.log(`\n--- Page: ${p} ---`);

  // 1. Check for font-sizes below 13px (e.g. 0.6rem, 0.7rem, 10px, 11px, 12px)
  const smallFonts = [];
  const sizeRx = /([^{}]+)\{[^{}]*?font-size:\s*([^;]+);[^{}]*?\}/g;
  let match;
  while ((match = sizeRx.exec(css)) !== null) {
    const selector = match[1].trim().replace(/\s+/g, ' ');
    const size = match[2].trim();
    if (size.includes('0.6') || size.includes('0.7') || size.includes('10px') || size.includes('11px') || size.includes('12px') || size.includes('0.5')) {
      smallFonts.push({ selector, size });
    }
  }
  console.log(`  Fonts < 13px (${smallFonts.length} instances):`);
  smallFonts.slice(0, 10).forEach(f => console.log(`    ${f.selector}: ${f.size}`));

  // 2. Check for text-transform: uppercase on body/paragraphs/descriptions
  const uppercaseMatches = [];
  const upperRx = /([^{}]+)\{[^{}]*?text-transform:\s*uppercase;[^{}]*?\}/g;
  while ((match = upperRx.exec(css)) !== null) {
    const selector = match[1].trim().replace(/\s+/g, ' ');
    if (selector.includes('desc') || selector.includes('bio') || selector.includes('p') || selector.includes('text') || selector.includes('answer') || selector.includes('content') || selector.includes('card')) {
      uppercaseMatches.push(selector);
    }
  }
  console.log(`  Uppercase on copy/text/descriptions (${uppercaseMatches.length} instances):`);
  uppercaseMatches.slice(0, 10).forEach(u => console.log(`    ${u}`));
});

