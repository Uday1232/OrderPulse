import { prisma } from '../config/db';
import { logger } from '../utils/logger';

export const DEMO_STORES = [
  { id: 'store-downtown-01', name: 'Downtown Bistro', location: '101 Main St, Downtown' },
  { id: 'store-uptown-02', name: 'Uptown Pizzeria', location: '404 High St, Uptown' },
  { id: 'store-suburban-03', name: 'Suburban Grill', location: '707 Oak Ave, Suburbia' },
];

export const DEMO_MENU = [
  { name: 'Margherita Pizza', unit_price: 14.99 },
  { name: 'Truffle Burger', unit_price: 18.50 },
  { name: 'Caesar Salad', unit_price: 11.00 },
  { name: 'Pasta Carbonara', unit_price: 16.75 },
  { name: 'Tiramisu', unit_price: 8.50 },
  { name: 'Espresso', unit_price: 3.50 },
  { name: 'Garlic Knots', unit_price: 6.00 },
];

async function seed() {
  logger.info('Starting database seed...');

  // Clean existing orders
  await prisma.order.deleteMany({});
  await prisma.orderArchive.deleteMany({});
  logger.info('Cleared existing orders and archived orders');

  const now = new Date();
  const ordersToCreate = [];

  // 1. Create orders spread across the last 10 days
  for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
    const orderDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);

    for (const store of DEMO_STORES) {
      // 2 to 4 orders per store per day
      const orderCount = 2 + (dayOffset % 3);

      for (let i = 0; i < orderCount; i++) {
        const item1 = DEMO_MENU[(i + dayOffset) % DEMO_MENU.length]!;
        const item2 = DEMO_MENU[(i + dayOffset + 2) % DEMO_MENU.length]!;

        const qty1 = 1 + (i % 3);
        const qty2 = 1 + ((i + 1) % 2);

        const items = [
          {
            name: item1.name,
            quantity: qty1,
            unit_price: item1.unit_price,
            subtotal: Math.round(qty1 * item1.unit_price * 100) / 100,
          },
          {
            name: item2.name,
            quantity: qty2,
            unit_price: item2.unit_price,
            subtotal: Math.round(qty2 * item2.unit_price * 100) / 100,
          },
        ];

        const totalAmount = Math.round(items.reduce((sum, it) => sum + it.subtotal, 0) * 100) / 100;

        let status: 'PLACED' | 'PREPARING' | 'COMPLETED' = 'COMPLETED';
        if (dayOffset === 0) {
          if (i === 0) status = 'PLACED';
          else if (i === 1) status = 'PREPARING';
          else status = 'COMPLETED';
        } else if (dayOffset === 1 && i === 0) {
          status = 'PREPARING';
        }

        ordersToCreate.push({
          store_id: store.id,
          items,
          total_amount: totalAmount,
          status,
          created_at: new Date(orderDate.getTime() + i * 1800000), // staggered by 30 mins
        });
      }
    }
  }

  // 2. Add 8 older orders (45 days ago) to test the archival pipeline
  const oldDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  for (let i = 0; i < 8; i++) {
    const item = DEMO_MENU[i % DEMO_MENU.length]!;
    ordersToCreate.push({
      store_id: DEMO_STORES[i % DEMO_STORES.length]!.id,
      items: [
        {
          name: item.name,
          quantity: 2,
          unit_price: item.unit_price,
          subtotal: Math.round(2 * item.unit_price * 100) / 100,
        },
      ],
      total_amount: Math.round(2 * item.unit_price * 100) / 100,
      status: 'COMPLETED' as const,
      created_at: new Date(oldDate.getTime() + i * 3600000),
    });
  }

  // Insert in batch
  for (const orderData of ordersToCreate) {
    await prisma.order.create({
      data: orderData,
    });
  }

  logger.info(`Successfully seeded ${ordersToCreate.length} orders across ${DEMO_STORES.length} stores`);
}

seed()
  .catch((e) => {
    logger.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
