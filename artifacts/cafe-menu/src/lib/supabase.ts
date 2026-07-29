// Backend client for the menu platform.
// Talks to the api-server (Express + Supabase Postgres/Storage) over /api.
// Multi-tenant: public pages are scoped by restaurant slug, admin calls are
// scoped by the selected restaurant id (from the user's memberships).

const API = "/api";
const TOKEN_KEY = "admin_token";
const RESTAURANT_KEY = "admin_restaurant_id";
const RESTAURANT_SLUG_KEY = "admin_restaurant_slug";
export const DEFAULT_SLUG = "and-co";

// ===== AUTH / SESSION =====

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  is_super_admin: boolean;
}

export interface MembershipInfo {
  restaurant_id: string;
  role: "owner" | "manager" | "staff";
  slug: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setAuthToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function logout(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(RESTAURANT_KEY);
  sessionStorage.removeItem(RESTAURANT_SLUG_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function getCurrentRestaurantId(): string | null {
  return sessionStorage.getItem(RESTAURANT_KEY);
}

export function setCurrentRestaurant(id: string, slug: string): void {
  sessionStorage.setItem(RESTAURANT_KEY, id);
  sessionStorage.setItem(RESTAURANT_SLUG_KEY, slug);
}

export function getCurrentRestaurantSlug(): string | null {
  return sessionStorage.getItem(RESTAURANT_SLUG_KEY);
}

/** Log in with email + password. Returns memberships on success, null on failure. */
export async function login(
  email: string,
  password: string,
): Promise<{ user: SessionUser; memberships: MembershipInfo[] } | null> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    token: string;
    user: SessionUser;
    memberships: MembershipInfo[];
  };
  if (!data.token) return null;
  setAuthToken(data.token);
  if (data.memberships.length > 0) {
    setCurrentRestaurant(
      data.memberships[0].restaurant_id,
      data.memberships[0].slug,
    );
  }
  return { user: data.user, memberships: data.memberships };
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (res.status === 401) {
    logout();
    throw new Error(
      `API ${init?.method ?? "GET"} ${path} failed: unauthorized`,
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API ${init?.method ?? "GET"} ${path} failed: ${res.status} ${text}`,
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Admin base path for the currently selected restaurant. */
function adminBase(): string {
  const rid = getCurrentRestaurantId();
  if (!rid) throw new Error("No restaurant selected — please log in again");
  return `/restaurants/${rid}`;
}

// ===== PUBLIC SLUG HELPERS =====

function normalizeSlug(slug?: string | null): string {
  return slug && slug.trim() ? slug.trim() : DEFAULT_SLUG;
}

// ===== TYPES =====

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

export type MenuItemInsert = Omit<MenuItem, "id" | "created_at" | "updated_at">;
export type MenuItemUpdate = Partial<MenuItemInsert>;

export interface Category {
  key: string;
  name_ar: string;
  name_en: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
}

// ===== PUBLIC MENU (slug-scoped, no auth) =====

export async function fetchPublicMenuItems(
  slug?: string | null,
): Promise<MenuItem[]> {
  return apiFetch<MenuItem[]>(
    `/public/${encodeURIComponent(normalizeSlug(slug))}/items?available=true`,
  );
}

export async function fetchPublicCategories(
  slug?: string | null,
): Promise<Category[]> {
  return apiFetch<Category[]>(
    `/public/${encodeURIComponent(normalizeSlug(slug))}/categories`,
  );
}

// ===== ADMIN MENU ITEMS (restaurant-scoped) =====

export async function fetchMenuItems(): Promise<MenuItem[]> {
  return apiFetch<MenuItem[]>(`${adminBase()}/menu/items`);
}

export async function createMenuItem(item: MenuItemInsert): Promise<MenuItem> {
  return apiFetch<MenuItem>(`${adminBase()}/menu/items`, {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function updateMenuItem(
  id: string,
  updates: MenuItemUpdate,
): Promise<MenuItem> {
  return apiFetch<MenuItem>(`${adminBase()}/menu/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteMenuItem(id: string): Promise<void> {
  await apiFetch<void>(`${adminBase()}/menu/items/${id}`, {
    method: "DELETE",
  });
}

export async function toggleItemAvailability(
  id: string,
  is_available: boolean,
): Promise<void> {
  await apiFetch<void>(`${adminBase()}/menu/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_available }),
  });
}

export async function updateSortOrders(
  updates: { id: string; sort_order: number }[],
): Promise<void> {
  await apiFetch<void>(`${adminBase()}/menu/items/sort-orders`, {
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
  bg_color: "#1a1a1a",
  card_color: "#242424",
  primary_color: "#E8622A",
  text_color: "#F0EBE3",
  border_color: "#333333",
};

function rowsToTheme(rows: { key: string; value: string }[]): ThemeSettings {
  const map: Record<string, string> = {};
  rows.forEach((row) => {
    map[row.key] = row.value;
  });
  return {
    bg_color: map["bg_color"] ?? DEFAULT_THEME.bg_color,
    card_color: map["card_color"] ?? DEFAULT_THEME.card_color,
    primary_color: map["primary_color"] ?? DEFAULT_THEME.primary_color,
    text_color: map["text_color"] ?? DEFAULT_THEME.text_color,
    border_color: map["border_color"] ?? DEFAULT_THEME.border_color,
  };
}

/** Public (slug-scoped) theme settings — used by the menu pages. */
export async function fetchThemeSettings(
  slug?: string | null,
): Promise<ThemeSettings> {
  try {
    const rows = await apiFetch<{ key: string; value: string }[]>(
      `/public/${encodeURIComponent(normalizeSlug(slug))}/settings`,
    );
    return rowsToTheme(rows);
  } catch {
    return DEFAULT_THEME;
  }
}

/** Admin (restaurant-scoped) theme settings. */
export async function fetchAdminThemeSettings(): Promise<ThemeSettings> {
  try {
    const rows = await apiFetch<{ key: string; value: string }[]>(
      `${adminBase()}/menu/settings`,
    );
    return rowsToTheme(rows);
  } catch {
    return DEFAULT_THEME;
  }
}

export async function saveThemeSetting(
  key: string,
  value: string,
): Promise<void> {
  await apiFetch<void>(
    `${adminBase()}/menu/settings/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      body: JSON.stringify({ value }),
    },
  );
}

export function applyTheme(theme: ThemeSettings): void {
  const root = document.documentElement;
  root.style.setProperty("--theme-bg", theme.bg_color);
  root.style.setProperty("--theme-card", theme.card_color);
  root.style.setProperty("--theme-primary", theme.primary_color);
  root.style.setProperty("--theme-text", theme.text_color);
  root.style.setProperty("--theme-border", theme.border_color);
}

// ===== STORAGE (signed upload URLs) =====

async function uploadImage(file: File): Promise<string> {
  const reqRes = await fetch(
    `${API}${adminBase()}/storage/uploads/request-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    },
  );
  if (reqRes.status === 401) {
    logout();
    throw new Error("Failed to request upload URL: unauthorized");
  }
  if (!reqRes.ok)
    throw new Error(`Failed to request upload URL: ${reqRes.status}`);
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
}

export async function uploadCategoryImage(file: File): Promise<string> {
  return uploadImage(file);
}

// ===== ADMIN CATEGORIES (restaurant-scoped) =====

export async function fetchCategories(): Promise<Category[]> {
  // Admin context when logged in; public otherwise (menu pages should use
  // fetchPublicCategories explicitly).
  if (isAuthenticated() && getCurrentRestaurantId()) {
    return apiFetch<Category[]>(`${adminBase()}/menu/categories`);
  }
  return fetchPublicCategories();
}

export async function createCategory(cat: Category): Promise<void> {
  await apiFetch<Category>(`${adminBase()}/menu/categories`, {
    method: "POST",
    body: JSON.stringify({ ...cat, is_active: true }),
  });
}

export async function updateCategory(
  key: string,
  updates: Partial<Category>,
): Promise<void> {
  await apiFetch<Category>(
    `${adminBase()}/menu/categories/${encodeURIComponent(key)}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    },
  );
}

export async function deleteCategory(key: string): Promise<void> {
  await apiFetch<void>(
    `${adminBase()}/menu/categories/${encodeURIComponent(key)}`,
    {
      method: "DELETE",
    },
  );
}
