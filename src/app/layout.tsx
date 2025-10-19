import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: "Seller Gift - Digital Gift Card Marketplace Platform",
    template: "%s | Seller Gift"
  },
  description: "The all-in-one platform for businesses to create, manage, and sell digital gift cards globally. Multi-tenant architecture, flexible payments, and enterprise-grade security built in.",
  keywords: [
    "gift card platform",
    "digital gift cards",
    "gift card marketplace",
    "multi-tenant gift cards",
    "sell gift cards online",
    "gift card management",
    "white label gift cards",
    "gift card business",
    "instant delivery gift cards",
    "global gift card sales"
  ],
  authors: [{ name: "Seller Gift" }],
  creator: "Seller Gift",
  publisher: "Seller Gift",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Seller Gift - Digital Gift Card Marketplace Platform",
    description: "The all-in-one platform for businesses to create, manage, and sell digital gift cards globally. Multi-tenant architecture, flexible payments, and enterprise-grade security.",
    siteName: "Seller Gift",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Seller Gift - Digital Gift Card Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seller Gift - Digital Gift Card Marketplace Platform",
    description: "The all-in-one platform for businesses to create, manage, and sell digital gift cards globally.",
    images: ["/og-image.png"],
    creator: "@sellergift",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
