import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "已退出登录" });
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
