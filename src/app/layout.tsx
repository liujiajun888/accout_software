"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("font-sans", inter.variable)}>
      <head>
        <title>记账本</title>
        <meta name="description" content="简单好用的个人记账应用" />
      </head>
      <body
        className={`${inter.variable} antialiased tabular-nums`}
        style={{ fontFamily: 'var(--font-sans), system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' }}
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
