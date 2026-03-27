import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createToken, getAuthCookieOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // 创建 JWT token
    const token = await createToken({
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
    });

    // 设置 cookie
    const cookieOptions = getAuthCookieOptions();
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      },
    });

    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
