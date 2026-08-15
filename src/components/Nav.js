"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useData } from "@/context/DataContext";

const NAV_MENUS = [
  {
    label: "Dashboard",
    href: "/",
    icon: "dashboard",
    match: ["/", "/reports", "/library", "/import", "/module-import"],
    items: [
      { href: "/", label: "Executive Dashboard", desc: "Program totals, progress and charts", icon: "dashboard" },
      { href: "/reports", label: "Reports & Analytics", desc: "Consolidated summaries and audit logs", icon: "file" },
      { href: "/library", label: "Guidelines & Manual", desc: "Technical standards, checklists and references", icon: "book" },
      { href: "/library/guidance", label: "Guidance Library", desc: "Linked guidance sections and notes", icon: "book" },
      { href: "/import", label: "Master Excel Import", desc: "BTASP internal monitoring workbook", icon: "upload" },
      { href: "/module-import", label: "Module Data Import", desc: "NTFP action plans, capacity and GIS layers", icon: "layers" },
    ],
  },
  {
    label: "Interventions",
    href: "/interventions",
    icon: "leaf",
    match: ["/interventions", "/manual-entry"],
    items: [
      { href: "/interventions", label: "Interventions Matrix", desc: "26 forestry and soil conservation models", icon: "leaf" },
      { href: "/manual-entry", label: "Manual Data Entry", desc: "Field progress logging and history", icon: "edit" },
    ],
  },
  {
    label: "Planning Units",
    href: "/planning-units",
    icon: "pin",
    match: ["/planning-units"],
    items: [
      { href: "/planning-units", label: "All Planning Units", desc: "100 PUs with land use and demographics", icon: "pin" },
    ],
  },
  {
    label: "Divisions",
    href: "/divisions",
    icon: "tree",
    match: ["/divisions"],
    items: [
      { href: "/divisions", label: "Forest Divisions", desc: "13 territorial forest division summaries", icon: "tree" },
    ],
  },
  {
    label: "NTFP Value Chains",
    href: "/ntfp",
    icon: "hex",
    match: ["/ntfp"],
    items: [
      { href: "/ntfp", label: "NTFP Value Chains", desc: "Honey, walnut, persimmon, pomegranate and medicinal", icon: "hex" },
      { href: "/module-import", label: "Import Action Plan", desc: "Upload NTFP Excel action plans", icon: "upload" },
    ],
  },
  {
    label: "Capacity Building",
    href: "/capacity-building",
    icon: "users",
    match: ["/capacity-building"],
    items: [
      { href: "/capacity-building", label: "Capacity Building", desc: "Nine BTASP groups and 551 planned events", icon: "users" },
      { href: "/capacity-building/events", label: "Events Register", desc: "Workshop and training event records", icon: "users" },
      { href: "/capacity-building/calendar", label: "Training Calendar", desc: "Scheduled capacity-building calendar", icon: "calendar" },
      { href: "/module-import", label: "Import Capacity Plan", desc: "Upload the Global Capacity Building Plan", icon: "upload" },
    ],
  },
  {
    label: "GIS / Spatial Map",
    href: "/gis",
    icon: "map",
    match: ["/gis"],
    items: [
      { href: "/gis", label: "GIS / Spatial Map", desc: "Multi-layer GIS, shapefiles and boundaries", icon: "map" },
      { href: "/module-import", label: "Import Spatial Layer", desc: "Upload shapefile, KML or GeoJSON", icon: "layers" },
    ],
  },
];

