import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const TOKEN_COOKIE_NAME = "token";

export interface JWTPayload {
  userId: number;
  username: string;
  nickname: string;
}

// 创建 JWT token
export async function createToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new SignJWT({
    userId: payload.userId,
    username: payload.username,
    nickname: payload.nickname,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

// 验证 JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      nickname: payload.nickname as string,
    };
  } catch {
    return null;
  }
}

// 从请求头中获取 token
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  
  return parts[1];
}

// 从 cookie 中获取 token
export function getTokenFromCookie(request: NextRequest): string | null {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  return token || null;
}

// 验证请求认证 - 从 cookie 或 Authorization header 中提取 JWT
export async function verifyAuth(request: NextRequest): Promise<JWTPayload | null> {
  // 优先从 cookie 获取
  let token = getTokenFromCookie(request);
  
  // 如果没有 cookie，尝试从 header 获取
  if (!token) {
    const authHeader = request.headers.get("authorization");
    token = getTokenFromHeader(authHeader);
  }
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

// 设置认证 cookie 的选项
export function getAuthCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return {
    name: TOKEN_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
