import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Amatic_SC } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/toaster";

const amatic = Amatic_SC({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-amatic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Стихи Толика",
  description: "Сайт стихов Толика (WordPress‑powered with fallback)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="ru" suppressHydrationWarning className={`${amatic.variable} scroll-smooth`}>
        <body className="min-h-screen bg-background text-foreground">
          <ThemeProvider attribute="class" defaultTheme="system">
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}


