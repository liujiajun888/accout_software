"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@/types";
import { getCurrentUser, logout as apiLogout } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 公开路径（不需要认证）
const publicPaths = ["/login", "/register"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response?.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    router.push("/login");
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 路由守卫逻辑
  useEffect(() => {
    if (isLoading) return;

    const isPublicPath = publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    // 如果未登录且访问非公开路径，重定向到登录页
    if (!user && !isPublicPath && pathname !== "/") {
      router.push("/login");
    }

    // 如果已登录且访问登录页，重定向到仪表盘
    if (user && isPublicPath) {
      router.push("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
