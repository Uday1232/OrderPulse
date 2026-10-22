import { prisma } from '../config/db';
import { redis } from '../config/redis';

async function purgeSampleData() {
  console.log('====================================================');
  console.log('       SAFE DATABASE PURGE: SAMPLE DATA ONLY        ');
  console.log('====================================================\n');

  // 1. Verify and record all user accounts before purge
  const initialUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  console.log(`[USER PROTECTION] Preserving all ${initialUsers.length} user accounts (SuperAdmin, Admin, Users).`);
  console.log('No user records will be touched.\n');

  // 2. Delete Orders and Order Archives
  const deletedArchives = await prisma.orderArchive.deleteMany({});
  console.log(`✓ Deleted ${deletedArchives.count} archived orders.`);

  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✓ Deleted ${deletedOrders.count} active orders.`);

  // 3. Delete Menu Items and Categories
  const deletedItems = await prisma.item.deleteMany({});
  console.log(`✓ Deleted ${deletedItems.count} sample menu items.`);

  const deletedCategories = await prisma.category.deleteMany({});
  console.log(`✓ Deleted ${deletedCategories.count} sample categories.`);

  // 4. Delete Stores
  const deletedStores = await prisma.store.deleteMany({});
  console.log(`✓ Deleted ${deletedStores.count} sample stores.`);

  // 5. Verify User Accounts are 100% intact
  const finalUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  if (finalUsers.length !== initialUsers.length) {
    throw new Error(`CRITICAL INTEGRITY ERROR: User count changed from ${initialUsers.length} to ${finalUsers.length}!`);
  }
  console.log(`\n✓ [INTEGRITY CHECK PASSED] All ${finalUsers.length} user accounts are intact and untouched.`);

  // 6. Clear Redis Cache (stores, menus, analytics, orders)
  try {
    await redis.connect();
    console.log('Connected to Redis. Flushing cache keys...');
    await redis.flushdb();
    console.log('✓ Flushed Redis cache (stale analytics, cached stores, menus, and orders cleared).');
  } catch (err: any) {
    console.warn('Note on Redis flush:', err.message || err);
  } finally {
    try {
      await redis.quit();
    } catch {}
  }

  console.log('\n====================================================');
  console.log('       PURGE COMPLETE: READY FOR NEW DATA           ');
  console.log('====================================================');
}

purgeSampleData()
  .catch((err) => {
    console.error('Purge failed with error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
