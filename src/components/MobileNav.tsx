"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Tags,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "首页", icon: LayoutDashboard },
  { href: "/records", label: "账单", icon: Receipt },
  { href: "/records/add", label: "记账", icon: PlusCircle, isCenter: true },
  { href: "/categories", label: "分类", icon: Tags },
  { href: "/statistics", label: "统计", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  // 登录页不显示底部导航
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border z-50 safe-area-pb">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center -mt-6",
                  "w-14 h-14 rounded-full bg-primary text-primary-foreground",
                  "shadow-lg shadow-primary/25 transition-transform duration-200",
                  "active:scale-95"
                )}
              >
                <Icon className="w-6 h-6" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full",
                "transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
