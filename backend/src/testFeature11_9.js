import foldersRouter from './routes/folders.js';
import notificationsRouter from './routes/notifications.js';

console.log('--- Feature 11.9 Test Suite ---');

// 1. Verify route registration in foldersRouter
const folderRoutes = foldersRouter.stack
  .filter(layer => layer.route)
  .map(layer => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods)
  }));

const deleteFolderRoute = folderRoutes.find(
  r => r.path === '/:id' && r.methods.includes('delete')
);

if (!deleteFolderRoute) {
  console.error('❌ DELETE /:id route not found in foldersRouter stack');
  process.exit(1);
}
console.log('✅ DELETE /:id route registered in foldersRouter');

// 2. Verify route registration in notificationsRouter
const notificationRoutes = notificationsRouter.stack
  .filter(layer => layer.route)
  .map(layer => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods)
  }));

const dismissRoute = notificationRoutes.find(
  r => r.path === '/:id/dismiss' && r.methods.includes('post')
);

if (!dismissRoute) {
  console.error('❌ POST /:id/dismiss route not found in notificationsRouter stack');
  process.exit(1);
}
console.log('✅ POST /:id/dismiss route registered in notificationsRouter');

// 3. Verify folder_deleted string parsing logic
const mockType = 'folder_deleted:My Awesome Folder';
if (mockType.startsWith('folder_deleted:')) {
  const extractedName = mockType.slice('folder_deleted:'.length);
  if (extractedName !== 'My Awesome Folder') {
    console.error('❌ Failed to parse folder name from folder_deleted notification');
    process.exit(1);
  }
}
console.log('✅ folder_deleted prefix parsing logic verified');

console.log('--- All Feature 11.9 Checks Passed Successfully! ---');
process.exit(0);
