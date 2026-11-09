import type { Metadata, Viewport } from "next";
import { Wix_Madefor_Text } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";

// Closest free match to Safiri's custom fonts by measured letter widths. next/font self-hosts it.
const bodyFont = Wix_Madefor_Text({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-brand", display: "swap" });

export const metadata: Metadata = {
  title: "BodaKonnect | Usajili wa Madereva wa Bodaboda na Bajaji",
  description:
    "BodaKonnect inaunganisha madereva wa bodaboda na bajaji, vyama na watoa huduma Tanzania. Developed and operated by KYC CONNECT LTD.",
  icons: { icon: "/icon.svg" },
  openGraph: { images: ["/brand/bodakonnect-logo.png"] },
};

export const viewport: Viewport = {
  themeColor: "#1f3e35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sw" className={bodyFont.variable}>
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
