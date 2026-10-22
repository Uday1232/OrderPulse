import { StoreService } from '../services/store.service';
import { prisma } from '../config/db';

async function testApi() {
  console.log('Testing StoreService.getAllStores()...');
  const storesResult = await StoreService.getAllStores({});
  console.log(`Fetched ${storesResult.stores.length} stores:`);
  for (const s of storesResult.stores) {
    console.log(`- ${s.name} | ${s.location} | Active: ${s.is_active}`);
  }

  const firstStore = storesResult.stores[0];
  if (!firstStore) {
    throw new Error('No stores found!');
  }

  console.log(`\nTesting StoreService.getStoreMenu for "${firstStore.name}" (${firstStore.id})...`);
  const menuResult = (await StoreService.getStoreMenu(firstStore.id, true)) as any;
  console.log(`Categories in menu: ${menuResult.categories.length}`);
  console.log(`Total items in menu: ${menuResult.totalItems}`);
  for (const cat of menuResult.categories) {
    console.log(`  Category: ${cat.name} (${cat.items.length} items)`);
    for (const it of cat.items) {
      console.log(`    - ${it.name}: ₹${it.price} [${it.image_url}]`);
    }
  }

  await prisma.$disconnect();
}
testApi().catch(console.error);
