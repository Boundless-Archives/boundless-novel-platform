import Navbar from "@/components/Navbar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
        <Navbar />

        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
