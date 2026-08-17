import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";

export const metadata: Metadata = {
  title: "Energy Tail | Oil, Gas & Energy Jobs",
  description: "Connecting Energy Professionals with Top Opportunities",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans">
        {/* Wraps the whole tree so any page can read the signed-in user. */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
