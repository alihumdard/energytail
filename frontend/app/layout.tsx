import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import VerificationBanner from "@/components/auth/VerificationBanner";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  /*
   * metadataBase is what turns the relative canonical paths the pages declare
   * into absolute URLs. Without it Next emits the path alone, and a canonical
   * without an origin is ignored — the pages would look tagged but not be.
   */
  metadataBase: new URL(SITE_URL),
  // "%s | Energy Tail" applied centrally, so pages set only their own name.
  title: {
    default: "Energy Tail | Oil, Gas & Energy Jobs",
    template: "%s | Energy Tail",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_GB",
  },
  robots: {
    index: true,
    follow: true,
    // Lets Google show full-length previews and large image thumbnails.
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      {/*
        suppressHydrationWarning: browser extensions (password managers,
        Grammarly, dark-mode tools) inject attributes onto <body> before React
        hydrates, which React reports as a mismatch. It suppresses the warning
        for this element's attributes only — never for its children.
      */}
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-white text-slate-900 font-sans"
      >
        {/* Wraps the whole tree so any page can read the signed-in user. */}
        <AuthProvider>
          {/*
            Mounted once here rather than per page: it renders nothing for
            guests and verified users, and every screen behind a login is a
            place the reminder belongs.
          */}
          <VerificationBanner />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
