import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { records, categories, users } from "@/lib/db/schema";
import { verifyAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/records/[id] - 获取单条记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的记录ID" }, { status: 400 });
    }

    // 查询记录，关联分类和用户信息
    const result = await db
      .select({
        record: records,
        category: categories,
        user: { id: users.id, nickname: users.nickname },
      })
      .from(records)
      .leftJoin(categories, eq(records.categoryId, categories.id))
      .leftJoin(users, eq(records.userId, users.id))
      .where(eq(records.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    const item = result[0];
    return NextResponse.json({
      data: {
        id: item.record.id,
        userId: item.record.userId,
        type: item.record.type,
        amount: parseFloat(item.record.amount as string),
        categoryId: item.record.categoryId,
        categoryName: item.category?.name || "",
        categoryIcon: item.category?.icon || "",
        note: item.record.note,
        date: item.record.date,
        nickname: item.user?.nickname || "",
        createdAt: item.record.createdAt,
      }
    });
  } catch (error) {
    console.error("Get record error:", error);
    return NextResponse.json({ error: "获取记录失败" }, { status: 500 });
  }
}

// PUT /api/records/[id] - 更新记录
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
        { error: "无效的记录ID" },
        { status: 400 }
      );
    }

    // 查找记录
    const existingRecord = await db.query.records.findFirst({
      where: eq(records.id, id),
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "记录不存在" },
        { status: 404 }
      );
    }

    // 只能编辑自己的记录
    if (existingRecord.userId !== user.userId) {
      return NextResponse.json(
        { error: "无权编辑此记录" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, amount, categoryId, note, date } = body;

    // 验证必填字段
    if (!type || amount === undefined || !date) {
      return NextResponse.json(
        { error: "类型、金额和日期不能为空" },
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

    // 验证金额
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "金额必须是正数" },
        { status: 400 }
      );
    }

    // 验证分类是否存在
    if (categoryId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, categoryId),
      });

      if (!category) {
        return NextResponse.json(
          { error: "分类不存在" },
          { status: 400 }
        );
      }
    }

    // 更新记录
    const [updatedRecord] = await db
      .update(records)
      .set({
        type,
        amount: amount.toString(),
        categoryId: categoryId || null,
        note: note || null,
        date,
      })
      .where(eq(records.id, id))
      .returning();

    // 获取分类信息
    let categoryInfo = null;
    if (categoryId) {
      categoryInfo = await db.query.categories.findFirst({
        where: eq(categories.id, categoryId),
      });
    }

    return NextResponse.json({
      data: {
        ...updatedRecord,
        amount: parseFloat(updatedRecord.amount as string),
        categoryName: categoryInfo?.name || "",
        categoryIcon: categoryInfo?.icon || null,
      },
    });
  } catch (error) {
    console.error("Update record error:", error);
    return NextResponse.json(
      { error: "更新记录失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/records/[id] - 删除记录
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
        { error: "无效的记录ID" },
        { status: 400 }
      );
    }

    // 查找记录
    const existingRecord = await db.query.records.findFirst({
      where: eq(records.id, id),
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "记录不存在" },
        { status: 404 }
      );
    }

    // 只能删除自己的记录
    if (existingRecord.userId !== user.userId) {
      return NextResponse.json(
        { error: "无权删除此记录" },
        { status: 403 }
      );
    }

    // 删除记录
    await db.delete(records).where(eq(records.id, id));

    return NextResponse.json({
      message: "删除成功",
    });
  } catch (error) {
    console.error("Delete record error:", error);
    return NextResponse.json(
      { error: "删除记录失败" },
      { status: 500 }
    );
  }
}
