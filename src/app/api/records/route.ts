import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { records, users, categories } from "@/lib/db/schema";
import { verifyAuth } from "@/lib/auth";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";

// GET /api/records - 获取记录列表
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 构建查询条件
    const conditions = [];

    if (startDate) {
      conditions.push(gte(records.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(records.date, endDate));
    }

    if (categoryId) {
      conditions.push(eq(records.categoryId, parseInt(categoryId)));
    }

    if (userId) {
      conditions.push(eq(records.userId, parseInt(userId)));
    }

    // 查询总数
    const totalResult = await db
      .select({ count: count() })
      .from(records)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult[0]?.count || 0;

    // 查询记录列表（关联用户和分类）
    const recordsList = await db
      .select({
        record: records,
        user: {
          id: users.id,
          nickname: users.nickname,
        },
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
        },
      })
      .from(records)
      .leftJoin(users, eq(records.userId, users.id))
      .leftJoin(categories, eq(records.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(records.date), desc(records.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // 格式化返回数据
    const formattedRecords = recordsList.map((item) => ({
      id: item.record.id,
      userId: item.record.userId,
      type: item.record.type,
      amount: parseFloat(item.record.amount as string),
      categoryId: item.record.categoryId,
      note: item.record.note,
      date: item.record.date,
      createdAt: item.record.createdAt,
      userNickname: item.user?.nickname || "",
      categoryName: item.category?.name || "",
      categoryIcon: item.category?.icon || null,
    }));

    return NextResponse.json({
      data: formattedRecords,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get records error:", error);
    return NextResponse.json(
      { error: "获取记录失败" },
      { status: 500 }
    );
  }
}

// POST /api/records - 创建新记录
export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
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

    // 创建记录
    const [newRecord] = await db
      .insert(records)
      .values({
        userId: user.userId,
        type,
        amount: amount.toString(),
        categoryId: categoryId || null,
        note: note || null,
        date,
      })
      .returning();

    // 获取用户信息
    const userInfo = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
      columns: {
        nickname: true,
      },
    });

    // 获取分类信息
    let categoryInfo = null;
    if (categoryId) {
      categoryInfo = await db.query.categories.findFirst({
        where: eq(categories.id, categoryId),
      });
    }

    return NextResponse.json({
      data: {
        ...newRecord,
        amount: parseFloat(newRecord.amount as string),
        userNickname: userInfo?.nickname || "",
        categoryName: categoryInfo?.name || "",
        categoryIcon: categoryInfo?.icon || null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create record error:", error);
    return NextResponse.json(
      { error: "创建记录失败" },
      { status: 500 }
    );
  }
}
