import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface MenuItem {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  calories: number | null;
  category: string;
  is_available: boolean;
  sort_order: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type MenuItemInsert = Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>;
export type MenuItemUpdate = Partial<MenuItemInsert>;

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchPublicMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('category')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function createMenuItem(item: MenuItemInsert): Promise<MenuItem> {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMenuItem(id: string, updates: MenuItemUpdate): Promise<MenuItem> {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleItemAvailability(id: string, is_available: boolean): Promise<void> {
  const { error } = await supabase.from('menu_items').update({ is_available }).eq('id', id);
  if (error) throw error;
}

export async function updateSortOrders(updates: { id: string; sort_order: number }[]): Promise<void> {
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase.from('menu_items').update({ sort_order }).eq('id', id)
    )
  );
}

// ===== THEME SETTINGS =====
export interface ThemeSettings {
  bg_color: string;
  card_color: string;
  primary_color: string;
  text_color: string;
  border_color: string;
}

export const DEFAULT_THEME: ThemeSettings = {
  bg_color: '#1a1a1a',
  card_color: '#242424',
  primary_color: '#E8622A',
  text_color: '#F0EBE3',
  border_color: '#333333',
};

export async function fetchThemeSettings(): Promise<ThemeSettings> {
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error || !data) return DEFAULT_THEME;
  const map: Record<string, string> = {};
  data.forEach(row => { map[row.key] = row.value; });
  return {
    bg_color: map['bg_color'] ?? DEFAULT_THEME.bg_color,
    card_color: map['card_color'] ?? DEFAULT_THEME.card_color,
    primary_color: map['primary_color'] ?? DEFAULT_THEME.primary_color,
    text_color: map['text_color'] ?? DEFAULT_THEME.text_color,
    border_color: map['border_color'] ?? DEFAULT_THEME.border_color,
  };
}

export async function saveThemeSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

export function applyTheme(theme: ThemeSettings): void {
  const root = document.documentElement;
  root.style.setProperty('--theme-bg', theme.bg_color);
  root.style.setProperty('--theme-card', theme.card_color);
  root.style.setProperty('--theme-primary', theme.primary_color);
  root.style.setProperty('--theme-text', theme.text_color);
  root.style.setProperty('--theme-border', theme.border_color);
}

// ===== STORAGE =====
const BUCKET = 'menu-images';

export async function uploadMenuImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `item_${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteMenuImage(imageUrl: string): Promise<void> {
  const fileName = imageUrl.split('/').pop();
  if (!fileName) return;
  await supabase.storage.from(BUCKET).remove([fileName]);
}

// ===== CATEGORIES =====
export interface Category {
  key: string;
  name_ar: string;
  name_en: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
}

export async function uploadCategoryImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `cat_${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('menu-images')
    .upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function createCategory(cat: Category): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .insert({ ...cat, is_active: true });
  if (error) throw error;
}

export async function updateCategory(key: string, updates: Partial<Category>): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update(updates)
    .eq('key', key);
  if (error) throw error;
}

export async function deleteCategory(key: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('key', key);
  if (error) throw error;
}
