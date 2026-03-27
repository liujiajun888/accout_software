"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Tags,
  BarChart3,
  Wallet,
  LogOut,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/records/add", label: "记账", icon: PlusCircle },
  { href: "/records", label: "账单", icon: Receipt },
  { href: "/categories", label: "分类", icon: Tags },
  { href: "/statistics", label: "统计", icon: BarChart3 },
  { href: "/budget", label: "预算", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // 登录页不显示侧边栏
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-16 hover:w-56 bg-white border-r border-border transition-all duration-300 ease-in-out group z-50">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border">
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-lg"
        >
          记
        </Link>
        <span className="hidden group-hover:block ml-3 font-semibold text-lg whitespace-nowrap overflow-hidden">
          记账本
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-11 px-3 rounded-xl transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden group-hover:block ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-2 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-full h-11 px-3 justify-start rounded-xl hover:bg-accent inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="hidden group-hover:block ml-3 text-left overflow-hidden">
              <p className="text-sm font-medium truncate">
                {user?.nickname || "用户"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.username || ""}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.nickname}</p>
              <p className="text-xs text-muted-foreground">{user?.username}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
