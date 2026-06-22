// Backend client for the cafe menu.
// Talks to the Replit api-server (Express + Postgres + object storage) over /api.
// Function signatures are kept stable so page components need no changes.

const API = "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${init?.method ?? "GET"} ${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

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
  return apiFetch<MenuItem[]>("/menu/items");
}

export async function fetchPublicMenuItems(): Promise<MenuItem[]> {
  return apiFetch<MenuItem[]>("/menu/items?available=true");
}

export async function createMenuItem(item: MenuItemInsert): Promise<MenuItem> {
  return apiFetch<MenuItem>("/menu/items", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function updateMenuItem(id: string, updates: MenuItemUpdate): Promise<MenuItem> {
  return apiFetch<MenuItem>(`/menu/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteMenuItem(id: string): Promise<void> {
  await apiFetch<void>(`/menu/items/${id}`, { method: "DELETE" });
}

export async function toggleItemAvailability(id: string, is_available: boolean): Promise<void> {
  await apiFetch<void>(`/menu/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_available }),
  });
}

export async function updateSortOrders(updates: { id: string; sort_order: number }[]): Promise<void> {
  await apiFetch<void>("/menu/items/sort-orders", {
    method: "PATCH",
    body: JSON.stringify({ updates }),
  });
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
  try {
    const rows = await apiFetch<{ key: string; value: string }[]>("/menu/settings");
    const map: Record<string, string> = {};
    rows.forEach((row) => { map[row.key] = row.value; });
    return {
      bg_color: map['bg_color'] ?? DEFAULT_THEME.bg_color,
      card_color: map['card_color'] ?? DEFAULT_THEME.card_color,
      primary_color: map['primary_color'] ?? DEFAULT_THEME.primary_color,
      text_color: map['text_color'] ?? DEFAULT_THEME.text_color,
      border_color: map['border_color'] ?? DEFAULT_THEME.border_color,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export async function saveThemeSetting(key: string, value: string): Promise<void> {
  await apiFetch<void>(`/menu/settings/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

export function applyTheme(theme: ThemeSettings): void {
  const root = document.documentElement;
  root.style.setProperty('--theme-bg', theme.bg_color);
  root.style.setProperty('--theme-card', theme.card_color);
  root.style.setProperty('--theme-primary', theme.primary_color);
  root.style.setProperty('--theme-text', theme.text_color);
  root.style.setProperty('--theme-border', theme.border_color);
}

// ===== STORAGE (object storage via presigned upload) =====
async function uploadImage(file: File): Promise<string> {
  const reqRes = await fetch(`${API}/storage/uploads/request-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!reqRes.ok) throw new Error(`Failed to request upload URL: ${reqRes.status}`);
  const { uploadURL, objectPath } = (await reqRes.json()) as {
    uploadURL: string;
    objectPath: string;
  };

  const putRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) throw new Error(`Failed to upload file: ${putRes.status}`);

  return `${API}/storage${objectPath}`;
}

export async function uploadMenuImage(file: File): Promise<string> {
  return uploadImage(file);
}

export async function deleteMenuImage(_imageUrl: string): Promise<void> {
  // Object storage cleanup is a no-op; orphaned objects are negligible in cost.
  // Kept for API compatibility with callers.
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
  return uploadImage(file);
}

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/menu/categories");
}

export async function createCategory(cat: Category): Promise<void> {
  await apiFetch<Category>("/menu/categories", {
    method: "POST",
    body: JSON.stringify({ ...cat, is_active: true }),
  });
}

export async function updateCategory(key: string, updates: Partial<Category>): Promise<void> {
  await apiFetch<Category>(`/menu/categories/${encodeURIComponent(key)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteCategory(key: string): Promise<void> {
  await apiFetch<void>(`/menu/categories/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
}
