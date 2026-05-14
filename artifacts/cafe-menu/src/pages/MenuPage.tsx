import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPublicMenuItems, fetchThemeSettings, fetchCategories } from '@/lib/supabase';
import type { MenuItem, ThemeSettings, Category } from '@/lib/supabase';
import { springPresets } from '@/lib/motion';

type Lang = 'ar' | 'en';
type ViewMode = 'list' | 'grid';

const DEFAULT_THEME: ThemeSettings = {
  bg_color: '#111111', card_color: '#1c1c1c',
  primary_color: '#E8622A', text_color: '#F0EBE3', border_color: '#2a2a2a',
};

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/andco.sa',
  tiktok: 'https://www.tiktok.com/@andco.sa',
  maps: 'https://maps.app.goo.gl/HLhYHTcG1FjQvqiS9',
  phone: 'tel:+966504440238',
};

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('ar');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([fetchPublicMenuItems(), fetchThemeSettings(), fetchCategories()])
      .then(([menuItems, themeData, cats]) => {
        setItems(menuItems);
        setTheme(themeData);
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].key);
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!tabsRef.current || !activeCategory) return;
    const activeBtn = tabsRef.current.querySelector(`[data-key="${activeCategory}"]`) as HTMLElement;
    if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCategory]);

  const filteredItems = items.filter(i => i.category === activeCategory);
  const isRtl = lang === 'ar';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}
      style={{ backgroundColor: theme.bg_color, color: theme.text_color, minHeight: '100vh',
        fontFamily: isRtl ? "'Cairo','Tajawal',sans-serif" : "'Inter',sans-serif" }}>

      {/* ===== COVER IMAGE ===== */}
      <div className="relative w-full overflow-hidden" style={{ height: '220px' }}>
        <img src="/images/cover.jpg" alt="& Co. Coffee Shop"
          className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{
          background: `linear-gradient(to bottom, transparent 40%, ${theme.bg_color} 100%)`
        }} />
        {/* Language Toggle */}
        <div className="absolute top-3 end-3 flex gap-1 p-1 rounded-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          {(['ar', 'en'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={lang === l
                ? { backgroundColor: theme.primary_color, color: '#fff' }
                : { color: 'rgba(255,255,255,0.7)' }}>
              {l === 'ar' ? 'عربي' : 'EN'}
            </button>
          ))}
        </div>
      </div>

      {/* ===== PROFILE SECTION ===== */}
      <div className="flex flex-col items-center -mt-12 pb-4 px-4 relative z-10">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-3"
          style={{ border: `3px solid ${theme.primary_color}`, boxShadow: `0 0 20px ${theme.primary_color}55` }}>
          <img src="/images/LOGO.png" alt="& Co."
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <h1 className="text-lg font-black tracking-widest uppercase" style={{ color: theme.text_color }}>
          & Co. Coffee Shop
        </h1>
        <p className="text-xs tracking-widest mt-0.5" style={{ color: theme.primary_color }}>
          Coffee Shop & Pop Up
        </p>

        {/* Social Icons */}
        <div className="flex items-center gap-4 mt-4">
          <a href={SOCIAL_LINKS.maps} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
              style={{ backgroundColor: theme.card_color, border: `1px solid ${theme.border_color}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335"/>
              </svg>
            </div>
            <span className="text-[10px]" style={{ color: theme.text_color + '88' }}>{lang === 'ar' ? 'الموقع' : 'Maps'}</span>
          </a>

          <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
              style={{ backgroundColor: theme.card_color, border: `1px solid ${theme.border_color}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: theme.text_color }}>
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.75a4.85 4.85 0 01-1-.06z"/>
              </svg>
            </div>
            <span className="text-[10px]" style={{ color: theme.text_color + '88' }}>TikTok</span>
          </a>

          <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
              style={{ backgroundColor: theme.card_color, border: `1px solid ${theme.border_color}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433"/>
                    <stop offset="50%" stopColor="#dc2743"/>
                    <stop offset="100%" stopColor="#bc1888"/>
                  </linearGradient>
                </defs>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#ig)"/>
              </svg>
            </div>
            <span className="text-[10px]" style={{ color: theme.text_color + '88' }}>Instagram</span>
          </a>

          <a href={SOCIAL_LINKS.phone}
            className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
              style={{ backgroundColor: theme.card_color, border: `1px solid ${theme.border_color}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#25D366"/>
              </svg>
            </div>
            <span className="text-[10px]" style={{ color: theme.text_color + '88' }}>{lang === 'ar' ? 'اتصل' : 'Call'}</span>
          </a>
        </div>
      </div>

      {/* ===== CATEGORY TABS ===== */}
      <div style={{ borderBottom: `1px solid ${theme.border_color}`, background: theme.bg_color }}>
        <div ref={tabsRef} className="flex flex-wrap justify-center gap-3 px-3 py-4">
          {categories.map(cat => {
            const isActive = activeCategory === cat.key;
            return (
              <button key={cat.key} data-key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="flex flex-col items-center gap-2 shrink-0 transition-all duration-200"
                style={{ minWidth: 68 }}>
                <div className="relative" style={{
                  padding: 3,
                  borderRadius: '50%',
                  background: isActive
                    ? `linear-gradient(135deg, ${theme.primary_color}, ${theme.primary_color}99)`
                    : 'transparent',
                  boxShadow: isActive ? `0 0 0 1px ${theme.primary_color}55, 0 6px 20px ${theme.primary_color}44` : 'none',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}>
                  <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl"
                    style={{
                      backgroundColor: isActive ? theme.primary_color + '22' : theme.card_color,
                      border: isActive ? 'none' : `1.5px solid ${theme.border_color}`,
                    }}>
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={lang === 'ar' ? cat.name_ar : cat.name_en}
                        className="w-full h-full object-cover"
                        style={{ filter: isActive ? 'none' : 'saturate(0.7) brightness(0.9)' }} />
                    ) : (
                      <span style={{ filter: isActive ? 'none' : 'grayscale(0.4)' }}>{cat.icon}</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-center leading-tight"
                  style={{
                    maxWidth: 68,
                    color: isActive ? theme.primary_color : theme.text_color + '88',
                    transition: 'color 0.2s',
                  }}>
                  {lang === 'ar' ? cat.name_ar : cat.name_en}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== MENU ITEMS ===== */}
      <main className="max-w-lg mx-auto px-3 py-4 pb-20">
        {!loading && filteredItems.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-xs font-semibold" style={{ color: theme.text_color + '88' }}>
              {filteredItems.length} {lang === 'ar' ? 'صنف' : 'items'}
            </p>
            <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: theme.card_color }}>
              <button onClick={() => setViewMode('list')}
                className="p-1.5 rounded-md transition-all"
                style={viewMode === 'list' ? { backgroundColor: theme.primary_color } : {}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={viewMode === 'list' ? '#fff' : theme.text_color + '88'} strokeWidth="2.5">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <circle cx="3" cy="6" r="1.5" fill={viewMode === 'list' ? '#fff' : theme.text_color + '88'}/>
                  <circle cx="3" cy="12" r="1.5" fill={viewMode === 'list' ? '#fff' : theme.text_color + '88'}/>
                  <circle cx="3" cy="18" r="1.5" fill={viewMode === 'list' ? '#fff' : theme.text_color + '88'}/>
                </svg>
              </button>
              <button onClick={() => setViewMode('grid')}
                className="p-1.5 rounded-md transition-all"
                style={viewMode === 'grid' ? { backgroundColor: theme.primary_color } : {}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={viewMode === 'grid' ? '#fff' : theme.text_color + '88'} strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: theme.card_color }} />
            ))}
          </div>
        )}

        {!loading && (
          <AnimatePresence mode="wait">
            <motion.div key={activeCategory + viewMode}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={springPresets.gentle}
              className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
              {filteredItems.length === 0 && (
                <div className="col-span-2 text-center py-20" style={{ color: theme.text_color + '55' }}>
                  <span className="text-5xl block mb-3">🍽️</span>
                  <p className="text-sm">{lang === 'ar' ? 'لا توجد أصناف متاحة' : 'No items available'}</p>
                </div>
              )}
              {filteredItems.map((item, idx) =>
                viewMode === 'list'
                  ? <ListCard key={item.id} item={item} lang={lang} theme={theme} idx={idx} onSelect={() => setSelectedItem(item)} />
                  : <GridCard key={item.id} item={item} lang={lang} theme={theme} idx={idx} onSelect={() => setSelectedItem(item)} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ===== ITEM DETAIL MODAL ===== */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedItem(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{
                backgroundColor: theme.card_color,
                boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px ${theme.border_color}`,
                maxHeight: '88vh', overflowY: 'auto',
              }}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <div className="relative w-full" style={{ height: '240px', flexShrink: 0 }}>
                {selectedItem.image_url
                  ? <img src={selectedItem.image_url} alt={lang === 'ar' ? selectedItem.name_ar : selectedItem.name_en}
                      className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-7xl"
                      style={{ background: `linear-gradient(135deg, ${theme.primary_color}44 0%, ${theme.bg_color} 100%)` }}>☕</div>
                }
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `linear-gradient(to top, ${theme.card_color} 0%, ${theme.card_color}00 55%)` }} />
                <button onClick={() => setSelectedItem(null)}
                  className="absolute top-3 end-3 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
                <div className="absolute bottom-3 start-4 flex items-baseline gap-1 px-4 py-2 rounded-2xl"
                  style={{ backgroundColor: theme.primary_color, boxShadow: `0 6px 20px ${theme.primary_color}77` }}>
                  <span className="text-xl font-black text-white leading-none">{selectedItem.price}</span>
                  <span className="text-xs font-semibold text-white/80">{lang === 'ar' ? 'ريال' : 'SAR'}</span>
                </div>
              </div>
              <div className="px-5 pt-3 pb-6">
                <h2 className="text-xl font-black leading-snug mb-0.5" style={{ color: theme.text_color }}>
                  {lang === 'ar' ? selectedItem.name_ar : selectedItem.name_en}
                </h2>
                <p className="text-xs font-medium mb-3" style={{ color: theme.text_color + '66' }}>
                  {lang === 'ar' ? selectedItem.name_en : selectedItem.name_ar}
                </p>
                {selectedItem.calories && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: theme.primary_color + '1A', color: theme.primary_color, border: `1px solid ${theme.primary_color}33` }}>
                      🔥 {selectedItem.calories} {lang === 'ar' ? 'سعرة حرارية' : 'cal'}
                    </span>
                  </div>
                )}
                <div className="h-px w-full my-3 rounded-full" style={{ backgroundColor: theme.border_color }} />
                {(lang === 'ar' ? selectedItem.description_ar : selectedItem.description_en) && (
                  <p className="text-sm leading-relaxed" style={{ color: theme.text_color + 'BB' }}>
                    {lang === 'ar' ? selectedItem.description_ar : selectedItem.description_en}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== FOOTER ===== */}
      <footer className="py-6 text-center" style={{ borderTop: `1px solid ${theme.border_color}` }}>
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: theme.primary_color }}>
          & Co. Coffee Shop & Pop Up
        </p>
        <p className="text-[11px] mt-1" style={{ color: theme.text_color + '55' }}>
          {lang === 'ar' ? 'جميع الأسعار بالريال السعودي' : 'All prices in Saudi Riyal'}
        </p>
      </footer>
    </div>
  );
}

function ListCard({ item, lang, theme, idx, onSelect }: { item: MenuItem; lang: Lang; theme: ThemeSettings; idx: number; onSelect: () => void }) {
  const isRtl = lang === 'ar';
  const name = isRtl ? item.name_ar : item.name_en;
  const nameSecondary = isRtl ? item.name_en : item.name_ar;
  const desc = isRtl ? item.description_ar : item.description_en;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ...springPresets.gentle, delay: idx * 0.04 }}
      className="flex overflow-hidden rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onSelect}
      style={{ backgroundColor: theme.card_color, border: `1px solid ${theme.border_color}`, minHeight: '100px' }}>
      <div className="shrink-0 relative overflow-hidden" style={{ width: '100px', minHeight: '100px' }}>
        {item.image_url
          ? <img src={item.image_url} alt={name} className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center text-3xl"
              style={{ background: `linear-gradient(135deg, ${theme.primary_color}22, ${theme.bg_color})` }}>☕</div>}
      </div>
      <div className="w-px shrink-0" style={{ backgroundColor: theme.border_color }} />
      <div className="flex-1 min-w-0 flex flex-col justify-between p-3">
        <div>
          <h3 className="font-black text-[15px] leading-snug" style={{ color: theme.text_color }}>{name}</h3>
          <p className="text-[11px] mt-0.5" style={{ color: theme.text_color + '66' }}>{nameSecondary}</p>
          {desc && <p className="text-[12px] leading-relaxed mt-1 line-clamp-2" style={{ color: theme.text_color + '88' }}>{desc}</p>}
        </div>
        {item.calories && (
          <span className="mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full self-start"
            style={{ backgroundColor: theme.primary_color + '20', color: theme.primary_color }}>
            🔥 {item.calories} cal
          </span>
        )}
      </div>
      <div className="shrink-0 flex items-center px-3">
        <div className="flex flex-col items-center rounded-xl px-2.5 py-2 min-w-[52px]"
          style={{ backgroundColor: theme.primary_color + '20', border: `1.5px solid ${theme.primary_color}55` }}>
          <span className="text-lg font-black leading-none" style={{ color: theme.primary_color }}>{item.price}</span>
          <span className="text-[10px] mt-0.5 font-semibold" style={{ color: theme.primary_color + 'BB' }}>
            {lang === 'ar' ? 'ريال' : 'SAR'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function GridCard({ item, lang, theme, idx, onSelect }: { item: MenuItem; lang: Lang; theme: ThemeSettings; idx: number; onSelect: () => void }) {
  const name = lang === 'ar' ? item.name_ar : item.name_en;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springPresets.gentle, delay: idx * 0.04 }}
      className="flex flex-col overflow-hidden rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onSelect}
      style={{ backgroundColor: theme.card_color, border: `1px solid ${theme.border_color}` }}>
      <div className="relative overflow-hidden" style={{ height: '130px' }}>
        {item.image_url
          ? <img src={item.image_url} alt={name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-4xl"
              style={{ background: `linear-gradient(135deg, ${theme.primary_color}22, ${theme.bg_color})` }}>☕</div>}
        <div className="absolute top-2 end-2 px-2 py-1 rounded-lg"
          style={{ backgroundColor: theme.primary_color, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          <span className="text-sm font-black text-white leading-none">{item.price}</span>
          <span className="text-[9px] text-white/80 ms-0.5">{lang === 'ar' ? 'ر' : 'SR'}</span>
        </div>
      </div>
      <div className="p-2.5">
        <h3 className="font-black text-sm leading-tight line-clamp-1" style={{ color: theme.text_color }}>{name}</h3>
        {item.calories && (
          <span className="mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block"
            style={{ backgroundColor: theme.primary_color + '20', color: theme.primary_color }}>
            🔥 {item.calories} cal
          </span>
        )}
      </div>
    </motion.div>
  );
}
