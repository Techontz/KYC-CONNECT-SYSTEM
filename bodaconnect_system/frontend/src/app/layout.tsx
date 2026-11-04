import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "BodaConnect OS", template: "%s · BodaConnect OS" },
  description: "UMAPIDO Dodoma rider registry, verification and association operations, by Wadonge Group Limited.",
  applicationName: "BodaConnect OS",
  appleWebApp: { capable: true, title: "BodaConnect", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1F3E35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sw" className={inter.variable}>
      <body className="min-h-dvh bg-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