function Icon({ name, size = 16 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.2" />
          <rect x="14" y="3" width="7" height="7" rx="1.2" />
          <rect x="3" y="14" width="7" height="7" rx="1.2" />
          <rect x="14" y="14" width="7" height="7" rx="1.2" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...props}>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    case "pin":
      return (
        <svg {...props}>
          <path d="M12 21s7-5.33 7-11a7 7 0 1 0-14 0c0 5.67 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );
    case "tree":
      return (
        <svg {...props}>
          <path d="M12 22v-7" />
          <path d="M9 22h6" />
          <path d="M12 15 7.5 9.5H10L8 5h8l-2 4.5h2.5L12 15Z" />
        </svg>
      );
    case "hex":
      return (
        <svg {...props}>
          <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Z" />
        </svg>
      );
    case "book":
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "map":
      return (
        <svg {...props}>
          <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </svg>
      );
    case "edit":
      return (
        <svg {...props}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      );
    case "upload":
      return (
        <svg {...props}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5-5 5 5" />
          <path d="M12 5v12" />
        </svg>
      );
    case "layers":
      return (
        <svg {...props}>
          <path d="m12 2 9 4.5-9 4.5L3 6.5 12 2Z" />
          <path d="m3 12 9 4.5 9-4.5" />
          <path d="m3 17.5 9 4.5 9-4.5" />
        </svg>
      );
    case "file":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "grid":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.2" />
          <rect x="14" y="3" width="7" height="7" rx="1.2" />
          <rect x="3" y="14" width="7" height="7" rx="1.2" />
          <rect x="14" y="14" width="7" height="7" rx="1.2" />
        </svg>
      );
    case "menu":
      return (
        <svg {...props}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      );
    case "close":
      return (
        <svg {...props}>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M3 10h18" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...props}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    default:
      return null;
  }
}

