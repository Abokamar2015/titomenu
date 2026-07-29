import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { fetchPublicMenuItems, fetchPublicCategories, fetchPublicSettings, fetchPublicRestaurant, type MenuItem, type Category, type PublicRestaurant } from '@/lib/supabase';
import cartBg from '@assets/WhatsApp_Image_2025-12-05_at_18.18.50_61f8547f_1780513767603.jpg';

export default function PrintMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [restaurant, setRestaurant] = useState<PublicRestaurant | null>(null);
  const params = useParams<{ slug?: string }>();
  const slug = params.slug;

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPublicMenuItems(slug), fetchPublicCategories(slug), fetchPublicSettings(slug), fetchPublicRestaurant(slug)])
      .then(([menuItems, cats, settingsMap, rest]) => {
        setItems(menuItems);
        setCategories(cats);
        setSettings(settingsMap);
        setRestaurant(rest);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  // Per-restaurant background: the restaurant's own cover image, or the
  // legacy & Co. cart photo only for the default (& Co.) menu. Other
  // restaurants without a cover get a clean paper background (no photo).
  const isDefaultRestaurant = !slug || slug === 'and-co';
  const bgUrl = settings['cover_url'] || (isDefaultRestaurant ? cartBg : '');

  // Render the restaurant's own categories (from the DB), skipping empty
  // ones, and balance them across two print columns by item count.
  const allSections = categories.map(cat => ({
    cat,
    catItems: items.filter(i => i.category === cat.key),
  }));
  // Prefer categories that have items; if none have items yet, still show
  // the restaurant's own category headings so the page is never blank.
  const nonEmpty = allSections.filter(s => s.catItems.length > 0);
  const sections = nonEmpty.length > 0 ? nonEmpty : allSections;
  const colA: typeof sections = [];
  const colB: typeof sections = [];
  let countA = 0;
  let countB = 0;
  for (const s of sections) {
    // +2 accounts for the heading overhead of each section.
    if (countA <= countB) { colA.push(s); countA += s.catItems.length + 2; }
    else { colB.push(s); countB += s.catItems.length + 2; }
  }

  const renderItem = (item: MenuItem) => (
    <div className="m-item" key={item.id}>
      <span className="m-item-en">{item.name_en}</span>
      <span className="m-item-ar">{item.name_ar}</span>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #e9e3d8; }

        .screen-wrap {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          padding: 24px 12px 60px;
          background: #e9e3d8;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          background:
            radial-gradient(circle at 50% 0%, #fffdf9 0%, #fbf6ec 55%, #f7f0e2 100%);
          position: relative;
          padding: 16mm 14mm;
          font-family: 'Tajawal', sans-serif;
          color: #221a13;
          box-shadow: 0 16px 50px rgba(60,40,20,0.18);
          overflow: hidden;
        }

        /* Restaurant background watermark */
        .bg-photo {
          position: absolute;
          inset: 0;
          ${bgUrl ? `background-image: url(${bgUrl});` : ''}
          background-size: cover;
          background-position: center 65%;
          opacity: 0.28;
          z-index: 0;
          pointer-events: none;
        }
        .bg-veil {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(252,248,240,0.78) 0%, rgba(250,245,235,0.62) 45%, rgba(249,243,231,0.78) 100%);
          z-index: 1;
          pointer-events: none;
        }

        /* Double frame border */
        .frame-outer {
          position: absolute;
          inset: 7mm;
          border: 1.5px solid #c2a878;
          pointer-events: none;
        }
        .frame-inner {
          position: absolute;
          inset: 8.5mm;
          border: 0.75px solid #d8c5a0;
          pointer-events: none;
        }
        .corner {
          position: absolute;
          width: 14px; height: 14px;
          border: 1.5px solid #b8923f;
        }
        .corner.tl { top: 6.2mm; left: 6.2mm; border-right: none; border-bottom: none; }
        .corner.tr { top: 6.2mm; right: 6.2mm; border-left: none; border-bottom: none; }
        .corner.bl { bottom: 6.2mm; left: 6.2mm; border-right: none; border-top: none; }
        .corner.br { bottom: 6.2mm; right: 6.2mm; border-left: none; border-top: none; }

        .content { position: relative; z-index: 2; }

        /* Header */
        .header { text-align: center; margin-bottom: 7mm; }
        .logo-circle {
          width: 80px; height: 80px;
          border-radius: 50%;
          margin: 0 auto 10px;
          overflow: hidden;
          border: 2px solid #b8923f;
          box-shadow: 0 4px 14px rgba(184,146,63,0.25);
          background: #fff;
        }
        .logo-circle img { width: 100%; height: 100%; object-fit: cover; }

        .brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 46px;
          font-weight: 700;
          letter-spacing: 0.04em;
          line-height: 1;
          color: #1a130d;
        }
        .brand .amp { color: #E8622A; }
        .tagline {
          font-size: 9.5px;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: #9a7d4e;
          margin-top: 7px;
          font-family: 'Tajawal', sans-serif;
          font-weight: 500;
        }

        .title-band {
          display: flex; align-items: center; justify-content: center;
          gap: 14px; margin: 9mm 0 8mm;
        }
        .title-band .line {
          height: 1px; width: 70px;
          background: linear-gradient(to right, transparent, #c2a878);
        }
        .title-band .line.r { background: linear-gradient(to left, transparent, #c2a878); }
        .title-band .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #8a6d3c;
          font-weight: 600;
        }
        .title-band .dot { width: 5px; height: 5px; background: #E8622A; transform: rotate(45deg); }

        /* Columns */
        .columns {
          display: grid;
          grid-template-columns: 1fr 1px 1fr;
          gap: 0 11mm;
          align-items: start;
        }
        .v-divider {
          align-self: stretch;
          background: linear-gradient(to bottom, transparent, #d2bd92 12%, #d2bd92 88%, transparent);
        }

        .col-head { text-align: center; margin-bottom: 6mm; }
        .cat-block + .cat-block { margin-top: 8mm; }
        .col-head .en {
          font-family: 'Cormorant Garamond', serif;
          font-size: 23px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #1a130d;
        }
        .col-head .ar {
          font-size: 11px;
          color: #9a7d4e;
          font-weight: 500;
          margin-top: 1px;
          letter-spacing: 0.05em;
        }
        .col-head .underline {
          width: 46px; height: 2px;
          background: #E8622A;
          margin: 7px auto 0;
          border-radius: 2px;
        }

        .m-item {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 5.5px 2px;
          border-bottom: 1px dotted #ddcba4;
        }
        .m-item:last-child { border-bottom: none; }
        .m-item-en {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 500;
          color: #2a1f15;
          letter-spacing: 0.01em;
        }
        .m-item-ar {
          font-family: 'Tajawal', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: #8a7355;
          direction: rtl;
        }

        .sub-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #b8923f;
          text-align: center;
          margin: 6mm 0 3mm;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .sub-label::before, .sub-label::after {
          content: ''; height: 1px; width: 22px; background: #d2bd92;
        }

        /* Footer */
        .footer {
          margin-top: 10mm;
          text-align: center;
        }
        .footer .orn {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; margin-bottom: 6mm;
        }
        .footer .orn .line { height: 1px; width: 80px; background: linear-gradient(to right, transparent, #c2a878); }
        .footer .orn .line.r { background: linear-gradient(to left, transparent, #c2a878); }
        .footer .orn .dot { width: 5px; height: 5px; background: #E8622A; transform: rotate(45deg); }
        .footer .name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #6b573a;
        }
        .footer .sub {
          font-size: 10px;
          color: #a08858;
          margin-top: 4px;
          letter-spacing: 0.08em;
        }

        /* Controls */
        .no-print {
          position: fixed; top: 16px; right: 16px; z-index: 100;
          display: flex; gap: 10px;
        }
        .btn-print {
          background: #E8622A; color: #fff; border: none;
          padding: 11px 24px; border-radius: 8px; font-size: 14px;
          cursor: pointer; font-family: 'Tajawal', sans-serif; font-weight: 700;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 14px rgba(232,98,42,0.35); transition: all .2s;
        }
        .btn-print:hover { background: #d4541e; transform: translateY(-1px); }
        .btn-back {
          background: #fff; color: #4a3a28; border: 1px solid #d8c5a0;
          padding: 11px 20px; border-radius: 8px; font-size: 14px;
          cursor: pointer; font-family: 'Tajawal', sans-serif; font-weight: 500;
          text-decoration: none; display: flex; align-items: center; gap: 6px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }

        .loading { text-align: center; padding: 60px; color: #9a7d4e; font-size: 15px; }

        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
          .screen-wrap { padding: 0; background: #fff; }
          .page { box-shadow: none; margin: 0; width: 100%; min-height: 100vh; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print">
        <a href={import.meta.env.BASE_URL} className="btn-back">← العودة</a>
        <button className="btn-print" onClick={() => window.print()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          طباعة
        </button>
      </div>

      <div className="screen-wrap">
        <div className="page">
          {bgUrl && <div className="bg-photo" />}
          <div className="bg-veil" />
          <div className="frame-outer" />
          <div className="frame-inner" />
          <div className="corner tl" /><div className="corner tr" />
          <div className="corner bl" /><div className="corner br" />

          <div className="content">
            {loading ? (
              <div className="loading">جاري التحميل...</div>
            ) : (
              <>
                <div className="header">
                  {settings['logo_url'] && (
                    <div className="logo-circle"><img src={settings['logo_url']} alt={restaurant?.name_en ?? ''} /></div>
                  )}
                  <div className="brand">{restaurant?.name_en ?? ''}</div>
                  {settings['description'] && <div className="tagline">{settings['description']}</div>}
                </div>

                <div className="title-band">
                  <span className="line" />
                  <span className="dot" />
                  <span className="title">Menu</span>
                  <span className="dot" />
                  <span className="line r" />
                </div>

                <div className="columns">
                  <div>
                    {colA.map(({ cat, catItems }) => (
                      <div key={cat.key} className="cat-block">
                        <div className="col-head">
                          <div className="en">{cat.name_en}</div>
                          <div className="ar">{cat.name_ar}</div>
                          <div className="underline" />
                        </div>
                        {catItems.map(renderItem)}
                      </div>
                    ))}
                  </div>

                  <div className="v-divider" />

                  <div>
                    {colB.map(({ cat, catItems }) => (
                      <div key={cat.key} className="cat-block">
                        <div className="col-head">
                          <div className="en">{cat.name_en}</div>
                          <div className="ar">{cat.name_ar}</div>
                          <div className="underline" />
                        </div>
                        {catItems.map(renderItem)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="footer">
                  <div className="orn">
                    <span className="line" /><span className="dot" /><span className="line r" />
                  </div>
                  <div className="name">{restaurant?.name_en ?? ''}</div>
                  <div className="sub">{restaurant?.name_ar ?? ''}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
