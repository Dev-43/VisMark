import { takeScreenshot } from './services/playwrightSnapshot.js';
// ^ adjust the import name to match whatever function name
// Antigravity actually gave it — check the export in the file

const testUrls = [
  'https://example.com',                    // simple static site
  'https://news.ycombinator.com',           // fast, simple, real-world
  'https://react.dev',                      // SPA-ish, client rendering
  'https://vercel.com',                     // heavier modern site
];

for (const url of testUrls) {
  console.log(`\nTesting: ${url}`);
  const start = Date.now();
  try {
    const result = await takeScreenshot(url);
    console.log(`✅ Success in ${Date.now() - start}ms`);
    console.log('Result shape:', typeof result, Object.keys(result || {}));
  } catch (err) {
    console.log(`❌ Failed in ${Date.now() - start}ms`);
    console.log('Error name:', err.name);
    console.log('Error message:', err.message);
  }
}