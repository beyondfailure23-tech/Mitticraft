import React, { useState, useEffect, useMemo } from "react";
import { Search, Menu, X, ExternalLink, ChevronRight, ArrowLeft, Package, AlertCircle } from "lucide-react";

const CONFIG = {
  PRODUCTS_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfTpyNWpKfYNnPhd170KhY_HEXfJi_bIVSIr7w5_a6Jvd8TA_IjD1Cs74g8Ln2iHtFh4isX8NWDrhM/pub?gid=0&single=true&output=csv",
  CATEGORIES_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfTpyNWpKfYNnPhd170KhY_HEXfJi_bIVSIr7w5_a6Jvd8TA_IjD1Cs74g8Ln2iHtFh4isX8NWDrhM/pub?gid=733320805&single=true&output=csv",
  SITE_NAME: "Fantoosh Family",
  SITE_TAGLINE: "Curated picks, one place",
};

const DEMO_CATEGORIES = [
  { ID: "1", Category: "Education", Icon: "🎓", Description: "Books, courses and study essentials", Active: "Yes" },
  { ID: "2", Category: "Baby Products", Icon: "🍼", Description: "Everyday needs for little ones", Active: "Yes" },
  { ID: "3", Category: "Women & Girls", Icon: "🌸", Description: "Fashion, care and lifestyle picks", Active: "Yes" },
  { ID: "4", Category: "Electronics", Icon: "🔌", Description: "Gadgets and everyday tech", Active: "Yes" },
];

const DEMO_PRODUCTS = [
  { ID: "1", "Product Name": "NCERT Books Set (Class 6-8)", Category: "Education", Image: "", Price: "₹499", Description: "Complete NCERT set for middle school students.", "Affiliate Link": "https://example.com/aff/1", Featured: "Yes", Active: "Yes" },
  { ID: "2", "Product Name": "Wireless Earbuds Pro", Category: "Electronics", Image: "", Price: "₹1,299", Description: "Noise isolation, 24hr battery, fast charge.", "Affiliate Link": "https://example.com/aff/2", Featured: "Yes", Active: "Yes" },
  { ID: "3", "Product Name": "Baby Soft Cotton Romper (3-pack)", Category: "Baby Products", Image: "", Price: "₹649", Description: "Breathable cotton, safe dyes, easy snaps.", "Affiliate Link": "https://example.com/aff/3", Featured: "Yes", Active: "Yes" },
  { ID: "4", "Product Name": "Herbal Face Wash", Category: "Women & Girls", Image: "", Price: "₹249", Description: "Gentle daily cleanser with neem and aloe.", "Affiliate Link": "https://example.com/aff/4", Featured: "Yes", Active: "Yes" },
  { ID: "5", "Product Name": "Study Table Lamp (LED)", Category: "Education", Image: "", Price: "₹899", Description: "Adjustable brightness, eye-care LED.", "Affiliate Link": "https://example.com/aff/5", Featured: "No", Active: "Yes" },
  { ID: "6", "Product Name": "Baby Stroller (Foldable)", Category: "Baby Products", Image: "", Price: "₹3,499", Description: "Lightweight, one-hand fold, all-terrain wheels.", "Affiliate Link": "https://example.com/aff/6", Featured: "No", Active: "Yes" },
  { ID: "7", "Product Name": "Smartwatch Fitness Band", Category: "Electronics", Image: "", Price: "₹1,799", Description: "Heart rate, SpO2, 7-day battery life.", "Affiliate Link": "https://example.com/aff/7", Featured: "No", Active: "Yes" },
  { ID: "8", "Product Name": "Cotton Kurti (Pack of 2)", Category: "Women & Girls", Image: "", Price: "₹799", Description: "Everyday comfort wear, machine washable.", "Affiliate Link": "https://example.com/aff/8", Featured: "No", Active: "Yes" },
  { ID: "9", "Product Name": "General Knowledge Quiz Book", Category: "Education", Image: "", Price: "₹199", Description: "1000+ questions for competitive prep.", "Affiliate Link": "https://example.com/aff/9", Featured: "No", Active: "Yes" },
  { ID: "10", "Product Name": "Baby Monitor Camera", Category: "Baby Products", Image: "", Price: "₹2,199", Description: "Night vision, two-way audio, app alerts.", "Affiliate Link": "https://example.com/aff/10", Featured: "No", Active: "Yes" },
];

