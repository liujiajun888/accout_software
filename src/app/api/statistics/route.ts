import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { records, categories } from "@/lib/db/schema";
import { verifyAuth } from "@/lib/auth";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { getMonthRange } from "@/lib/utils";

// GET /api/statistics - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "summary";
    const month = searchParams.get("month"); // 格式: 2026-03
    const year = searchParams.get("year"); // 格式: 2026
    const userId = searchParams.get("userId");

    // 根据类型返回不同的统计数据
    switch (type) {
      case "summary":
        return getSummaryStatistics(month, year, userId);
      case "trend":
        return getTrendStatistics(month, year, userId);
      case "category":
        return getCategoryStatistics(month, year, userId);
      default:
        return NextResponse.json(
          { error: "无效的统计类型" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Get statistics error:", error);
    return NextResponse.json(
      { error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}

// 获取汇总统计
async function getSummaryStatistics(
  month: string | null,
  year: string | null,
  userId: string | null
) {
  // 构建查询条件
  const conditions = [];

  if (month) {
    // 月份筛选，如 2026-03
    const { startDate, endDate } = getMonthRange(month);
    conditions.push(gte(records.date, startDate));
    conditions.push(lte(records.date, endDate));
  } else if (year) {
    // 年份筛选，如 2026
    conditions.push(gte(records.date, `${year}-01-01`));
    conditions.push(lte(records.date, `${year}-12-31`));
  }

  if (userId) {
    conditions.push(eq(records.userId, parseInt(userId)));
  }

  // 查询总收入和总支出
  const result = await db
    .select({
      type: records.type,
      total: sql<string>`sum(${records.amount})`,
    })
    .from(records)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(records.type);

  let totalIncome = 0;
  let totalExpense = 0;

  result.forEach((item) => {
    const amount = parseFloat(item.total) || 0;
    if (item.type === "income") {
      totalIncome = amount;
    } else if (item.type === "expense") {
      totalExpense = amount;
    }
  });

  // 查询今日收支
  const today = new Date().toISOString().split("T")[0];
  const todayConditions = [eq(records.date, today)];

  if (userId) {
    todayConditions.push(eq(records.userId, parseInt(userId)));
  }

  const todayResult = await db
    .select({
      type: records.type,
      total: sql<string>`sum(${records.amount})`,
    })
    .from(records)
    .where(and(...todayConditions))
    .groupBy(records.type);

  let todayIncome = 0;
  let todayExpense = 0;

  todayResult.forEach((item) => {
    const amount = parseFloat(item.total) || 0;
    if (item.type === "income") {
      todayIncome = amount;
    } else if (item.type === "expense") {
      todayExpense = amount;
    }
  });

  return NextResponse.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    todayExpense,
    todayIncome,
  });
}

// 获取趋势统计
async function getTrendStatistics(
  month: string | null,
  year: string | null,
  userId: string | null
) {
  // 构建查询条件
  const conditions = [];

  if (month) {
    // 月份筛选
    const { startDate, endDate } = getMonthRange(month);
    conditions.push(gte(records.date, startDate));
    conditions.push(lte(records.date, endDate));
  } else if (year) {
    // 年份筛选
    conditions.push(gte(records.date, `${year}-01-01`));
    conditions.push(lte(records.date, `${year}-12-31`));
  }

  if (userId) {
    conditions.push(eq(records.userId, parseInt(userId)));
  }

  // 按日期分组查询
  const result = await db
    .select({
      date: records.date,
      type: records.type,
      total: sql<string>`sum(${records.amount})`,
    })
    .from(records)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(records.date, records.type)
    .orderBy(records.date);

  // 格式化数据
  const dataMap = new Map<string, { date: string; income: number; expense: number }>();

  result.forEach((item) => {
    const date = item.date;
    const amount = parseFloat(item.total) || 0;

    if (!dataMap.has(date)) {
      dataMap.set(date, { date, income: 0, expense: 0 });
    }

    const entry = dataMap.get(date)!;
    if (item.type === "income") {
      entry.income = amount;
    } else if (item.type === "expense") {
      entry.expense = amount;
    }
  });

  // 转换为数组并排序
  const data = Array.from(dataMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return NextResponse.json({ data });
}

// 获取分类统计
async function getCategoryStatistics(
  month: string | null,
  year: string | null,
  userId: string | null
) {
  // 构建查询条件 - 只统计支出
  const conditions = [eq(records.type, "expense")];

  if (month) {
    // 月份筛选
    const { startDate, endDate } = getMonthRange(month);
    conditions.push(gte(records.date, startDate));
    conditions.push(lte(records.date, endDate));
  } else if (year) {
    // 年份筛选
    conditions.push(gte(records.date, `${year}-01-01`));
    conditions.push(lte(records.date, `${year}-12-31`));
  }

  if (userId) {
    conditions.push(eq(records.userId, parseInt(userId)));
  }

  // 按分类查询支出
  const result = await db
    .select({
      categoryId: records.categoryId,
      categoryName: categories.name,
      amount: sql<string>`sum(${records.amount})`,
    })
    .from(records)
    .leftJoin(categories, eq(records.categoryId, categories.id))
    .where(and(...conditions))
    .groupBy(records.categoryId, categories.name)
    .orderBy(desc(sql`sum(${records.amount})`));

  // 计算总支出
  const totalExpense = result.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  // 格式化数据并计算百分比
  const data = result.map((item) => {
    const amount = parseFloat(item.amount) || 0;
    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;

    return {
      categoryId: item.categoryId || 0,
      categoryName: item.categoryName || "未分类",
      amount,
      percentage: parseFloat(percentage.toFixed(2)),
    };
  });

  return NextResponse.json({ data });
}
