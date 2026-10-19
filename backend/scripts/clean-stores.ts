import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allowedNames = [
    'Central Cafe & Bistro',
    'Uptown Pizzeria & Grill',
    'Suburban Gourmet House',
  ];

  const storesToDelete = await prisma.store.findMany({
    where: {
      name: { notIn: allowedNames },
    },
    select: { id: true, name: true },
  });

  console.log(`Found ${storesToDelete.length} extra stores to clean up:`);

  for (const store of storesToDelete) {
    console.log(`Deleting store: ${store.name} (${store.id})`);
    // Cascade delete relations
    await prisma.orderArchive.deleteMany({ where: { store_id: store.id } });
    await prisma.order.deleteMany({ where: { store_id: store.id } });
    await prisma.item.deleteMany({ where: { store_id: store.id } });
    await prisma.category.deleteMany({ where: { store_id: store.id } });
    await prisma.store.delete({ where: { id: store.id } });
  }

  const remaining = await prisma.store.findMany({
    select: { id: true, name: true, location: true, is_active: true },
  });
  console.log(`Remaining stores (${remaining.length}):`, remaining);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
