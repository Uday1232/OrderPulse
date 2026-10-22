import { prisma } from '../config/db';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, address: true, created_at: true }
  });
  console.log('=== USERS IN DATABASE (TO PRESERVE) ===');
  console.log(`Total: ${users.length}`);
  users.forEach(u => console.log(`• [${u.role}] ${u.name} <${u.email}> (Address: ${u.address || 'none'})`));

  const stores = await prisma.store.findMany({ select: { id: true, name: true } });
  const items = await prisma.item.count();
  const orders = await prisma.order.count();
  const archives = await prisma.orderArchive.count();

  console.log('\n=== SAMPLE DATA TO PURGE ===');
  console.log(`Stores (${stores.length}):`, stores.map(s => s.name).join(', '));
  console.log(`Menu Items: ${items}`);
  console.log(`Active Orders: ${orders}`);
  console.log(`Archived Orders: ${archives}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
