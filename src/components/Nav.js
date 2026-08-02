"use client";

import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/interventions", label: "Interventions" },
  { href: "/planning-units", label: "Planning Units" },
  { href: "/divisions", label: "Forest Divisions" },
  { href: "/manual-entry", label: "Manual Data Entry" },
  { href: "/import", label: "Excel Import" },
  { href: "/library", label: "Guidelines / PFRMP Manual" },
  { href: "/reports", label: "Reports" },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  function goTo(href, event) {
    event.preventDefault();
    if (pathname === href) return;
    router.push(href);
  }

  return (
    <nav className="app-nav">
      <div className="app-nav-brand">
        <a href="/" className="app-nav-brand-link" onClick={(e) => goTo("/", e)}>
          PFRMP Assistant
        </a>
      </div>
      <div className="app-nav-links">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={isActive(pathname, item.href) ? "active" : ""}
            onClick={(e) => goTo(item.href, e)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
