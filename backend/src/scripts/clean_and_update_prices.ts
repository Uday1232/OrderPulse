import { prisma } from '../config/db';

async function main() {
  console.log('--- 1. Inspecting and removing "Seaside Pavilion" stores ---');
  const seasideStores = await prisma.store.findMany({
    where: {
      OR: [
        { name: { contains: 'Seaside Pavilion', mode: 'insensitive' } },
        { location: { contains: 'Beachfront Road', mode: 'insensitive' } },
        { name: { contains: 'Pavilion', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, location: true },
  });

  console.log(`Found ${seasideStores.length} Seaside Pavilion store(s) to remove:`, seasideStores);

  for (const store of seasideStores) {
    // Delete any orders, items, categories associated with this store
    await prisma.orderArchive.deleteMany({ where: { store_id: store.id } });
    await prisma.order.deleteMany({ where: { store_id: store.id } });
    await prisma.item.deleteMany({ where: { category: { store_id: store.id } } });
    await prisma.category.deleteMany({ where: { store_id: store.id } });
    await prisma.store.delete({ where: { id: store.id } });
    console.log(`✓ Deleted store "${store.name}" (${store.id})`);
  }

  console.log('\n--- 2. Updating item prices to real-world market prices (INR ₹) ---');

  const priceMapping: Record<string, number> = {
    // Central Cafe & Bistro
    'Classic Margherita Veg. Pizza': 279.0,
    'Grilled Italian Club Sandwich': 189.0,
    'Crispy Cheddar Bacon Burger': 219.0,
    'Golden Salted French Fries': 109.0,
    'Artisanal Hot Cappuccino': 149.0,
    'Iced Peach Lemon Tea': 129.0,

    // Uptown Pizzeria & Grill
    'Pepperoni & Mozzarella Pizza': 349.0,
    'Toasted Submarine Sandwich': 199.0,
    'Smoky BBQ Double Burger': 249.0,
    'Crispy Peri Peri French Fries': 129.0,
    'Vanilla Latte Hot-Coffee': 169.0,
    'Cold Brew Ice-Tea': 139.0,

    // Suburban Gourmet House
    'Truffle Mushroom Veg. Pizza': 369.0,
    'Avocado Club Veg. Sandwich': 219.0,
    'Melted Swiss Mushroom Burger': 239.0,
    'Seasoned Curly French Fries': 139.0,
    'Caramel Macchiato Hot-Coffee': 179.0,
    'Classic Iced Lemon Tea': 119.0,

    // Metro Deli & Express
    'Four Cheese Crisp Pizza': 329.0,
    'Classic Deli Submarine Sandwich': 209.0,
    'Veg. Mania Crunch Burger': 199.0,
    'Loaded Cheesy French Fries': 149.0,
    'Dark Roasted Espresso Coffee': 119.0,
    'Berry Hibiscus Ice-Tea': 139.0,
  };

  // Update known items by name
  for (const [name, realPrice] of Object.entries(priceMapping)) {
    const updated = await prisma.item.updateMany({
      where: { name: { equals: name, mode: 'insensitive' } },
      data: { price: realPrice },
    });
    if (updated.count > 0) {
      console.log(`✓ Updated "${name}" -> ₹${realPrice} (${updated.count} items)`);
    }
  }

  // Also scale up any remaining items that still have small USD-like prices (< 50)
  const remainingLowPriceItems = await prisma.item.findMany({
    where: { price: { lt: 50 } },
    select: { id: true, name: true, price: true },
  });

  console.log(`\nFound ${remainingLowPriceItems.length} other items with low prices to adjust:`);
  for (const it of remainingLowPriceItems) {
    const newPrice = Math.round(it.price * 20); // Scale by standard realistic multiplier
    await prisma.item.update({
      where: { id: it.id },
      data: { price: Math.max(newPrice, 99) },
    });
    console.log(`✓ Scaled "${it.name}": ₹${it.price} -> ₹${Math.max(newPrice, 99)}`);
  }

  // Print all stores remaining
  const remainingStores = await prisma.store.findMany({
    select: { id: true, name: true, location: true },
    orderBy: { name: 'asc' },
  });

  console.log(`\n--- Remaining Active Stores (${remainingStores.length}) ---`);
  for (const st of remainingStores) {
    console.log(`• ${st.name} (${st.location})`);
  }
}

main()
  .catch((e) => {
    console.error('Error running clean_and_update_prices:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
