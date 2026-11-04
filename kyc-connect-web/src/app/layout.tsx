import type { Metadata, Viewport } from "next";
import { Arimo } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";

// M-KOPA uses Helvetica Neue LT Pro (commercial). We use Helvetica Neue where the device has it
// (Mac, iPhone) and Arimo, a free Helvetica-metric font, everywhere else.
const arimo = Arimo({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-arimo", display: "swap" });

export const metadata: Metadata = {
  title: "KYC CONNECT LTD | BodaKonnect | Identity. Trust. Connection.",
  description:
    "KYC CONNECT LTD builds digital identity, data and compliance technology in Tanzania. BodaKonnect, its flagship platform, connects bodaboda and bajaji riders, associations and institutions, starting with the Dodoma pilot.",
  icons: { icon: "/icon.svg" },
  openGraph: { images: ["/brand/kycconnect-logo.png"] },
};

export const viewport: Viewport = {
  themeColor: "#1f3e35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sw" className={arimo.variable}>
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
