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
  avatar_url?: string | null;
  created_at?: string | null;
  last_login_at?: string | null;
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

const USER_KEY = "admin_user";
const MEMBERSHIP_KEY = "admin_membership";

export function logout(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(RESTAURANT_KEY);
  sessionStorage.removeItem(RESTAURANT_SLUG_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(MEMBERSHIP_KEY);
}

export function getCurrentUser(): SessionUser | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function getCurrentMembership(): MembershipInfo | null {
  const raw = sessionStorage.getItem(MEMBERSHIP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MembershipInfo;
  } catch {
    return null;
  }
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
  // Reset all prior session context first so a previous login (e.g. a tenant
  // admin) never leaks restaurant/membership state into the new session.
  logout();
  setAuthToken(data.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
  if (data.memberships.length > 0) {
    setCurrentRestaurant(
      data.memberships[0].restaurant_id,
      data.memberships[0].slug,
    );
    sessionStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(data.memberships[0]));
  }
  return { user: data.user, memberships: data.memberships };
}

/**
 * Change the current user's password.
 * Returns null on success, or an Arabic error message on failure.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<string | null> {
  const res = await fetch(`${API}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  if (res.status === 204) return null;
  if (res.status === 401) return "كلمة المرور الحالية غير صحيحة";
  if (res.status === 400) return "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل";
  return "حدث خطأ، حاول مرة أخرى";
}

/**
 * Update the current user's profile (name / email / avatar).
 * Returns the updated user on success, or an Arabic error message string.
 */
export async function updateProfile(updates: {
  name?: string;
  email?: string;
  avatar_url?: string;
  current_password?: string;
}): Promise<SessionUser | string> {
  const res = await fetch(`${API}/auth/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(updates),
  });
  if (res.status === 409) return "البريد الإلكتروني مستخدم من حساب آخر";
  if (res.status === 403) return "كلمة المرور غير صحيحة — مطلوبة لتغيير البريد الإلكتروني";
  if (res.status === 400) return "بيانات غير صالحة — تأكد من صحة البريد الإلكتروني";
  if (res.status === 401) {
    logout();
    return "انتهت الجلسة، سجّل الدخول مجددًا";
  }
  if (!res.ok) return "حدث خطأ، حاول مرة أخرى";
  const data = (await res.json()) as { user: SessionUser };
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

/** Refresh the stored session user from the server. */
export async function refreshSessionUser(): Promise<SessionUser | null> {
  try {
    const data = await apiFetch<{ user: SessionUser }>(`/auth/me`);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  } catch {
    return null;
  }
}

/** Upload a profile avatar image; returns its public object path. */
export async function uploadAvatar(file: File): Promise<string> {
  const reqRes = await fetch(`${API}/me/storage/uploads/request-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type,
    }),
  });
  if (reqRes.status === 401) {
    logout();
    throw new Error("unauthorized");
  }
  if (!reqRes.ok) throw new Error(`Failed to request upload URL: ${reqRes.status}`);
  const { uploadURL, objectPath } = (await reqRes.json()) as {
    uploadURL: string;
    objectPath: string;
  };
  const putRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);
  return `${API}/storage${objectPath}`;
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

// ===== PUBLIC RESTAURANT INFO & BRANDING =====

export interface PublicRestaurant {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
}

/** Public (slug-scoped) restaurant basic info. Returns null on failure. */
export async function fetchPublicRestaurant(
  slug?: string | null,
): Promise<PublicRestaurant | null> {
  try {
    return await apiFetch<PublicRestaurant>(
      `/public/${encodeURIComponent(normalizeSlug(slug))}/restaurant`,
    );
  } catch {
    return null;
  }
}

/** Public (slug-scoped) raw settings map: theme colors, branding, contacts. */
export async function fetchPublicSettings(
  slug?: string | null,
): Promise<Record<string, string>> {
  try {
    const rows = await apiFetch<{ key: string; value: string }[]>(
      `/public/${encodeURIComponent(normalizeSlug(slug))}/settings`,
    );
    const map: Record<string, string> = {};
    rows.forEach((row) => {
      map[row.key] = row.value;
    });
    return map;
  } catch {
    return {};
  }
}

export function themeFromMap(map: Record<string, string>): ThemeSettings {
  return {
    bg_color: map["bg_color"] || DEFAULT_THEME.bg_color,
    card_color: map["card_color"] || DEFAULT_THEME.card_color,
    primary_color: map["primary_color"] || DEFAULT_THEME.primary_color,
    text_color: map["text_color"] || DEFAULT_THEME.text_color,
    border_color: map["border_color"] || DEFAULT_THEME.border_color,
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

// ===== SUPER ADMIN (platform dashboard) =====

export interface SaRestaurant {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  created_at: string;
  item_count: number;
  members: { email: string; role: string }[];
}

export interface SaStats {
  restaurants: number;
  active_restaurants: number;
  users: number;
  branches: number;
  menu_items: number;
  categories: number;
}

export async function fetchSaStats(): Promise<SaStats> {
  return apiFetch<SaStats>(`/sa/stats`);
}

export async function fetchSaRestaurants(): Promise<SaRestaurant[]> {
  return apiFetch<SaRestaurant[]>(`/sa/restaurants`);
}

export async function saCreateRestaurant(body: {
  slug: string;
  name_ar: string;
  name_en: string;
  owner_email: string;
  owner_password: string;
  owner_name?: string;
}): Promise<{ id: string; slug: string; owner_email: string }> {
  return apiFetch(`/sa/restaurants`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function saUpdateRestaurant(
  id: string,
  patch: { is_active?: boolean; name_ar?: string; name_en?: string },
): Promise<void> {
  await apiFetch(`/sa/restaurants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// Restaurant-scoped settings with an explicit restaurant id (super admin can
// manage any restaurant; regular tenant admins keep using adminBase()).
export async function fetchRestaurantSettings(
  restaurantId: string,
): Promise<Record<string, string>> {
  const rows = await apiFetch<{ key: string; value: string }[]>(
    `/restaurants/${restaurantId}/menu/settings`,
  );
  const map: Record<string, string> = {};
  rows.forEach((r) => {
    map[r.key] = r.value;
  });
  return map;
}

export async function saveRestaurantSetting(
  restaurantId: string,
  key: string,
  value: string,
): Promise<void> {
  await apiFetch(
    `/restaurants/${restaurantId}/menu/settings/${encodeURIComponent(key)}`,
    { method: "PUT", body: JSON.stringify({ value }) },
  );
}

export async function uploadImageForRestaurant(
  restaurantId: string,
  file: File,
): Promise<string> {
  const reqRes = await fetch(
    `${API}/restaurants/${restaurantId}/storage/uploads/request-url`,
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
