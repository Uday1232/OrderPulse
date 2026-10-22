import bcrypt from 'bcrypt';
import { prisma } from '../config/db';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

interface MenuItemSeed {
  name: string;
  price: number;
  image: string;
  description: string;
}

interface CategorySeed {
  name: string;
  items: MenuItemSeed[];
}

interface StoreSeed {
  name: string;
  location: string;
  adminEmail: string;
  categories: CategorySeed[];
}

const STORES_DATA: StoreSeed[] = [
  {
    name: 'Crave Corner Café',
    location: 'FC Road, Shivajinagar, Pune, Maharashtra',
    adminEmail: 'central_admin@storepulse.com',
    categories: [
      {
        name: 'Veg. Mania',
        items: [
          {
            name: 'Loaded Veg Mania',
            price: 149,
            image: '/images/menu/store1_crave_corner_pune_veg_mania_1.jpg',
            description: 'Fresh assortment of farm-fresh crisp vegetables baked with signature seasoning and cheese.',
          },
          {
            name: 'Paneer Tikka Mania',
            price: 179,
            image: '/images/menu/store1_crave_corner_pune_veg_mania_2.jpg',
            description: 'Char-grilled spiced paneer cubes topped with aromatic herbs and melted mozzarella.',
          },
        ],
      },
      {
        name: 'Sandwich',
        items: [
          {
            name: 'Classic Veg Sandwich',
            price: 99,
            image: '/images/menu/store1_crave_corner_pune_sandwich_1.jpg',
            description: 'Crisp cucumbers, juicy tomatoes, and mint chutney layered between toasted bread.',
          },
          {
            name: 'Cheese Corn Sandwich',
            price: 129,
            image: '/images/menu/store1_crave_corner_pune_sandwich_2.jpg',
            description: 'Sweet corn kernels and molten cheese grilled crisp to golden brown perfection.',
          },
        ],
      },
      {
        name: 'Veg. Pizza',
        items: [
          {
            name: 'Farmhouse Pizza',
            price: 219,
            image: '/images/menu/store1_crave_corner_pune_veg_pizza_1.jpg',
            description: 'Crisp crust loaded with bell peppers, onions, tomatoes, and mushrooms.',
          },
          {
            name: 'Margherita Pizza',
            price: 179,
            image: '/images/menu/store1_crave_corner_pune_veg_pizza_2.jpg',
            description: 'Authentic pizza sauce, creamy mozzarella, and aromatic fresh sweet basil.',
          },
        ],
      },
      {
        name: 'Burger',
        items: [
          {
            name: 'Crispy Veg Burger',
            price: 119,
            image: '/images/menu/store1_crave_corner_pune_burger_1.jpg',
            description: 'Crunchy spiced vegetable patty with iceberg lettuce and creamy house mayo.',
          },
          {
            name: 'Cheese Paneer Burger',
            price: 159,
            image: '/images/menu/store1_crave_corner_pune_burger_2.jpg',
            description: 'Thick grilled cottage cheese patty topped with cheddar slice and tangy dressing.',
          },
        ],
      },
      {
        name: 'French Fries',
        items: [
          {
            name: 'Classic Salted Fries',
            price: 89,
            image: '/images/menu/store1_crave_corner_pune_french_fries_1.jpg',
            description: 'Crispy golden potato batons lightly sprinkled with rock salt.',
          },
          {
            name: 'Peri-Peri Fries',
            price: 109,
            image: '/images/menu/store1_crave_corner_pune_french_fries_2.jpg',
            description: 'Crunchy fries tossed in fiery and tangy peri-peri herb blend.',
          },
        ],
      },
      {
        name: 'Macaroni',
        items: [
          {
            name: 'Masala Macaroni',
            price: 119,
            image: '/images/menu/store1_crave_corner_pune_macaroni_1.jpg',
            description: 'Elbow pasta tossed in a robust Indian spiced tomato-onion tadka.',
          },
          {
            name: 'Cheesy Macaroni',
            price: 149,
            image: '/images/menu/store1_crave_corner_pune_macaroni_2.jpg',
            description: 'Tender macaroni smothered in a rich, decadent three-cheese sauce.',
          },
        ],
      },
      {
        name: 'Hot-Coffee',
        items: [
          {
            name: 'Classic Cappuccino',
            price: 99,
            image: '/images/menu/store1_crave_corner_pune_hot_coffee_1.jpg',
            description: 'Bold espresso shot topped with a thick layer of silky velvety milk foam.',
          },
          {
            name: 'Chocolate Coffee',
            price: 119,
            image: '/images/menu/store1_crave_corner_pune_hot_coffee_2.jpg',
            description: 'Freshly brewed espresso infused with dark chocolate and steamed milk.',
          },
        ],
      },
      {
        name: 'Ice-Tea',
        items: [
          {
            name: 'Lemon Iced Tea',
            price: 89,
            image: '/images/menu/store1_crave_corner_pune_ice_tea_1.jpg',
            description: 'Refreshing brewed iced tea infused with tangy lemon and fresh mint sprigs.',
          },
          {
            name: 'Peach Iced Tea',
            price: 109,
            image: '/images/menu/store1_crave_corner_pune_ice_tea_2.jpg',
            description: 'Chilled iced black tea blended with sweet and juicy summer peach notes.',
          },
        ],
      },
    ],
  },
  {
    name: 'Urban Bite Kitchen',
    location: 'College Road, Nashik, Maharashtra',
    adminEmail: 'uptown_admin@storepulse.com',
    categories: [
      {
        name: 'Veg. Mania',
        items: [
          {
            name: 'Spicy Veg Mania',
            price: 139,
            image: '/images/menu/store2_urban_bite_nashik_veg_mania_1.jpg',
            description: 'Zesty garden vegetables tossed in fiery house spices and baked golden.',
          },
          {
            name: 'Tandoori Paneer Mania',
            price: 179,
            image: '/images/menu/store2_urban_bite_nashik_veg_mania_2.jpg',
            description: 'Tandoori marinated cottage cheese with bell peppers and roasted spices.',
          },
        ],
      },
      {
        name: 'Sandwich',
        items: [
          {
            name: 'Bombay Masala Sandwich',
            price: 109,
            image: '/images/menu/store2_urban_bite_nashik_sandwich_1.jpg',
            description: 'Street-style spiced potato mash, beetroot, and green chutney toasted crisp.',
          },
          {
            name: 'Corn Cheese Grill',
            price: 139,
            image: '/images/menu/store2_urban_bite_nashik_sandwich_2.jpg',
            description: 'Triple-layered toasted sandwich loaded with sweet corn and molten cheese.',
          },
        ],
      },
      {
        name: 'Veg. Pizza',
        items: [
          {
            name: 'Tandoori Paneer Pizza',
            price: 239,
            image: '/images/menu/store2_urban_bite_nashik_veg_pizza_1.jpg',
            description: 'Marinated tandoori paneer, red onions, and crisp capsicum on thin crust.',
          },
          {
            name: 'Spicy Garden Pizza',
            price: 209,
            image: '/images/menu/store2_urban_bite_nashik_veg_pizza_2.jpg',
            description: 'Topped with spicy jalapenos, bell peppers, corn, and house marinara.',
          },
        ],
      },
      {
        name: 'Burger',
        items: [
          {
            name: 'Aloo Crunch Burger',
            price: 109,
            image: '/images/menu/store2_urban_bite_nashik_burger_1.jpg',
            description: 'Crispy herb potato patty layered with sliced onions, tomatoes, and spicy mayo.',
          },
          {
            name: 'Mexican Veg Burger',
            price: 149,
            image: '/images/menu/store2_urban_bite_nashik_burger_2.jpg',
            description: 'Spicy bean and corn patty loaded with tangy salsa, jalapenos, and cheddar.',
          },
        ],
      },
      {
        name: 'French Fries',
        items: [
          {
            name: 'Masala Fries',
            price: 99,
            image: '/images/menu/store2_urban_bite_nashik_french_fries_1.jpg',
            description: 'Crisp potato fries dusted with Nashik special chaat masala blend.',
          },
          {
            name: 'Cheese Fries',
            price: 129,
            image: '/images/menu/store2_urban_bite_nashik_french_fries_2.jpg',
            description: 'Hot golden fries drenched in rich, molten cheddar cheese sauce.',
          },
        ],
      },
      {
        name: 'Macaroni',
        items: [
          {
            name: 'Schezwan Macaroni',
            price: 129,
            image: '/images/menu/store2_urban_bite_nashik_macaroni_1.jpg',
            description: 'Wok-tossed macaroni pasta in a piquant, fiery Schezwan garlic sauce.',
          },
          {
            name: 'Creamy Herb Macaroni',
            price: 149,
            image: '/images/menu/store2_urban_bite_nashik_macaroni_2.jpg',
            description: 'Al dente macaroni simmered in garlic herb butter and fresh cream.',
          },
        ],
      },
      {
        name: 'Hot-Coffee',
        items: [
          {
            name: 'Filter Coffee',
            price: 79,
            image: '/images/menu/store2_urban_bite_nashik_hot_coffee_1.jpg',
            description: 'Authentic South Indian chicory-blend coffee decoction with frothed hot milk.',
          },
          {
            name: 'Mocha Coffee',
            price: 119,
            image: '/images/menu/store2_urban_bite_nashik_hot_coffee_2.jpg',
            description: 'A harmonious blend of bold espresso, Belgian cocoa, and velvety milk.',
          },
        ],
      },
      {
        name: 'Ice-Tea',
        items: [
          {
            name: 'Mint Lemon Iced Tea',
            price: 99,
            image: '/images/menu/store2_urban_bite_nashik_ice_tea_1.jpg',
            description: 'Crisp cold tea elevated with fresh bruised mint sprigs and lemon juice.',
          },
          {
            name: 'Green Apple Iced Tea',
            price: 109,
            image: '/images/menu/store2_urban_bite_nashik_ice_tea_2.jpg',
            description: 'Vibrant tart green apple syrup shaken with iced black tea.',
          },
        ],
      },
    ],
  },
  {
    name: 'Sai Snacks & Café',
    location: 'Pimpalwadi Road, Shirdi, Maharashtra',
    adminEmail: 'suburban_admin@storepulse.com',
    categories: [
      {
        name: 'Veg. Mania',
        items: [
          {
            name: 'Sai Special Veg Mania',
            price: 129,
            image: '/images/menu/store3_sai_snacks_shirdi_veg_mania_1.jpg',
            description: 'Traditional vegetable medley seasoned with mild aromatic herbs.',
          },
          {
            name: 'Paneer Cheese Mania',
            price: 169,
            image: '/images/menu/store3_sai_snacks_shirdi_veg_mania_2.jpg',
            description: 'Soft malai paneer cubes and mozzarella cheese baked to golden perfection.',
          },
        ],
      },
      {
        name: 'Sandwich',
        items: [
          {
            name: 'Garden Fresh Sandwich',
            price: 89,
            image: '/images/menu/store3_sai_snacks_shirdi_sandwich_1.jpg',
            description: 'Crisp lettuce, fresh sliced tomatoes, and crunchy bell peppers on buttered bread.',
          },
          {
            name: 'Grilled Cheese Sandwich',
            price: 119,
            image: '/images/menu/store3_sai_snacks_shirdi_sandwich_2.jpg',
            description: 'Classic golden toasted sourdough filled with melted mature cheddar cheese.',
          },
        ],
      },
      {
        name: 'Veg. Pizza',
        items: [
          {
            name: 'Temple Town Veg Pizza',
            price: 199,
            image: '/images/menu/store3_sai_snacks_shirdi_veg_pizza_1.jpg',
            description: 'Wholesome thin-crust pizza topped with freshly harvested seasonal vegetables.',
          },
          {
            name: 'Classic Cheese Pizza',
            price: 169,
            image: '/images/menu/store3_sai_snacks_shirdi_veg_pizza_2.jpg',
            description: 'Generous layer of 100% real mozzarella cheese on a zesty herb tomato base.',
          },
        ],
      },
      {
        name: 'Burger',
        items: [
          {
            name: 'Aloo Tikki Burger',
            price: 99,
            image: '/images/menu/store3_sai_snacks_shirdi_burger_1.jpg',
            description: 'Golden fried spiced potato tikki tucked inside a soft toasted sesame bun.',
          },
          {
            name: 'Paneer Delight Burger',
            price: 149,
            image: '/images/menu/store3_sai_snacks_shirdi_burger_2.jpg',
            description: 'Succulent paneer patty seasoned with aromatic herbs and fresh crunchy lettuce.',
          },
        ],
      },
      {
        name: 'French Fries',
        items: [
          {
            name: 'Salted Fries',
            price: 79,
            image: '/images/menu/store3_sai_snacks_shirdi_french_fries_1.jpg',
            description: 'Light, crisp, and perfectly salted fresh potato fries.',
          },
          {
            name: 'Chaat Masala Fries',
            price: 99,
            image: '/images/menu/store3_sai_snacks_shirdi_french_fries_2.jpg',
            description: 'Crunchy fries tossed in tangy Indian chaat spices and lemon zest.',
          },
        ],
      },
      {
        name: 'Macaroni',
        items: [
          {
            name: 'Desi Masala Macaroni',
            price: 109,
            image: '/images/menu/store3_sai_snacks_shirdi_macaroni_1.jpg',
            description: 'Comforting homestyle macaroni cooked with ginger, garlic, and fresh coriander.',
          },
          {
            name: 'Cheese Corn Macaroni',
            price: 139,
            image: '/images/menu/store3_sai_snacks_shirdi_macaroni_2.jpg',
            description: 'Tender elbow pasta with sweet corn kernels bathed in rich cream cheese.',
          },
        ],
      },
      {
        name: 'Hot-Coffee',
        items: [
          {
            name: 'Classic Hot Coffee',
            price: 69,
            image: '/images/menu/store3_sai_snacks_shirdi_hot_coffee_1.jpg',
            description: 'Steaming aromatic cup of smooth roasted coffee brewed fresh to order.',
          },
          {
            name: 'Strong Filter Coffee',
            price: 79,
            image: '/images/menu/store3_sai_snacks_shirdi_hot_coffee_2.jpg',
            description: 'Extra bold dark roast South Indian filter coffee with a frothy head.',
          },
        ],
      },
      {
        name: 'Ice-Tea',
        items: [
          {
            name: 'Lemon Ice Tea',
            price: 79,
            image: '/images/menu/store3_sai_snacks_shirdi_ice_tea_1.jpg',
            description: 'Classic chilled iced tea infused with sunny lemon slices and crushed ice.',
          },
          {
            name: 'Peach Ice Tea',
            price: 99,
            image: '/images/menu/store3_sai_snacks_shirdi_ice_tea_2.jpg',
            description: 'Fragrant cold-brewed black tea kissed with luscious natural peach nectar.',
          },
        ],
      },
    ],
  },
  {
    name: 'Nagar Food Hub',
    location: 'Savedi, Ahilyanagar, Maharashtra',
    adminEmail: 'metro_admin@storepulse.com',
    categories: [
      {
        name: 'Veg. Mania',
        items: [
          {
            name: 'Nagar Special Mania',
            price: 139,
            image: '/images/menu/store4_nagar_food_hub_veg_mania_1.jpg',
            description: 'Chef special vegetable medley baked with authentic Ahilyanagar spices.',
          },
          {
            name: 'Double Cheese Veg Mania',
            price: 169,
            image: '/images/menu/store4_nagar_food_hub_veg_mania_2.jpg',
            description: 'Double portions of melted mozzarella and cheddar over crisp seasoned veggies.',
          },
        ],
      },
      {
        name: 'Sandwich',
        items: [
          {
            name: 'Veg Club Sandwich',
            price: 159,
            image: '/images/menu/store4_nagar_food_hub_sandwich_1.jpg',
            description: 'Double-decker toasted sandwich with cheese, garden veggies, and herb dressing.',
          },
          {
            name: 'Chilli Cheese Sandwich',
            price: 119,
            image: '/images/menu/store4_nagar_food_hub_sandwich_2.jpg',
            description: 'Spicy green chillies and melted cheddar cheese on toasted artisan bread.',
          },
        ],
      },
      {
        name: 'Veg. Pizza',
        items: [
          {
            name: 'Double Cheese Pizza',
            price: 229,
            image: '/images/menu/store4_nagar_food_hub_veg_pizza_1.jpg',
            description: 'Overflowing with molten mozzarella cheese blend over rich Italian marinara.',
          },
          {
            name: 'Corn Capsicum Pizza',
            price: 199,
            image: '/images/menu/store4_nagar_food_hub_veg_pizza_2.jpg',
            description: 'Sweet golden corn paired with crunchy green capsicum and melted cheese.',
          },
        ],
      },
      {
        name: 'Burger',
        items: [
          {
            name: 'Double Patty Veg Burger',
            price: 169,
            image: '/images/menu/store4_nagar_food_hub_burger_1.jpg',
            description: 'Two hearty vegetable patties stacked with cheese slice, onion, and tomato.',
          },
          {
            name: 'Crispy Cheese Burger',
            price: 139,
            image: '/images/menu/store4_nagar_food_hub_burger_2.jpg',
            description: 'Crispy seasoned patty crowned with an oozing crumbed cheese center.',
          },
        ],
      },
      {
        name: 'French Fries',
        items: [
          {
            name: 'Classic Fries',
            price: 89,
            image: '/images/menu/store4_nagar_food_hub_french_fries_1.jpg',
            description: 'Traditional straight-cut golden fries, crisp on the outside and fluffy inside.',
          },
          {
            name: 'Peri-Peri Cheese Fries',
            price: 139,
            image: '/images/menu/store4_nagar_food_hub_french_fries_2.jpg',
            description: 'Spicy peri-peri fries drenched in hot liquid cheddar cheese sauce.',
          },
        ],
      },
      {
        name: 'Macaroni',
        items: [
          {
            name: 'Spicy Tomato Macaroni',
            price: 119,
            image: '/images/menu/store4_nagar_food_hub_macaroni_1.jpg',
            description: 'Zesty sun-dried tomato sauce infused with chilli flakes, garlic, and fresh herbs.',
          },
          {
            name: 'Creamy Cheese Macaroni',
            price: 149,
            image: '/images/menu/store4_nagar_food_hub_macaroni_2.jpg',
            description: 'Velvety smooth white cheese sauce tossed with tender baked macaroni pasta.',
          },
        ],
      },
      {
        name: 'Hot-Coffee',
        items: [
          {
            name: 'Classic Cappuccino',
            price: 99,
            image: '/images/menu/store4_nagar_food_hub_hot_coffee_1.jpg',
            description: 'Equal parts bold espresso, steamed milk, and airy foam dusted with cinnamon.',
          },
          {
            name: 'Vanilla Coffee',
            price: 109,
            image: '/images/menu/store4_nagar_food_hub_hot_coffee_2.jpg',
            description: 'Steaming hot coffee infused with aromatic Madagascar vanilla extract.',
          },
        ],
      },
      {
        name: 'Ice-Tea',
        items: [
          {
            name: 'Lemon Mint Ice Tea',
            price: 89,
            image: '/images/menu/store4_nagar_food_hub_ice_tea_1.jpg',
            description: 'Invigorating blend of freshly squeezed lemon juice, garden mint, and iced tea.',
          },
          {
            name: 'Peach Ice Tea',
            price: 109,
            image: '/images/menu/store4_nagar_food_hub_ice_tea_2.jpg',
            description: 'Subtly sweet and refreshing peach infused cold brewed black tea.',
          },
        ],
      },
    ],
  },
];

