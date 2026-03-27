import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";

// 需要认证的路径
const protectedPaths = [
  "/dashboard",
  "/records",
  "/categories",
  "/statistics",
  "/budget",
];

// 认证相关路径
const authPaths = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是受保护的路径
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // 检查是否是认证路径
  const isAuthPath = authPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // 验证用户是否已登录
  const user = await verifyAuth(request);
  const isAuthenticated = !!user;

  // 如果访问受保护路径但未登录，重定向到登录页
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 如果已登录但访问登录页，重定向到仪表盘
  if (isAuthPath && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 其他情况正常通过
  return NextResponse.next();
}

// 配置匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - api (API 路由自己处理认证)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (浏览器图标)
     * - 其他静态资源
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
