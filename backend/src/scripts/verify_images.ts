import fs from 'fs';
import path from 'path';
import { prisma } from '../config/db';

async function check() {
  const items = await prisma.item.findMany({ select: { name: true, image_url: true } });
  let missing = 0;
  for (const it of items) {
    const cleanPath = it.image_url.startsWith('/') ? it.image_url.slice(1) : it.image_url;
    const full = path.join(__dirname, '../../../frontend/public', cleanPath);
    if (!fs.existsSync(full)) {
      console.error('MISSING:', it.name, full);
      missing++;
    }
  }
  console.log(`Verified ${items.length} items. Missing image files: ${missing}`);
  await prisma.$disconnect();
}
check();