export async function seed() {
  logger.info('Starting idempotent database seed for 4 Stores with 64 High-Res Menu Items...');

  // 1. Ensure required admin users exist without deleting or altering any existing accounts
  const passwordHash = await bcrypt.hash('admin123', 10);
  const defaultAdmins = [
    { email: 'admin@storepulse.com', name: 'StorePulse SuperAdmin', role: 'SUPERADMIN' as const },
    { email: 'central_admin@storepulse.com', name: 'Central Bistro Manager', role: 'ADMIN' as const },
    { email: 'uptown_admin@storepulse.com', name: 'Uptown Grill Manager', role: 'ADMIN' as const },
    { email: 'suburban_admin@storepulse.com', name: 'Suburban House Manager', role: 'ADMIN' as const },
    { email: 'metro_admin@storepulse.com', name: 'Metro Express Manager', role: 'ADMIN' as const },
  ];

  for (const adm of defaultAdmins) {
    const existing = await prisma.user.findUnique({ where: { email: adm.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: adm.email,
          name: adm.name,
          role: adm.role,
          password_hash: passwordHash,
        },
      });
      logger.info(`Created default admin account: ${adm.email}`);
    }
  }

  // 2. Iterate through each store, creating or updating safely
  let totalStoresCount = 0;
  let totalCategoriesCount = 0;
  let totalItemsCount = 0;

  for (const storeData of STORES_DATA) {
    // Find designated admin user
    let admin = await prisma.user.findUnique({ where: { email: storeData.adminEmail } });
    if (!admin) {
      admin = await prisma.user.findFirst({ where: { role: { in: ['SUPERADMIN', 'ADMIN'] } } });
    }
    if (!admin) {
      throw new Error(`Cannot seed store ${storeData.name}: No admin user found.`);
    }

    // Check if store already exists by exact name
    let store = await prisma.store.findFirst({
      where: { name: storeData.name },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          name: storeData.name,
          location: storeData.location,
          admin_id: admin.id,
          is_active: true,
        },
      });
      logger.info(`Created store: ${store.name} (${store.id})`);
    } else {
      // Update location and admin if changed
      store = await prisma.store.update({
        where: { id: store.id },
        data: {
          location: storeData.location,
          admin_id: admin.id,
          is_active: true,
        },
      });
      logger.info(`Reusing existing store: ${store.name} (${store.id})`);
    }
    totalStoresCount++;

    // 3. Categories and items for this store
    for (const catData of storeData.categories) {
      let category = await prisma.category.findFirst({
        where: {
          name: catData.name,
          store_id: store.id,
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: catData.name,
            store_id: store.id,
          },
        });
      }
      totalCategoriesCount++;

      for (const itemData of catData.items) {
        let item = await prisma.item.findFirst({
          where: {
            name: itemData.name,
            store_id: store.id,
          },
        });

        if (!item) {
          await prisma.item.create({
            data: {
              name: itemData.name,
              description: itemData.description,
              price: itemData.price,
              image_url: itemData.image,
              category_id: category.id,
              store_id: store.id,
              is_active: true,
              rating: 4.8,
            },
          });
        } else {
          await prisma.item.update({
            where: { id: item.id },
            data: {
              description: itemData.description,
              price: itemData.price,
              image_url: itemData.image,
              category_id: category.id,
              is_active: true,
            },
          });
        }
        totalItemsCount++;
      }
    }
  }

  logger.info(`\nSeeded successfully:`);
  logger.info(`- ${totalStoresCount} Stores`);
  logger.info(`- ${totalCategoriesCount} Categories`);
  logger.info(`- ${totalItemsCount} Menu Items`);

  // 4. Invalidate Redis menu & store cache
  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    await redis.flushdb();
    logger.info('Cleaned store & menu Redis cache keys successfully');
  } catch (err: any) {
    logger.warn(`Redis cache clear note: ${err.message}`);
  } finally {
    try {
      await redis.quit();
    } catch {}
  }
}

if (require.main === module) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      logger.error('Seed error:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
