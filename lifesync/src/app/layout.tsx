import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/lib/constants";
import { themeInitScript } from "@/components/layout/theme";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "LifeSync", template: "%s · LifeSync" },
  description: "Three People. One Smart Plan. Better Everyday Life.",
  robots: { index: false, follow: false }, // private household app
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const raw = (await cookies()).get(THEME_COOKIE)?.value;
  const pref = raw === "light" || raw === "dark" ? raw : "system";
  return (
    <html lang="en-GB" data-pref={pref} data-theme={pref === "system" ? undefined : pref} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
