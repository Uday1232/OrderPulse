import { prisma } from '../src/config/db';
import { RedisService } from '../src/services/redis.service';

async function clearSampleData() {
  console.log('--- Cleaning all sample data from database ---');

  // 1. Delete all order archives
  const deletedArchives = await prisma.orderArchive.deleteMany();
  console.log(`Deleted ${deletedArchives.count} archived orders.`);

  // 2. Delete all orders
  const deletedOrders = await prisma.order.deleteMany();
  console.log(`Deleted ${deletedOrders.count} active orders.`);

  // 3. Delete all menu items
  const deletedItems = await prisma.item.deleteMany();
  console.log(`Deleted ${deletedItems.count} menu items.`);

  // 4. Delete all categories
  const deletedCategories = await prisma.category.deleteMany();
  console.log(`Deleted ${deletedCategories.count} categories.`);

  // 5. Invalidate all Redis caches
  await Promise.all([
    RedisService.invalidatePattern('menu:*'),
    RedisService.invalidatePattern('orders:*'),
    RedisService.invalidatePattern('analytics:*'),
  ]);
  console.log('Flushed all Redis menu, orders, and analytics caches.');

  // 6. Verify remaining counts
  const remainingStores = await prisma.store.count();
  const remainingUsers = await prisma.user.count();
  const remainingItems = await prisma.item.count();
  const remainingCategories = await prisma.category.count();
  const remainingOrders = await prisma.order.count();

  console.log('--- Verification Summary ---');
  console.log(`Remaining Stores: ${remainingStores}`);
  console.log(`Remaining Users: ${remainingUsers}`);
  console.log(`Remaining Menu Items: ${remainingItems}`);
  console.log(`Remaining Categories: ${remainingCategories}`);
  console.log(`Remaining Orders: ${remainingOrders}`);
  console.log('--- Database is completely clean and ready for manual data entry! ---');

  await prisma.$disconnect();
}

clearSampleData().catch((err) => {
  console.error('Error clearing sample data:', err);
  process.exit(1);
});
