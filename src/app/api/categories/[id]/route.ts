import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { verifyAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// PUT /api/categories/[id] - 更新分类
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证认证
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "无效的分类ID" },
        { status: 400 }
      );
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

    // 检查分类是否存在
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "分类不存在" },
        { status: 404 }
      );
    }

    // 检查新名称是否与其他分类冲突
    const nameConflict = await db.query.categories.findFirst({
      where: eq(categories.name, name),
    });

    if (nameConflict && nameConflict.id !== id) {
      return NextResponse.json(
        { error: "分类名称已存在" },
        { status: 409 }
      );
    }

    // 更新分类
    const [updatedCategory] = await db
      .update(categories)
      .set({
        name,
        type,
        icon: icon || null,
      })
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json({
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "更新分类失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证认证
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "无效的分类ID" },
        { status: 400 }
      );
    }

    // 检查分类是否存在
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "分类不存在" },
        { status: 404 }
      );
    }

    // 删除分类
    await db.delete(categories).where(eq(categories.id, id));

    return NextResponse.json({
      message: "删除成功",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "删除分类失败" },
      { status: 500 }
    );
  }
}