function BrandMark() {
  return (
    <svg className="brand-crest-svg" viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="crestGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d8a4e" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#crestGrad)" />
      <path
        d="M20 8c6.5 3.2 9.5 8.2 9.5 14.2 0 5.4-3.8 8.8-9.5 9.8-5.7-1-9.5-4.4-9.5-9.8C10.5 16.2 13.5 11.2 20 8Z"
        fill="#ecfdf5"
        opacity="0.95"
      />
      <path d="M20 12.5v17" stroke="#166534" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 18c-3.2.4-5.4 2-6.6 4.4" stroke="#166534" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M20 15.5c2.8.6 4.8 2 6 4.2" stroke="#166534" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function menuIsActive(pathname, menu) {
  return (menu.match || [menu.href]).some((href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  });
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useData();

  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const menusRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menusRef.current && !menusRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setSearchFocused(false);
        setMobileOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
    setSearchFocused(false);
  }, [pathname]);

  function openNavMenu(label) {
    clearTimeout(closeTimer.current);
    setOpenMenu(label);
  }

  function scheduleCloseNavMenu() {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 160);
  }

  function navigateTo(href, event) {
    event?.preventDefault?.();
    setOpenMenu(null);
    setMobileOpen(false);
    setSearchFocused(false);
    setSearchQuery("");
    if (pathname === href) return;
    router.push(href);
  }

  const searchResults = (() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    const results = [];

    (data?.interventionsMaster || []).forEach((item) => {
      if (item.name?.toLowerCase().includes(q)) {
        results.push({ type: "Intervention", title: item.name, href: `/interventions/${item.id}`, icon: "leaf" });
      }
    });

    (data?.planningUnits || []).forEach((pu) => {
      if (pu.name?.toLowerCase().includes(q)) {
        results.push({
          type: "Planning Unit",
          title: `${pu.name} (${pu.divisionName || "PU"})`,
          href: `/planning-units/${pu.id}`,
          icon: "pin",
        });
      }
    });

    (data?.divisions || []).forEach((div) => {
      if (div.name?.toLowerCase().includes(q)) {
        results.push({ type: "Forest Division", title: div.name, href: `/divisions/${div.id}`, icon: "tree" });
      }
    });

    (data?.ntfpValueChains || []).forEach((vc) => {
      if (vc.name?.toLowerCase().includes(q) || vc.commonName?.toLowerCase().includes(q)) {
        results.push({ type: "NTFP Value Chain", title: vc.name, href: `/ntfp/${vc.id}`, icon: "hex" });
      }
    });

    (data?.capacityPlanItems || []).forEach((item) => {
      if (
        item.trainingSubject?.toLowerCase().includes(q) ||
        item.moduleCode?.toLowerCase().includes(q) ||
        item.moduleGroupName?.toLowerCase().includes(q)
      ) {
        results.push({
          type: "Capacity Building",
          title: `${item.moduleCode} — ${item.trainingSubject}`,
          href: `/capacity-building/${encodeURIComponent(item.moduleGroupCode || item.moduleGroupName)}`,
          icon: "users",
        });
      }
    });

    return results.slice(0, 8);
  })();

  return (
    <header className="app-nav">
      <div className="app-nav-top">
        <div className="app-nav-container">
          <div className="app-nav-brand">
            <Link href="/" className="app-nav-brand-link" onClick={(e) => navigateTo("/", e)}>
              <span className="brand-crest">
                <BrandMark />
              </span>
              <span className="brand-text-stack">
                <span className="brand-title-row">
                  <span className="brand-title">PFRMP Assistant</span>
                  <span className="brand-badge">BTASP DSS</span>
                </span>
                <span className="brand-sub">Monitoring &amp; Knowledge Base</span>
              </span>
            </Link>
          </div>

          <div className="app-nav-right-group">
            <div className="header-search-wrapper" ref={searchRef}>
              <div className={`header-search-box ${searchFocused ? "is-focused" : ""}`}>
                <span className="search-icon-svg">
                  <Icon name="search" size={15} />
                </span>
                <input
                  ref={searchInputRef}
                  type="search"
                  className="header-search-input"
                  placeholder="Search PUs, divisions, interventions…"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  aria-label="Search records"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                  >
                    <Icon name="close" size={12} />
                  </button>
                ) : (
                  <kbd className="search-kbd">Ctrl K</kbd>
                )}
              </div>

              {searchFocused && searchQuery.trim().length >= 2 && (
                <div className="header-search-dropdown">
                  {searchResults.length > 0 ? (
                    <div className="search-results-list">
                      <div className="search-results-header">Matching records ({searchResults.length})</div>
                      {searchResults.map((res, i) => (
                        <a
                          key={`${res.href}-${i}`}
                          href={res.href}
                          className="search-result-item"
                          onClick={(e) => navigateTo(res.href, e)}
                        >
                          <span className="result-icon">
                            <Icon name={res.icon} size={15} />
                          </span>
                          <div className="result-info">
                            <strong>{res.title}</strong>
                            <span className="result-type-badge">{res.type}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="search-no-results">
                      <p className="small muted">No matches found for “{searchQuery}”.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
            >
              <Icon name={mobileOpen ? "close" : "menu"} size={18} />
            </button>
          </div>
        </div>
      </div>

      <nav className="app-nav-bottom" aria-label="Primary">
        <div className="app-nav-container">
          <div className="app-nav-center-group" ref={menusRef}>
            {NAV_MENUS.map((menu) => {
              const active = menuIsActive(pathname, menu);
              const open = openMenu === menu.label;
              return (
                <div
                  key={menu.label}
                  className="nav-item-dropdown"
                  onMouseEnter={() => openNavMenu(menu.label)}
                  onMouseLeave={scheduleCloseNavMenu}
                >
                  <div className={`nav-primary-cluster ${active ? "active" : ""} ${open ? "dropdown-open" : ""}`}>
                    <a
                      href={menu.href}
                      title={menu.label}
                      className="nav-primary-link"
                      onClick={(e) => navigateTo(menu.href, e)}
                    >
                      <span className="nav-icon">
                        <Icon name={menu.icon} size={14} />
                      </span>
                      <span>{menu.label}</span>
                    </a>
                    <button
                      type="button"
                      className="nav-chevron-btn"
                      aria-label={`${menu.label} menu`}
                      aria-expanded={open}
                      onClick={() => setOpenMenu(open ? null : menu.label)}
                    >
                      <span className={`dropdown-chevron ${open ? "open" : ""}`}>
                        <Icon name="chevron" size={14} />
                      </span>
                    </button>
                  </div>

                  {open && (
                    <div className="nav-item-menu">
                      {menu.items.map((item) => {
                        const itemActive = isActive(pathname, item.href);
                        return (
                          <a
                            key={item.href}
                            href={item.href}
                            className={`dropdown-item-link ${itemActive ? "item-active" : ""}`}
                            onClick={(e) => navigateTo(item.href, e)}
                          >
                            <span className="item-icon-box">
                              <Icon name={item.icon} size={16} />
                            </span>
                            <span className="item-text-box">
                              <strong>{item.label}</strong>
                              <span>{item.desc}</span>
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-nav-drawer">
          {NAV_MENUS.map((menu) => (
            <div key={menu.label} className="mobile-category-block">
              <div className="mobile-category-title">{menu.label}</div>
              <div className="mobile-links-list">
                {menu.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`mobile-link ${isActive(pathname, item.href) ? "active" : ""}`}
                    onClick={(e) => navigateTo(item.href, e)}
                  >
                    <span className="mobile-link-icon">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
