"use client";

import { usePathname } from "next/navigation";

/** Remount page content on route change so the UI never stays stuck on Dashboard. */
export default function Template({ children }) {
  const pathname = usePathname();
  return <div key={pathname}>{children}</div>;
}
