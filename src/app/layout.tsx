import type { Metadata } from "next";
import { Literata, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Literata({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Augt",
  description: "Dieva Vārds. Ticība. Dzīve. Katru dienu.",
  applicationName: "Augt",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Augt",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [{ url: "/icons/apple-touch-sprout.png", sizes: "180x180" }],
    icon: [
      { url: "/icons/icon-sprout.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/favicon-sprout.ico", sizes: "any" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lv" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
