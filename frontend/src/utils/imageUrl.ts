/**
 * Utility to resolve media and uploaded image URLs across frontend and backend dev/production environments.
 */
export function getMediaUrl(url?: string | null, fallback = '/images/menu/master_burger.jpg'): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }

  const trimmed = url.trim();

  // Fully qualified URL (Cloudinary, S3, or external)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Local uploads served by Express backend
  if (trimmed.startsWith('/uploads/')) {
    const backend = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    // Strip trailing /api/v1 if present to get server origin
    const baseUrl = backend.replace(/\/api\/v1\/?$/, '');
    return `${baseUrl}${trimmed}`;
  }

  // Local frontend assets (in public/ directory)
  return trimmed;
}

/**
 * Maps category names to master high-resolution fallback photos
 */
export function getCategoryFallback(categoryName?: string): string {
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('mania')) return '/images/menu/master_veg_mania.jpg';
  if (cat.includes('sandwich')) return '/images/menu/master_sandwich.jpg';
  if (cat.includes('pizza')) return '/images/menu/master_veg_pizza.jpg';
  if (cat.includes('burger')) return '/images/menu/master_burger.jpg';
  if (cat.includes('fries')) return '/images/menu/master_french_fries.jpg';
  if (cat.includes('macaroni')) return '/images/menu/master_macaroni.jpg';
  if (cat.includes('coffee')) return '/images/menu/master_hot_coffee.jpg';
  if (cat.includes('tea')) return '/images/menu/master_ice_tea.jpg';
  return '/images/menu/master_burger.jpg';
}
