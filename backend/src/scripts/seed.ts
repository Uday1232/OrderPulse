import bcrypt from 'bcrypt';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';

async function seed() {
  logger.info('Starting database seed for Restaurant POS Platform...');

  // 1. Clean existing records in correct foreign key order
  await prisma.orderArchive.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.user.deleteMany({});

  logger.info('Cleared existing database records');

  // 2. Create Users (Admin & User)
  const passwordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'StorePulse Admin',
      email: 'admin@storepulse.com',
      password_hash: passwordHash,
      role: 'ADMIN',
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: 'Alex Morgan',
      email: 'user@storepulse.com',
      password_hash: userPasswordHash,
      role: 'USER',
    },
  });

  logger.info(`Seeded Admin (${admin.email}) and User (${regularUser.email})`);

  // 3. Create Stores
  const storesData = [
    { name: 'Central Cafe & Bistro', location: '101 Main St, Downtown' },
    { name: 'Uptown Pizzeria & Grill', location: '404 High St, Uptown' },
    { name: 'Suburban Gourmet House', location: '707 Oak Ave, Suburbia' },
  ];

  const stores = [];
  for (const s of storesData) {
    const store = await prisma.store.create({
      data: {
        name: s.name,
        location: s.location,
        admin_id: admin.id,
      },
    });
    stores.push(store);
  }

  logger.info(`Seeded ${stores.length} stores`);

  // 4. Create Categories & Menu Items for each store
  const categoryNames = ['Main Menu', 'Appetizer', 'Beverages'];

  const foodCatalog = [
    // Main Menu
    {
      name: 'Veg. Mania Burger with lettuce',
      category: 'Main Menu',
      price: 16.36,
      rating: 4.8,
      description: 'A delicious vegetarian burger with fresh green lettuce, melted cheddar cheese, tomato slice, and golden sesame seed bun.',
      image_url: '/images/food/burger.jpg',
    },
    {
      name: 'Mexican Patty With Veg. Sammi',
      category: 'Main Menu',
      price: 8.28,
      rating: 4.6,
      description: 'Toasted submarine sandwich with spiced Mexican vegetable patty, cucumber, melted mozzarella, and tangy herb dressing.',
      image_url: '/images/food/sub_sandwich.jpg',
    },
    {
      name: 'Italian Veg. Sandwich Classic',
      category: 'Main Menu',
      price: 16.54,
      rating: 4.9,
      description: 'This delectable creation features a medley of fresh, garden-fresh vegetables, savory herbs, and zesty condiments, all nestled between perfectly toasted artisanal bread.',
      image_url: '/images/food/sandwich.jpg',
    },
    {
      name: 'Turkish Cuisine Pizza',
      category: 'Main Menu',
      price: 22.54,
      rating: 4.7,
      description: 'Crispy stone-baked pizza slice with succulent Mediterranean toppings, sun-ripened cherry tomatoes, fresh basil, and mozzarella.',
      image_url: '/images/food/pizza.jpg',
    },
    // Appetizers
    {
      name: 'Crispy French Fries',
      category: 'Appetizer',
      price: 5.99,
      rating: 4.8,
      description: 'Golden crispy skin-on potatoes seasoned with fine Himalayan sea salt and served with house dips.',
      image_url: '/images/food/fries.jpg',
    },
    {
      name: 'Garlic Butter Knots',
      category: 'Appetizer',
      price: 6.50,
      rating: 4.6,
      description: 'Oven-baked dough knots brushed with roasted garlic butter, parsley, and parmesan cheese.',
      image_url: '/images/food/sandwich.jpg',
    },
    // Beverages
    {
      name: 'Artisanal Hot Cappuccino',
      category: 'Beverages',
      price: 4.50,
      rating: 4.9,
      description: 'Freshly roasted espresso with velvety steamed milk foam and delicate latte art.',
      image_url: '/images/food/coffee.jpg',
    },
    {
      name: 'Iced Peach Lemon Tea',
      category: 'Beverages',
      price: 4.99,
      rating: 4.7,
      description: 'Chilled organic black tea infused with sweet white peach syrup and fresh lemon slices.',
      image_url: '/images/food/coffee.jpg',
    },
  ];

  for (const store of stores) {
    const createdCategories: Record<string, string> = {};

    for (const catName of categoryNames) {
      const cat = await prisma.category.create({
        data: {
          name: catName,
          store_id: store.id,
        },
      });
      createdCategories[catName] = cat.id;
    }

    for (const food of foodCatalog) {
      const catId = createdCategories[food.category]!;
      await prisma.item.create({
        data: {
          name: food.name,
          description: food.description,
          price: food.price,
          rating: food.rating,
          image_url: food.image_url,
          category_id: catId,
          store_id: store.id,
        },
      });
    }
  }

  logger.info('Seeded dynamic categories and menu items with photos across all stores');

  // 5. Seed Orders (Recent & Archived)
  const now = new Date();
  const paymentMethods: Array<'CASH' | 'CARD' | 'UPI'> = ['CARD', 'UPI', 'CASH'];
  const statuses: Array<'PLACED' | 'PREPARED' | 'PENDING' | 'CANCELLED'> = ['PREPARED', 'PLACED', 'PREPARED', 'PENDING'];

  let orderCountTotal = 0;

  for (const store of stores) {
    for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
      const orderDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const ordersPerDay = 3 + (dayOffset % 3);

      for (let i = 0; i < ordersPerDay; i++) {
        const item1 = foodCatalog[(i + dayOffset) % foodCatalog.length]!;
        const item2 = foodCatalog[(i + dayOffset + 2) % foodCatalog.length]!;

        const qty1 = 1 + (i % 2);
        const qty2 = 1 + ((i + 1) % 3);
        const sub1 = Math.round(qty1 * item1.price * 100) / 100;
        const sub2 = Math.round(qty2 * item2.price * 100) / 100;

        const items = [
          { item_id: `item-${i}-1`, name: item1.name, qty: qty1, quantity: qty1, price: item1.price, unit_price: item1.price, subtotal: sub1 },
          { item_id: `item-${i}-2`, name: item2.name, qty: qty2, quantity: qty2, price: item2.price, unit_price: item2.price, subtotal: sub2 },
        ];

        const totalAmount = Math.round((sub1 + sub2) * 100) / 100;
        const paymentMethod = paymentMethods[(i + dayOffset) % paymentMethods.length]!;
        const status = statuses[(i + dayOffset) % statuses.length]!;
        const paymentStatus = paymentMethod === 'CASH' && status === 'PENDING' ? 'PENDING' : 'COMPLETED';

        await prisma.order.create({
          data: {
            store_id: store.id,
            user_id: i % 2 === 0 ? regularUser.id : null,
            items,
            total_amount: totalAmount,
            status,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            created_at: new Date(orderDate.getTime() + i * 1800000),
          },
        });
        orderCountTotal++;
      }
    }

    // Add 4 older orders (45 days ago) to test archival
    const oldDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    for (let i = 0; i < 4; i++) {
      const item = foodCatalog[i % foodCatalog.length]!;
      const totalAmount = Math.round(item.price * 2 * 100) / 100;
      await prisma.order.create({
        data: {
          store_id: store.id,
          user_id: regularUser.id,
          items: [
            { item_id: `old-${i}`, name: item.name, qty: 2, quantity: 2, price: item.price, unit_price: item.price, subtotal: totalAmount },
          ],
          total_amount: totalAmount,
          status: 'PREPARED',
          payment_method: 'CARD',
          payment_status: 'COMPLETED',
          created_at: new Date(oldDate.getTime() + i * 3600000),
        },
      });
      orderCountTotal++;
    }
  }

  logger.info(`Successfully seeded ${orderCountTotal} orders across ${stores.length} stores`);
  logger.info('Database seed complete!');
}

seed()
  .catch((e) => {
    logger.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
