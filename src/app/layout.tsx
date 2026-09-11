import Navbar from "@/components/Navbar";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Spectral } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
metadataBase: new URL(
"https://boundless.com"
),

title: {
default: "Boundless",
template: "%s | Boundless",
},

description:
"Discover, read, and share original stories, novels, and web serials without limits.",

applicationName: "Boundless",

manifest: "/manifest.webmanifest",

appleWebApp: {
  capable: true,
  title: "Boundless",
  statusBarStyle: "black-translucent",
},

formatDetection: {
  telephone: false,
},

keywords: [
"stories",
"novels",
"web novels",
"web serials",
"fiction",
"authors",
"reading",
"writing",
"story platform",
"online novels",
"fantasy",
"science fiction",
"romance",
],

authors: [
{
name: "Boundless",
},
],

creator: "Boundless",

publisher: "Boundless",

openGraph: {
title: "Boundless",
description:
"Discover, read, and share original stories without limits.",
siteName: "Boundless",
type: "website",
},

twitter: {
card: "summary_large_image",
title: "Boundless",
description:
"Discover, read, and share original stories without limits.",
},

robots: {
index: true,
follow: true,
},
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spectral.variable} h-full antialiased`}
    >
      <body
        className="
          min-h-full
          flex
          flex-col
          bg-background
          text-foreground
        "
      >
        <div className="cosmic-backdrop" aria-hidden="true" />

        <ThemeProvider>
          <div className="atmosphere" aria-hidden="true" />

          <Navbar />

          <div className="flex-1">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
