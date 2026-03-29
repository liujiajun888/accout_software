"use client";

import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Toaster } from "@/components/ui/sonner";

const systemFontFamily = [
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  '"Noto Sans SC"',
  '"PingFang SC"',
  '"Microsoft YaHei"',
  "sans-serif",
].join(", ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="font-sans">
      <head>
        <title>记账本</title>
        <meta name="description" content="简单好用的个人记账应用" />
      </head>
      <body
        className="antialiased tabular-nums"
        style={{ fontFamily: systemFontFamily }}
      >
        <AuthProvider>
          <Sidebar />
          <main className="md:pl-16 min-h-screen pb-16 md:pb-0">
            <div className="animate-fade-in">{children}</div>
          </main>
          <MobileNav />
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
