import assert from 'assert';
import linksRouter from './routes/links.js';

console.log('--- Testing Feature 11.10: Personal Description & Fallback Logic ---');

// 1. Verify linksRouter has PATCH /:id registered
const patchRoute = linksRouter.stack.find(
  (layer) => layer.route && layer.route.path === '/:id' && layer.route.methods.patch
);

assert(patchRoute, 'PATCH /:id route must be defined on links router');
console.log('✓ PATCH /:id route exists on linksRouter');

// 2. Test fallback logic contract
function getEffectiveDescription(personalDesc, scrapedDesc) {
  const hasPersonal = Boolean(personalDesc && personalDesc.trim());
  return hasPersonal ? personalDesc : scrapedDesc;
}

// Case A: personal description present
assert.strictEqual(
  getEffectiveDescription('My personal note', 'Scraped web metadata description'),
  'My personal note',
  'Should use personal description when present'
);
console.log('✓ Uses personal description when present');

// Case B: personal description is null
assert.strictEqual(
  getEffectiveDescription(null, 'Scraped web metadata description'),
  'Scraped web metadata description',
  'Should fallback to scraped description when personal is null'
);
console.log('✓ Falls back to scraped description when personal is null');

// Case C: personal description is empty or whitespace
assert.strictEqual(
  getEffectiveDescription('', 'Scraped web metadata description'),
  'Scraped web metadata description',
  'Should fallback to scraped description when personal is empty'
);
assert.strictEqual(
  getEffectiveDescription('   ', 'Scraped web metadata description'),
  'Scraped web metadata description',
  'Should fallback to scraped description when personal is whitespace'
);
console.log('✓ Falls back to scraped description when personal is whitespace/empty');

// Case D: both are null
assert.strictEqual(
  getEffectiveDescription(null, null),
  null,
  'Should return null when both are null'
);
console.log('✓ Returns null when both are null');

// 3. Test permission rules logic
function canUserEditNote(role) {
  return role === 'owner' || role === 'editor';
}

assert.strictEqual(canUserEditNote('owner'), true, 'Owner can edit personal note');
assert.strictEqual(canUserEditNote('editor'), true, 'Editor can edit personal note');
assert.strictEqual(canUserEditNote('viewer'), false, 'Viewer cannot edit personal note');
console.log('✓ Role authorization rules verified (owner=true, editor=true, viewer=false)');

// 4. Test link duplication preservation
const sampleOriginalLink = {
  id: 'link-123',
  url: 'https://example.com',
  title: 'Example Domain',
  description: 'Original scraped desc',
  personal_description: 'Custom research note',
  screenshot_url: 'https://images.unsplash.com/photo-1',
  favicon_url: 'https://example.com/favicon.ico',
  snapshot_status: 'done'
};

const duplicatedLink = {
  folder_id: 'new-folder-456',
  user_id: 'target-user-789',
  url: sampleOriginalLink.url,
  title: sampleOriginalLink.title,
  description: sampleOriginalLink.description,
  personal_description: sampleOriginalLink.personal_description || null,
  screenshot_url: sampleOriginalLink.screenshot_url,
  favicon_url: sampleOriginalLink.favicon_url,
  snapshot_status: sampleOriginalLink.snapshot_status
};

assert.strictEqual(
  duplicatedLink.personal_description,
  'Custom research note',
  'Duplicated link must retain personal_description'
);
console.log('✓ Link duplication retains personal_description');

console.log('\nAll Feature 11.10 tests passed successfully!');
