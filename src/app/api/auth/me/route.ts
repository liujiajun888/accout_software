import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.userId,
        username: user.username,
        nickname: user.nickname,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    );
  }
}
