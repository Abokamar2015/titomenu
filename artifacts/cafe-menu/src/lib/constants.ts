export const ROUTE_PATHS = {
  HOME: '/',
  MENU: '/menu',
  ADMIN: '/admin',
} as const;

export const CATEGORIES = {
  hot: { labelAr: 'مشروبات ساخنة', labelEn: 'Hot Drinks', icon: '☕' },
  cold: { labelAr: 'مشروبات باردة', labelEn: 'Cold Drinks', icon: '🧊' },
  dessert: { labelAr: 'الحلى', labelEn: 'Dessert', icon: '🍰' },
  sandwich: { labelAr: 'ساندوتش', labelEn: 'Sandwich', icon: '🥪' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
