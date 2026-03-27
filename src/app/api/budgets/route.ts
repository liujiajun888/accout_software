import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgets, records, categories } from "@/lib/db/schema";
import { verifyAuth } from "@/lib/auth";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getMonthRange } from "@/lib/utils";

// GET /api/budgets - 获取预算列表
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // 格式: 2026-03

    if (!month) {
      return NextResponse.json(
        { error: "月份参数不能为空" },
        { status: 400 }
      );
    }

    // 验证月份格式
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "月份格式不正确，应为 YYYY-MM" },
        { status: 400 }
      );
    }

    // 查询该月的预算列表
    const budgetList = await db
      .select({
        budget: budgets,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
        },
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.month, month));

    // 计算该月各分类的实际支出
    const { startDate, endDate } = getMonthRange(month);

    const expenseResult = await db
      .select({
        categoryId: records.categoryId,
        total: sql<string>`sum(${records.amount})`,
      })
      .from(records)
      .where(
        and(
          eq(records.type, "expense"),
          gte(records.date, startDate),
          lte(records.date, endDate)
        )
      )
      .groupBy(records.categoryId);

    // 构建实际支出映射
    const expenseMap = new Map<number, number>();
    expenseResult.forEach((item) => {
      if (item.categoryId) {
        expenseMap.set(item.categoryId, parseFloat(item.total) || 0);
      }
    });

    // 格式化返回数据
    const data = budgetList.map((item) => {
      const categoryId = item.budget.categoryId || 0;
      const actualExpense = expenseMap.get(categoryId) || 0;
      const budgetAmount = parseFloat(item.budget.amount as string);

      return {
        id: item.budget.id,
        categoryId: item.budget.categoryId,
        categoryName: item.category?.name || "未分类",
        categoryIcon: item.category?.icon || null,
        amount: budgetAmount,
        month: item.budget.month,
        actualExpense,
        remaining: budgetAmount - actualExpense,
        percentage: budgetAmount > 0 ? (actualExpense / budgetAmount) * 100 : 0,
        createdAt: item.budget.createdAt,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Get budgets error:", error);
    return NextResponse.json(
      { error: "获取预算失败" },
      { status: 500 }
    );
  }
}

// POST /api/budgets - 创建或更新预算（upsert 逻辑）
export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, amount, month } = body;

    // 验证必填字段
    if (categoryId === undefined || amount === undefined || !month) {
      return NextResponse.json(
        { error: "分类ID、金额和月份不能为空" },
        { status: 400 }
      );
    }

    // 验证月份格式
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "月份格式不正确，应为 YYYY-MM" },
        { status: 400 }
      );
    }

    // 验证金额
    if (isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      return NextResponse.json(
        { error: "金额必须是非负数" },
        { status: 400 }
      );
    }

    // 验证分类是否存在
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!category) {
      return NextResponse.json(
        { error: "分类不存在" },
        { status: 400 }
      );
    }

    // 检查该分类该月是否已有预算
    const existingBudget = await db.query.budgets.findFirst({
      where: and(
        eq(budgets.categoryId, categoryId),
        eq(budgets.month, month)
      ),
    });

    let result;

    if (existingBudget) {
      // 更新已有预算
      [result] = await db
        .update(budgets)
        .set({
          amount: amount.toString(),
        })
        .where(eq(budgets.id, existingBudget.id))
        .returning();
    } else {
      // 创建新预算
      [result] = await db
        .insert(budgets)
        .values({
          categoryId,
          amount: amount.toString(),
          month,
        })
        .returning();
    }

    // 计算该分类该月的实际支出
    const { startDate, endDate } = getMonthRange(month);

    const expenseResult = await db
      .select({
        total: sql<string>`sum(${records.amount})`,
      })
      .from(records)
      .where(
        and(
          eq(records.type, "expense"),
          eq(records.categoryId, categoryId),
          gte(records.date, startDate),
          lte(records.date, endDate)
        )
      );

    const actualExpense = parseFloat(expenseResult[0]?.total || "0");
    const budgetAmount = parseFloat(result.amount as string);

    return NextResponse.json({
      data: {
        id: result.id,
        categoryId: result.categoryId,
        categoryName: category.name,
        categoryIcon: category.icon,
        amount: budgetAmount,
        month: result.month,
        actualExpense,
        remaining: budgetAmount - actualExpense,
        percentage: budgetAmount > 0 ? (actualExpense / budgetAmount) * 100 : 0,
        createdAt: result.createdAt,
      },
    }, existingBudget ? { status: 200 } : { status: 201 });
  } catch (error) {
    console.error("Create/Update budget error:", error);
    return NextResponse.json(
      { error: "保存预算失败" },
      { status: 500 }
    );
  }
}
