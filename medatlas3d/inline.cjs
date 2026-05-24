const fs = require('fs');
const path = require('path');

const distDir = '/Users/darshmsaraf/Documents/Code /bio animation/medatlas3d/dist';
const outputFile = path.join(distDir, 'single.html');

let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

// Find JS asset filename from HTML
const jsMatch = html.match(/src="\/assets\/(index-[a-zA-Z0-9_-]+\.js)"/);
const cssMatch = html.match(/href="\/assets\/(index-[a-zA-Z0-9_-]+\.css)"/);

if (!jsMatch || !cssMatch) {
  console.error("Could not find JS or CSS assets in index.html");
  process.exit(1);
}

const jsFile = jsMatch[1];
const cssFile = cssMatch[1];

console.log(`Inlining JS: ${jsFile}, CSS: ${cssFile}`);

const jsContent = fs.readFileSync(path.join(distDir, 'assets', jsFile), 'utf8');
const cssContent = fs.readFileSync(path.join(distDir, 'assets', cssFile), 'utf8');

// Replace script and link tags
html = html.replace(/<script type="module" crossorigin src="\/assets\/index-[a-zA-Z0-9_-]+\.js"><\/script>/, () => `<script>${jsContent}</script>`);
html = html.replace(/<link rel="stylesheet" crossorigin href="\/assets\/index-[a-zA-Z0-9_-]+\.css">/, () => `<style>${cssContent}</style>`);

fs.writeFileSync(outputFile, html, 'utf8');
console.log(`Successfully created self-contained HTML file at ${outputFile}`);
