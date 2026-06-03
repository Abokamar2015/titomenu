import { useEffect, useState } from 'react';
import { fetchPublicMenuItems, fetchCategories, type MenuItem, type Category } from '@/lib/supabase';

const DRINK_KEYS = ['hot', 'cold', 'mojito', 'مشروبات_ساخنة', 'مشروبات_باردة', 'موهيتو'];

function isDrinkCategory(key: string) {
  const k = key.toLowerCase();
  return (
    k.includes('hot') || k.includes('cold') || k.includes('mojito') ||
    k.includes('ساخن') || k.includes('بارد') || k.includes('موهيتو') ||
    DRINK_KEYS.includes(k)
  );
}

export default function PrintMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPublicMenuItems(), fetchCategories()])
      .then(([menuItems, cats]) => {
        setItems(menuItems);
        setCategories(cats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const drinkCats = categories.filter(c => isDrinkCategory(c.key));
  const grouped: Record<string, MenuItem[]> = {};
  for (const cat of drinkCats) {
    grouped[cat.key] = items.filter(i => i.category === cat.key);
  }

  const hotCat = drinkCats.find(c => c.key.toLowerCase().includes('hot') || c.name_ar?.includes('ساخن'));
  const coldCat = drinkCats.find(c => c.key.toLowerCase().includes('cold') || c.name_ar?.includes('بارد'));
  const mojitoCat = drinkCats.find(c => c.key.toLowerCase().includes('mojito') || c.name_ar?.includes('موهيتو'));

  const hotItems = hotCat ? (grouped[hotCat.key] ?? []) : [];
  const coldItems = coldCat ? (grouped[coldCat.key] ?? []) : [];
  const mojitoItems = mojitoCat ? (grouped[mojitoCat.key] ?? []) : [];

  const leftItems = [...coldItems, ...mojitoItems];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #fff; }

        .print-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          padding: 14mm 12mm;
          font-family: 'Lato', sans-serif;
          position: relative;
        }

        .no-print {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 100;
          display: flex;
          gap: 10px;
        }

        .btn-print {
          background: #1a1a1a;
          color: #fff;
          border: none;
          padding: 10px 22px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          font-family: 'Lato', sans-serif;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          transition: background 0.2s;
        }
        .btn-print:hover { background: #333; }

        .btn-back {
          background: #f0f0f0;
          color: #333;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          font-family: 'Lato', sans-serif;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .header {
          text-align: center;
          margin-bottom: 8mm;
          padding-bottom: 6mm;
          border-bottom: 1px solid #d4b896;
        }

        .logo-area {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #1a1a1a;
        }

        .brand-tagline {
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #9c7b5a;
          margin-top: 2px;
        }

        .menu-title {
          font-family: 'Playfair Display', serif;
          font-size: 13px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c8a882;
          margin-top: 8px;
        }

        .divider-ornament {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          margin: 6mm 0 8mm;
        }
        .divider-ornament span {
          height: 1px;
          width: 60px;
          background: linear-gradient(to right, transparent, #d4b896);
        }
        .divider-ornament span:last-child {
          background: linear-gradient(to left, transparent, #d4b896);
        }
        .divider-ornament .diamond {
          width: 6px;
          height: 6px;
          background: #c8a882;
          transform: rotate(45deg);
          flex-shrink: 0;
        }

        .columns {
          display: grid;
          grid-template-columns: 1fr 1px 1fr;
          gap: 0 10mm;
          align-items: start;
        }

        .col-divider {
          background: linear-gradient(to bottom, transparent, #d4b896 15%, #d4b896 85%, transparent);
          align-self: stretch;
        }

        .col-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-align: center;
          color: #1a1a1a;
          margin-bottom: 5mm;
          padding-bottom: 3mm;
          border-bottom: 1px solid #e8d5be;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .col-subtitle {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #9c7b5a;
          text-align: center;
          margin-top: -4mm;
          margin-bottom: 5mm;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 3.5px 0;
          border-bottom: 1px dotted #e8d5be;
        }
        .item-row:last-child { border-bottom: none; }

        .item-name-en {
          font-size: 12.5px;
          color: #1a1a1a;
          font-weight: 400;
          letter-spacing: 0.03em;
        }

        .item-name-ar {
          font-size: 11px;
          color: #6b6b6b;
          direction: rtl;
          font-weight: 300;
        }

        .item-names {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
        }

        .item-price {
          font-size: 11px;
          color: #9c7b5a;
          font-weight: 400;
          white-space: nowrap;
          margin-inline-start: 8px;
          letter-spacing: 0.03em;
        }

        .section-label {
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c8a882;
          margin-top: 5mm;
          margin-bottom: 2mm;
          text-align: center;
        }

        .footer {
          margin-top: 10mm;
          text-align: center;
          border-top: 1px solid #d4b896;
          padding-top: 5mm;
        }
        .footer-text {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #b8a090;
        }

        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
          .print-page { margin: 0; padding: 12mm; width: 100%; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print">
        <a href="/" className="btn-back">
          ← العودة
        </a>
        <button className="btn-print" onClick={() => window.print()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          طباعة
        </button>
      </div>

      <div className="print-page">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9c7b5a', fontFamily: 'Lato, sans-serif' }}>
            جاري التحميل...
          </div>
        ) : (
          <>
            <div className="header">
              <div className="logo-area">
                <div className="brand-name">& Co.</div>
              </div>
              <div className="brand-tagline">Coffee Shop & Pop Up</div>
              <div className="menu-title">— Drinks Menu —</div>
            </div>

            <div className="divider-ornament">
              <span />
              <div className="diamond" />
              <span />
            </div>

            <div className="columns">
              {/* Cold + Mojito */}
              <div>
                <div className="col-title">
                  <span>☕</span> Cold Drinks
                </div>
                <div className="col-subtitle">مشروبات باردة</div>
                {coldItems.map(item => (
                  <div className="item-row" key={item.id}>
                    <div className="item-names">
                      <span className="item-name-en">{item.name_en}</span>
                      <span className="item-name-ar">{item.name_ar}</span>
                    </div>
                    <span className="item-price">{item.price} ر.س</span>
                  </div>
                ))}

                {mojitoItems.length > 0 && (
                  <>
                    <div className="section-label">— Mojito & Specials —</div>
                    {mojitoItems.map(item => (
                      <div className="item-row" key={item.id}>
                        <div className="item-names">
                          <span className="item-name-en">{item.name_en}</span>
                          <span className="item-name-ar">{item.name_ar}</span>
                        </div>
                        <span className="item-price">{item.price} ر.س</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="col-divider" />

              {/* Hot */}
              <div>
                <div className="col-title">
                  <span>🌡️</span> Hot Drinks
                </div>
                <div className="col-subtitle">مشروبات ساخنة</div>
                {hotItems.map(item => (
                  <div className="item-row" key={item.id}>
                    <div className="item-names">
                      <span className="item-name-en">{item.name_en}</span>
                      <span className="item-name-ar">{item.name_ar}</span>
                    </div>
                    <span className="item-price">{item.price} ر.س</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider-ornament" style={{ marginTop: '10mm' }}>
              <span />
              <div className="diamond" />
              <span />
            </div>

            <div className="footer">
              <div className="footer-text">& Co. Coffee Shop & Pop Up — قهوة متنقلة</div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