const CATEGORY_STYLES = {
  "Education": { bg: "#E4EEFB", badge: "#3C6EA5", ring: "#C4D9F2" },
  "Baby Products": { bg: "#FCE9EC", badge: "#C6607A", ring: "#F6D2D9" },
  "Women & Girls": { bg: "#F1E7FA", badge: "#8462AE", ring: "#E3D0F4" },
  "Electronics": { bg: "#DFF4EF", badge: "#2E8F7D", ring: "#BFE8DD" },
};
const DEFAULT_STYLE = { bg: "#EFEFEF", badge: "#666666", ring: "#DDDDDD" };
const styleFor = (cat) => CATEGORY_STYLES[cat] || DEFAULT_STYLE;

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => c && c.trim() !== "")).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
    return obj;
  });
}

async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Sheet fetch failed");
  return parseCSV(await res.text());
}

function slugify(str) {
  return (str || "").toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ProductImage({ src, alt, bg }) {
  const [failed, setFailed] = useState(!src);
  if (failed) {
    return (
      <div className="w-full aspect-[4/3] rounded-t-2xl flex items-center justify-center" style={{ background: bg }}>
        <Package size={28} strokeWidth={1.5} color="#9AA0A6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-full aspect-[4/3] object-cover rounded-t-2xl"
    />
  );
}

function ProductCard({ product }) {
  const s = styleFor(product.Category);
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      <div className="relative">
        <ProductImage src={product.Image} alt={product["Product Name"]} bg={s.bg} />
        <span
          className="absolute top-2 left-2 text-[11px] font-semibold px-2 py-1 rounded-full"
          style={{ background: s.bg, color: s.badge }}
        >
          {product.Category}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[15px] font-semibold text-slate-800 leading-snug line-clamp-2 mb-1">
          {product["Product Name"]}
        </h3>
        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-3 flex-1">
          {product.Description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[16px] font-bold text-slate-800">{product.Price}</span>
<a        
            href={product["Affiliate Link"]}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-white px-3 py-2 rounded-xl transition-all rs"
            style={{ background: "#2D3E68" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#243354")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#2D3E68")}
          >
            View Deal <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ cat, count, onClick }) {
  const s = styleFor(cat.Category);
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3"
        style={{ background: s.bg }}
      >
        {cat.Icon || "🛍️"}
      </div>
      <h3 className="font-semibold text-slate-800 mb-1">{cat.Category}</h3>
      <p className="text-[13px] text-slate-500 leading-relaxed mb-3 flex-1">{cat.Description}</p>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-slate-400">{count} product{count === 1 ? "" : "s"}</span>
        <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: s.badge }}>
          View <ChevronRight size={14} />
        </span>
      </div>
    </button>
  );
}

function Header({ query, setQuery, onNav, onLogoClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-[#FAFAF8]/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <button onClick={onLogoClick} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#2D3E68] flex items-center justify-center text-white font-bold text-sm">
              {CONFIG.SITE_NAME[0]}
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
              {CONFIG.SITE_NAME}
            </span>
          </button>

          <div className="hidden md:flex items-center flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C4D9F2]"
            />
          </div>

                   <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-slate-600 shrink-0">
            <button onClick={() => onNav("home")} className="px-3 py-1.5 rounded-full hover:bg-[#EDF1F9] hover:text-[#2D3E68] transition-all duration-200">Home</button>
            <button onClick={() => onNav("categories")} className="px-3 py-1.5 rounded-full hover:bg-[#EDF1F9] hover:text-[#2D3E68] transition-all duration-200">Categories</button>
            <button onClick={() => onNav("about")} className="px-3 py-1.5 rounded-full hover:bg-[#EDF1F9] hover:text-[#2D3E68] transition-all duration-200">About</button>
          </nav>

          <button className="md:hidden p-2" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            <div className="flex items-center relative">
              <Search size={16} className="absolute left-3 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C4D9F2]"
              />
            </div>
            <button onClick={() => { onNav("home"); setMenuOpen(false); }} className="text-left text-[14px] font-medium text-slate-600 py-1">Home</button>
            <button onClick={() => { onNav("categories"); setMenuOpen(false); }} className="text-left text-[14px] font-medium text-slate-600 py-1">Categories</button>
            <button onClick={() => { onNav("about"); setMenuOpen(false); }} className="text-left text-[14px] font-medium text-slate-600 py-1">About</button>
          </div>
        )}
      </div>
    </header>
  );
}

