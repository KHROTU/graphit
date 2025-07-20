import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import ThemeProvider from "@/lib/context/ThemeContext";
import Navbar from "@/components/layout/Navbar";
import { ExportModalProvider } from "@/lib/context/ExportModalContext";
import ExportModal from "@/components/shared/ExportModal";
import { SearchProvider } from "@/lib/context/SearchContext";
import SearchOverlay from "@/components/shared/SearchOverlay";
import { getAllDiagrams } from "@/lib/content";
import { SessionProvider } from "@/lib/context/SessionContext";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "GraphIt! - Educational Diagram Creation Platform",
  description: "Create and customize diagrams across different academic levels and subjects.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const allDiagrams = await getAllDiagrams();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning={true}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            <ExportModalProvider>
              <SearchProvider>
                <Navbar />
                <main className="pt-20 px-4 md:px-8 max-w-7xl mx-auto">
                  {children}
                </main>
                <ExportModal />
                <SearchOverlay allDiagrams={allDiagrams} />
              </SearchProvider>
            </ExportModalProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}