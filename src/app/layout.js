import "./globals.css";
import Nav from "@/components/Nav";
import { DataProvider } from "@/context/DataContext";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "PFRMP Assistant",
  description: "BTASP monitoring dashboard for interventions, planning units, and PFRMP documents.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <DataProvider>
          <Nav />
          <AppShell>{children}</AppShell>
        </DataProvider>
      </body>
    </html>
  );
}
