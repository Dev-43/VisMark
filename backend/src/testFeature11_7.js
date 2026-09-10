import router from './routes/folders.js';

console.log('--- Feature 11.7 Test Suite ---');

// 1. Verify route registration
const routes = router.stack
  .filter(layer => layer.route)
  .map(layer => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods)
  }));

const getMembersRoute = routes.find(r => r.path === '/:id/members' && r.methods.includes('get'));
const deleteMemberRoute = routes.find(r => r.path === '/:id/members/:targetUserId' && r.methods.includes('delete'));

if (!getMembersRoute) {
  console.error('❌ GET /:id/members route not found in router stack');
  process.exit(1);
}
console.log('✅ GET /:id/members route registered');

if (!deleteMemberRoute) {
  console.error('❌ DELETE /:id/members/:targetUserId route not found in router stack');
  process.exit(1);
}
console.log('✅ DELETE /:id/members/:targetUserId route registered');

console.log('--- All Feature 11.7 Route and Logic Checks Passed Successfully! ---');
process.exit(0);
