import Navbar from "@/components/Navbar";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Spectral } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import BreakthroughFanfare from "@/components/cultivation/BreakthroughFanfare";
import BugReportButton from "@/components/feedback/BugReportButton";
import SecretCode from "@/components/easter/SecretCode";
import SiteBeacon from "@/components/quests/SiteBeacon";
import InstallPrompt from "@/components/InstallPrompt";
import AppSplash from "@/components/AppSplash";
import Script from "next/script";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getPublicSettings, isAdminUser } from "@/lib/platform";
import MaintenanceScreen from "@/components/platform/MaintenanceScreen";
import PlatformBanner from "@/components/platform/PlatformBanner";

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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.boundlessarchive.org";

/*
 * The name and description come from Admin > Platform Settings, so a
 * change there shows up in browser titles and link previews.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const name = settings.platform_name;
  const description = settings.platform_description;

  return {
    metadataBase: new URL(SITE_URL),

    title: {
      default: name,
      template: `%s | ${name}`,
    },

    description,

    applicationName: name,

    manifest: "/manifest.webmanifest",

    appleWebApp: {
      capable: true,
      title: name,
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

    authors: [{ name }],
    creator: name,
    publisher: name,

    openGraph: {
      title: name,
      description,
      siteName: name,
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSettings();

  // Only look up who is visiting when the answer matters.
  let isAdmin = false;

  if (
    settings.maintenance_mode ||
    settings.read_only_mode ||
    !settings.comments_enabled ||
    !settings.reviews_enabled ||
    !settings.gifts_enabled ||
    !settings.shop_enabled ||
    !settings.quests_enabled
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) isAdmin = await isAdminUser(user.id);
    } catch {
      isAdmin = false;
    }
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  const lockedOut =
    settings.maintenance_mode &&
    !isAdmin &&
    !pathname.startsWith("/auth");

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
        <Script id="bip-capture" strategy="beforeInteractive">
          {`window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__bip=e;});`}
        </Script>
        <AppSplash />
        <AppSplash />
        <div className="cosmic-backdrop" aria-hidden="true" />

        <ThemeProvider>
          <div className="atmosphere" aria-hidden="true" />

          <BreakthroughFanfare />

          {lockedOut ? null : <Navbar />}

          {lockedOut ? null : (
            <PlatformBanner settings={settings} isAdmin={isAdmin} />
          )}

          <div className="flex-1">
            {lockedOut ? (
              <MaintenanceScreen settings={settings} />
            ) : (
              children
            )}
          </div>
          
          <BugReportButton />
          <SecretCode />
          <SiteBeacon />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}