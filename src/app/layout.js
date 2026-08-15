import "./globals.css";
import AppFrame from "@/components/AppFrame";

export const metadata = {
  title: "PFRMP Assistant",
  description: "BTASP monitoring dashboard for interventions, planning units, and PFRMP documents.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
