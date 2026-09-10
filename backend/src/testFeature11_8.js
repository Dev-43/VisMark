import router from './routes/folders.js';

console.log('--- Feature 11.8 Test Suite ---');

// 1. Verify route registration
const routes = router.stack
  .filter(layer => layer.route)
  .map(layer => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods)
  }));

const transferRoute = routes.find(
  r => r.path === '/:id/transfer-ownership' && r.methods.includes('post')
);

if (!transferRoute) {
  console.error('❌ POST /:id/transfer-ownership route not found in router stack');
  process.exit(1);
}
console.log('✅ POST /:id/transfer-ownership route registered');

console.log('--- All Feature 11.8 Route Registration Checks Passed Successfully! ---');
process.exit(0);
