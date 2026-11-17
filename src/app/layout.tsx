import "@fontsource-variable/outfit";
import type { Metadata, Viewport } from "next";
import { THEME_INIT_SCRIPT } from "@/components/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoveDays · 倒数日",
  description: "记录每一个重要的日子",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The inline script sets data-theme / data-theme-pref before first paint, so the attributes differ from SSR.
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