function Footer({ categories, onNav, onCategory }) {
  return (
    <footer className="border-t border-gray-100 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-[13px]">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-[#2D3E68] flex items-center justify-center text-white font-bold text-[11px]">
              {CONFIG.SITE_NAME[0]}
            </div>
            <span className="font-bold text-slate-800">{CONFIG.SITE_NAME}</span>
          </div>
          <p className="text-slate-500 leading-relaxed">Helping you discover useful products, curated across everyday categories.</p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Categories</h4>
          <div className="flex flex-col gap-1.5">
            {categories.map((c) => (
              <button key={c.ID} onClick={() => onCategory(c.Category)} className="text-left text-slate-500 hover:text-slate-800">
                {c.Category}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Company</h4>
          <div className="flex flex-col gap-1.5">
            <button onClick={() => onNav("about")} className="text-left text-slate-500 hover:text-slate-800">About</button>
            <button onClick={() => onNav("contact")} className="text-left text-slate-500 hover:text-slate-800">Contact</button>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Legal</h4>
          <div className="flex flex-col gap-1.5">
            <button onClick={() => onNav("disclosure")} className="text-left text-slate-500 hover:text-slate-800">Affiliate Disclosure</button>
            <button onClick={() => onNav("privacy")} className="text-left text-slate-500 hover:text-slate-800">Privacy Policy</button>
            <button onClick={() => onNav("terms")} className="text-left text-slate-500 hover:text-slate-800">Terms & Conditions</button>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-[12px] text-slate-400">
        © {new Date().getFullYear()} {CONFIG.SITE_NAME}. As an affiliate partner, we may earn a commission on qualifying purchases made through links on this site.
      </div>
    </footer>
  );
}

function StaticPage({ page, onBack }) {
  const content = {
    about: {
      title: "About Us",
      body: `${CONFIG.SITE_NAME} helps you discover useful, everyday products across categories like education, baby care, women & girls, and electronics. We don't sell anything ourselves — we point you to trusted sellers so you can decide and buy on their platform.`,
    },
    contact: {
      title: "Contact",
      body: "Have a question, correction, or product suggestion? Reach out at hello@example.com and we'll get back to you.",
    },
    disclosure: {
      title: "Affiliate Disclosure",
      body: `${CONFIG.SITE_NAME} is an affiliate product discovery platform. We do not sell products directly. When you click "View Deal," you are redirected to the seller's website. We may earn a small commission on qualifying purchases, at no extra cost to you. This helps us keep the site running.`,
    },
    privacy: {
      title: "Privacy Policy",
      body: "We collect minimal data needed to run this site, such as basic usage analytics. We do not sell personal information. Affiliate partners may set their own cookies once you leave our site.",
    },
    terms: {
      title: "Terms & Conditions",
      body: "By using this site, you agree that product listings are provided for discovery purposes only, prices and availability are controlled by third-party sellers, and purchases are made directly with those sellers under their own terms.",
    },
  };
  const c = content[page] || content.about;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-[14px] text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft size={15} /> Back
      </button>
      <h1 className="text-2xl font-bold text-slate-800 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>{c.title}</h1>
      <p className="text-slate-600 leading-relaxed">{c.body}</p>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [categories, setCategories] = useState(DEMO_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [usingDemo, setUsingDemo] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [view, setView] = useState({ page: "home", category: null });

  useEffect(() => {
    if (!CONFIG.PRODUCTS_CSV_URL || !CONFIG.CATEGORIES_CSV_URL) return;
    setLoading(true);
    Promise.all([fetchCSV(CONFIG.PRODUCTS_CSV_URL), fetchCSV(CONFIG.CATEGORIES_CSV_URL)])
      .then(([prod, cat]) => {
        setProducts(prod);
        setCategories(cat);
        setUsingDemo(false);
        setError("");
      })
      .catch(() => setError("Could not load the Google Sheet — showing demo data instead."))
      .finally(() => setLoading(false));
  }, []);

  const activeCategories = useMemo(
    () => categories.filter((c) => (c.Active || "Yes").toLowerCase() !== "no"),
    [categories]
  );
  const activeProducts = useMemo(
    () => products.filter((p) => (p.Active || "Yes").toLowerCase() !== "no"),
    [products]
  );
  const featured = useMemo(
    () => activeProducts.filter((p) => (p.Featured || "").toLowerCase() === "yes").slice(0, 8),
    [activeProducts]
  );
  const countFor = (catName) => activeProducts.filter((p) => p.Category === catName).length;

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return activeProducts.filter(
      (p) =>
        (p["Product Name"] || "").toLowerCase().includes(q) ||
        (p.Category || "").toLowerCase().includes(q) ||
        (p.Description || "").toLowerCase().includes(q)
    );
  }, [query, activeProducts]);

  const goHome = () => { setView({ page: "home", category: null }); setQuery(""); };
  const goCategory = (catName) => { setView({ page: "category", category: catName }); setQuery(""); window.scrollTo(0, 0); };
  const goNav = (page) => { setView({ page, category: null }); setQuery(""); window.scrollTo(0, 0); };

  const categoryProducts = view.category
    ? activeProducts.filter((p) => p.Category === view.category)
    : [];
  const currentCategoryObj = activeCategories.find((c) => c.Category === view.category);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF8", fontFamily: "Inter, sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap');
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <Header query={query} setQuery={setQuery} onNav={goNav} onLogoClick={goHome} />

      {(usingDemo || error) && (
        <div className="bg-[#FFF6E5] border-b border-[#F3E3B8] text-[#8A6A1A] text-[12.5px] px-4 py-2 flex items-center justify-center gap-2 text-center">
          <AlertCircle size={14} className="shrink-0" />
          {error || "Showing demo data — add your Google Sheet CSV links in CONFIG to go live."}
        </div>
      )}

      {query.trim() ? (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for "{query}"
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-slate-500 mt-6 text-center py-16">No products found. Try a different search term.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              {searchResults.map((p) => <ProductCard key={p.ID} product={p} />)}
            </div>
          )}
        </main>
      ) : view.page === "home" ? (
        <main className="flex-1">
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center">
            <h1
              className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight mb-3"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Discover Useful Products in One Place
            </h1>
            <p className="text-slate-500 text-[15px] max-w-xl mx-auto mb-6">
              Explore products across education, baby care, women & girls, electronics and more.
            </p>
            <div className="max-w-md mx-auto relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-[14px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C4D9F2]"
              />
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <h2 className="text-xl font-bold text-slate-800 mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>
              Explore Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeCategories.map((c) => (
                <CategoryCard key={c.ID} cat={c} count={countFor(c.Category)} onClick={() => goCategory(c.Category)} />
              ))}
            </div>
          </section>

          {featured.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
              <h2 className="text-xl font-bold text-slate-800 mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>
                Featured Products
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featured.map((p) => <ProductCard key={p.ID} product={p} />)}
              </div>
            </section>
          )}
        </main>
      ) : view.page === "category" ? (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
          <button onClick={goHome} className="inline-flex items-center gap-1 text-[14px] text-slate-500 hover:text-slate-800 mb-6">
            <ArrowLeft size={15} /> Back to Home
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{currentCategoryObj?.Icon}</span>
            <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Poppins, sans-serif" }}>
              {view.category}
            </h1>
          </div>
          <p className="text-slate-500 text-[14px] mb-1">{currentCategoryObj?.Description}</p>
          <p className="text-slate-400 text-[13px] mb-6">{categoryProducts.length} product{categoryProducts.length === 1 ? "" : "s"}</p>
          {categoryProducts.length === 0 ? (
            <p className="text-slate-500 text-center py-16">No products found in this category yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryProducts.map((p) => <ProductCard key={p.ID} product={p} />)}
            </div>
          )}
        </main>
      ) : view.page === "categories" ? (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
          <h1 className="text-2xl font-bold text-slate-800 mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>All Categories</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeCategories.map((c) => (
              <CategoryCard key={c.ID} cat={c} count={countFor(c.Category)} onClick={() => goCategory(c.Category)} />
            ))}
          </div>
        </main>
      ) : (
        <StaticPage page={view.page} onBack={goHome} />
      )}

      <Footer categories={activeCategories} onNav={goNav} onCategory={goCategory} />
    </div>
  );
}