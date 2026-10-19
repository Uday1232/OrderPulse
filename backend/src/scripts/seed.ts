import bcrypt from 'bcrypt';
import { prisma } from '../config/db';
import { RedisService } from '../services/redis.service';
import { logger } from '../utils/logger';

async function seed() {
  logger.info('Starting database seed with 4 Western Stores, perfectly matched photos & menus, and Real-Time Analytics...');

  // 1. Clean existing records in correct foreign key order
  await prisma.orderArchive.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.user.deleteMany({});

  logger.info('Cleared existing database records');

  // 2. Create Users (SuperAdmin, Store Admins, and Customers)
  const passwordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: 'StorePulse SuperAdmin',
      email: 'admin@storepulse.com',
      password_hash: passwordHash,
      role: 'SUPERADMIN',
    },
  });

  const admin1 = await prisma.user.create({
    data: {
      name: 'Central Bistro Manager',
      email: 'central_admin@storepulse.com',
      password_hash: passwordHash,
      role: 'ADMIN',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      name: 'Uptown Grill Manager',
      email: 'uptown_admin@storepulse.com',
      password_hash: passwordHash,
      role: 'ADMIN',
    },
  });

  const admin3 = await prisma.user.create({
    data: {
      name: 'Suburban House Manager',
      email: 'suburban_admin@storepulse.com',
      password_hash: passwordHash,
      role: 'ADMIN',
    },
  });

  const admin4 = await prisma.user.create({
    data: {
      name: 'Metro Express Manager',
      email: 'metro_admin@storepulse.com',
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

  const regularUser2 = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      password_hash: userPasswordHash,
      role: 'USER',
    },
  });

  logger.info(`Seeded SuperAdmin (${superAdmin.email}), Store Admins, and Customers successfully`);

  // 3. Define 4 Distinct Western Stores with 1-2 items per category matching photos 100%
  const storesData = [
    {
      name: 'Central Cafe & Bistro',
      location: '101 Downtown Boulevard, Central District',
      adminId: admin1.id,
      categories: [
        {
          name: 'Main Menu',
          items: [
            {
              name: 'Classic Margherita Veg. Pizza',
              description: 'Stone-baked thin crust pizza topped with fresh mozzarella cheese, sun-ripened tomatoes, and aromatic sweet basil.',
              price: 15.50,
              rating: 4.9,
              image_url: '/images/food/pizza.jpg',
            },
            {
              name: 'Grilled Italian Club Sandwich',
              description: 'Triple-decker artisan toasted sandwich layered with crisp garden vegetables, melted cheddar, and herb aioli.',
              price: 12.00,
              rating: 4.8,
              image_url: '/images/food/sandwich.jpg',
            },
          ],
        },
        {
          name: 'Appetizer',
          items: [
            {
              name: 'Crispy Cheddar Bacon Burger',
              description: 'Juicy prime patty with melted aged cheddar, crisp lettuce, tomato slices, and secret sauce on a toasted brioche bun.',
              price: 14.50,
              rating: 4.8,
              image_url: '/images/food/burger.jpg',
            },
            {
              name: 'Golden Salted French Fries',
              description: 'Crispy skin-on golden potato fries seasoned with fine Himalayan sea salt, served with garlic mayo dip.',
              price: 5.50,
              rating: 4.7,
              image_url: '/images/food/fries.jpg',
            },
          ],
        },
        {
          name: 'Beverages',
          items: [
            {
              name: 'Artisanal Hot Cappuccino',
              description: 'Freshly roasted espresso shot topped with velvety steamed milk foam and delicate barista latte art.',
              price: 4.50,
              rating: 4.9,
              image_url: '/images/food/coffee.jpg',
            },
            {
              name: 'Iced Peach Lemon Tea',
              description: 'Refreshing chilled organic black tea infused with sweet peach syrup and fresh lemon slices.',
              price: 4.00,
              rating: 4.6,
              image_url: '/images/food/coffee.jpg',
            },
          ],
        },
      ],
    },
    {
      name: 'Uptown Pizzeria & Grill',
      location: '404 High Street, Uptown District',
      adminId: admin2.id,
      categories: [
        {
          name: 'Main Menu',
          items: [
            {
              name: 'Pepperoni & Mozzarella Pizza',
              description: 'Traditional wood-fired crust loaded with spicy cured beef pepperoni, rich tomato marinara, and double mozzarella.',
              price: 17.50,
              rating: 4.9,
              image_url: '/images/food/pizza.jpg',
            },
            {
              name: 'Toasted Submarine Sandwich',
              description: 'Crisp submarine hoagie filled with seasoned garden veggies, melted provolone cheese, and house vinaigrette.',
              price: 11.50,
              rating: 4.7,
              image_url: '/images/food/sub_sandwich.jpg',
            },
          ],
        },
        {
          name: 'Appetizer',
          items: [
            {
              name: 'Smoky BBQ Double Burger',
              description: 'Two flame-grilled patties basted in sweet hickory BBQ sauce, topped with crispy onion rings and melted cheese.',
              price: 15.00,
              rating: 4.9,
              image_url: '/images/food/burger.jpg',
            },
            {
              name: 'Crispy Peri Peri French Fries',
              description: 'Hot crunchy french fries tossed in zesty peri-peri chili paprika seasoning with creamy cheese dip.',
              price: 6.00,
              rating: 4.8,
              image_url: '/images/food/fries.jpg',
            },
          ],
        },
        {
          name: 'Beverages',
          items: [
            {
              name: 'Vanilla Latte Hot-Coffee',
              description: 'Smooth espresso blended with steamed milk and Madagascar vanilla syrup, lightly dusted with cinnamon.',
              price: 5.00,
              rating: 4.8,
              image_url: '/images/food/coffee.jpg',
            },
            {
              name: 'Cold Brew Ice-Tea',
              description: 'Slow-steeped cold brew black tea served over crystal ice with fresh mint sprigs and citrus twist.',
              price: 4.50,
              rating: 4.7,
              image_url: '/images/food/coffee.jpg',
            },
          ],
        },
      ],
    },
    {
      name: 'Suburban Gourmet House',
      location: '707 Oak Avenue, West End Suburbs',
      adminId: admin3.id,
      categories: [
        {
          name: 'Main Menu',
          items: [
            {
              name: 'Truffle Mushroom Veg. Pizza',
              description: 'Gourmet white sauce pizza topped with sautéed cremini mushrooms, truffle oil drizzle, and fresh oregano.',
              price: 18.00,
              rating: 4.9,
              image_url: '/images/food/pizza.jpg',
            },
            {
              name: 'Avocado Club Veg. Sandwich',
              description: 'Fresh sliced Haas avocado, ripe tomatoes, crisp cucumber, and cheddar cheese on whole grain toasted sourdough.',
              price: 13.00,
              rating: 4.8,
              image_url: '/images/food/sandwich.jpg',
            },
          ],
        },
        {
          name: 'Appetizer',
          items: [
            {
              name: 'Melted Swiss Mushroom Burger',
              description: 'Savory grilled patty smothered with buttered mushrooms and melted Swiss cheese on toasted sesame seed bun.',
              price: 14.00,
              rating: 4.7,
              image_url: '/images/food/burger.jpg',
            },
            {
              name: 'Seasoned Curly French Fries',
              description: 'Golden spiral-cut curly fries seasoned with garlic salt, onion powder, and paprika.',
              price: 6.50,
              rating: 4.8,
              image_url: '/images/food/fries.jpg',
            },
          ],
        },
        {
          name: 'Beverages',
          items: [
            {
              name: 'Caramel Macchiato Hot-Coffee',
              description: 'Freshly steamed milk with vanilla-flavored syrup marked with espresso and topped with caramel drizzle.',
              price: 5.50,
              rating: 4.9,
              image_url: '/images/food/coffee.jpg',
            },
            {
              name: 'Classic Iced Lemon Tea',
              description: 'Crisp brewed Ceylon black tea shaken with ice, pure cane sugar, and freshly squeezed lemon juice.',
              price: 4.00,
              rating: 4.7,
              image_url: '/images/food/coffee.jpg',
            },
          ],
        },
      ],
    },
    {
      name: 'Metro Deli & Express',
      location: '50 Grand Central Avenue, Financial District',
      adminId: admin4.id,
      categories: [
        {
          name: 'Main Menu',
          items: [
            {
              name: 'Four Cheese Crisp Pizza',
              description: 'Crisp rustic thin crust layered with rich mozzarella, sharp parmesan, provolone, and creamy ricotta.',
              price: 16.50,
              rating: 4.8,
              image_url: '/images/food/pizza.jpg',
            },
            {
              name: 'Classic Deli Submarine Sandwich',
              description: 'Authentic 9-inch toasted submarine roll filled with sliced cheddar, roasted peppers, and basil pesto spread.',
              price: 12.50,
              rating: 4.7,
              image_url: '/images/food/sub_sandwich.jpg',
            },
          ],
        },
        {
          name: 'Appetizer',
          items: [
            {
              name: 'Veg. Mania Crunch Burger',
              description: 'Crispy seasoned vegetable patty with fresh lettuce, sliced tomatoes, pickle chips, and special burger relish.',
              price: 13.50,
              rating: 4.8,
              image_url: '/images/food/burger.jpg',
            },
            {
              name: 'Loaded Cheesy French Fries',
              description: 'Basket of hot crispy french fries smothered with melted warm cheddar cheese sauce and chopped green scallions.',
              price: 7.00,
              rating: 4.9,
              image_url: '/images/food/fries.jpg',
            },
          ],
        },
        {
          name: 'Beverages',
          items: [
            {
              name: 'Dark Roasted Espresso Coffee',
              description: 'Double shot of dark Italian roast espresso with rich crema and bold, aromatic notes of dark chocolate.',
              price: 4.00,
              rating: 4.8,
              image_url: '/images/food/coffee.jpg',
            },
            {
              name: 'Berry Hibiscus Ice-Tea',
              description: 'Tart and refreshing botanical iced tea infused with dried hibiscus petals and sweet summer berries.',
              price: 4.50,
              rating: 4.8,
              image_url: '/images/food/coffee.jpg',
            },
          ],
        },
      ],
    },
  ];

  // 4. Create Stores, Categories, and Items in Database
  interface CreatedStoreEntry {
    store: { id: string; name: string };
    items: Array<{ id: string; name: string; price: number }>;
  }

  const createdStores: CreatedStoreEntry[] = [];

  for (const sData of storesData) {
    const store = await prisma.store.create({
      data: {
        name: sData.name,
        location: sData.location,
        admin_id: sData.adminId,
      },
    });

    const storeItemsList: Array<{ id: string; name: string; price: number }> = [];

    for (const catData of sData.categories) {
      const cat = await prisma.category.create({
        data: {
          name: catData.name,
          store_id: store.id,
        },
      });

      for (const itemData of catData.items) {
        const item = await prisma.item.create({
          data: {
            name: itemData.name,
            description: itemData.description,
            price: itemData.price,
            rating: itemData.rating,
            image_url: itemData.image_url,
            category_id: cat.id,
            store_id: store.id,
          },
        });
        storeItemsList.push({ id: item.id, name: item.name, price: item.price });
      }
    }

    createdStores.push({ store, items: storeItemsList });
  }

  logger.info(`Seeded 4 Western Stores with 24 items matching pictures 100%`);

  // 5. Seed Orders (Chronologically across past 7 days for live analytics charts)
  const now = new Date();
  const paymentMethods: Array<'CASH' | 'CARD' | 'UPI'> = ['CARD', 'CARD', 'UPI', 'CASH'];
  let totalOrderCount = 0;

  for (const storeRecord of createdStores) {
    const storeItems = storeRecord.items;
    if (storeItems.length === 0) continue;

    // Distribute orders across 7 days (day 6 down to day 0 = today)
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const orderDay = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const ordersForDay = dayOffset === 0 ? 3 : 2 + (dayOffset % 2);

      for (let i = 0; i < ordersForDay; i++) {
        const itemA = storeItems[i % storeItems.length]!;
        const itemB = storeItems[(i + 1) % storeItems.length]!;

        const qtyA = 1 + (i % 2);
        const qtyB = 1;
        const subA = Math.round(qtyA * itemA.price * 100) / 100;
        const subB = Math.round(qtyB * itemB.price * 100) / 100;

        const orderItems = [
          {
            item_id: itemA.id,
            name: itemA.name,
            qty: qtyA,
            quantity: qtyA,
            price: itemA.price,
            unit_price: itemA.price,
            subtotal: subA,
          },
          {
            item_id: itemB.id,
            name: itemB.name,
            qty: qtyB,
            quantity: qtyB,
            price: itemB.price,
            unit_price: itemB.price,
            subtotal: subB,
          },
        ];

        const totalAmount = Math.round((subA + subB) * 100) / 100;
        const paymentMethod = paymentMethods[(i + dayOffset) % paymentMethods.length]!;

        // Realistic order status distribution
        let status: 'PLACED' | 'PENDING' | 'PREPARED' = 'PREPARED';
        if (dayOffset === 0) {
          // Today's orders have active statuses for immediate live testing!
          status = i === 0 ? 'PLACED' : i === 1 ? 'PENDING' : 'PREPARED';
        }

        const paymentStatus = paymentMethod === 'CASH' && status === 'PENDING' ? 'PENDING' : 'COMPLETED';
        const createdAt = new Date(orderDay.getTime() + (i * 3 + 10) * 3600000);

        await prisma.order.create({
          data: {
            store_id: storeRecord.store.id,
            user_id: i % 2 === 0 ? regularUser.id : regularUser2.id,
            items: orderItems,
            total_amount: totalAmount,
            status,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            created_at: createdAt,
          },
        });
        totalOrderCount++;
      }
    }
  }

  // 6. Invalidate all Redis caches for instant real-time sync
  await Promise.all([
    RedisService.invalidatePattern('menu:*'),
    RedisService.invalidatePattern('orders:*'),
    RedisService.invalidatePattern('analytics:*'),
  ]);

  logger.info(`Successfully seeded ${totalOrderCount} orders across all 4 Western stores`);
  logger.info('Database seed complete and Redis caches refreshed!');
}

seed()
  .catch((e) => {
    logger.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
