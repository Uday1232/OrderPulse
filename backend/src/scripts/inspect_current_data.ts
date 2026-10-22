import { prisma } from '../config/db';

async function main() {
  const stores = await prisma.store.findMany({
    include: {
      categories: {
        include: { items: true },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log('=== VERIFYING SEEDED STORES & MENUS ===');
  console.log(`Total Stores: ${stores.length}`);

  for (const s of stores) {
    console.log(`\n🏪 Store: ${s.name} (${s.location})`);
    console.log(`   Categories count: ${s.categories.length}`);
    for (const c of s.categories) {
      console.log(`   📂 [${c.name}] (${c.items.length} items):`);
      for (const it of c.items) {
        console.log(`      - ${it.name} | ₹${it.price} | Image: ${it.image_url}`);
      }
    }
  }

  const totalUsers = await prisma.user.count();
  const totalStores = await prisma.store.count();
  const totalCategories = await prisma.category.count();
  const totalItems = await prisma.item.count();

  console.log('\n=== TOTAL COUNTS SUMMARY ===');
  console.log(`Users (Intact): ${totalUsers}`);
  console.log(`Stores: ${totalStores}`);
  console.log(`Categories: ${totalCategories}`);
  console.log(`Menu Items: ${totalItems}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
