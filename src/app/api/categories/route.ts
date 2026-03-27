import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { verifyAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/categories - 获取所有分类
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // 构建查询条件
    let result;
    
    if (type && (type === "income" || type === "expense")) {
      result = await db.select().from(categories).where(eq(categories.type, type));
    } else {
      result = await db.select().from(categories);
    }

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "获取分类失败" },
      { status: 500 }
    );
  }
}

// POST /api/categories - 创建新分类
export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, icon } = body;

    // 验证必填字段
    if (!name || !type) {
      return NextResponse.json(
        { error: "名称和类型不能为空" },
        { status: 400 }
      );
    }

    // 验证类型
    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "类型必须是 income 或 expense" },
        { status: 400 }
      );
    }

    // 检查分类名是否已存在
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.name, name),
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "分类名称已存在" },
        { status: 409 }
      );
    }

    // 创建分类
    const [newCategory] = await db
      .insert(categories)
      .values({
        name,
        type,
        icon: icon || null,
      })
      .returning();

    return NextResponse.json({
      data: newCategory,
    }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "创建分类失败" },
      { status: 500 }
    );
  }
}
