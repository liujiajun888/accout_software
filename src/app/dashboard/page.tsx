"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getStatistics, getRecords, getCategories } from "@/lib/api";
import type { SummaryStatistics, CategoriesResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, Calendar, Plus } from "lucide-react";

interface RecentRecord {
  id: number;
  type: "income" | "expense";
  amount: number;
  categoryName: string;
  categoryIcon: string | null;
  note: string | null;
  userNickname: string;
  date: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// 常用支出分类（用于快捷记账）
const COMMON_EXPENSE_CATEGORIES = [
  { id: 1, name: "餐饮", icon: "🍔" },
  { id: 2, name: "交通", icon: "🚗" },
  { id: 3, name: "购物", icon: "🛍️" },
  { id: 4, name: "娱乐", icon: "🎮" },
  { id: 5, name: "居住", icon: "🏠" },
  { id: 6, name: "医疗", icon: "💊" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SummaryStatistics | null>(null);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [categories, setCategories] = useState<CategoriesResponse["data"]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsData, recordsData, categoriesData] = await Promise.all([
          getStatistics({ type: "summary", month: getCurrentMonth() }),
          getRecords({ pageSize: 5 }),
          getCategories("expense"),
        ]);
        setStats(statsData as SummaryStatistics);
        setRecentRecords(recordsData.data);
        setCategories(categoriesData.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 获取最常用的6个支出分类
  const getQuickCategories = () => {
    if (categories.length === 0) return COMMON_EXPENSE_CATEGORIES;
    return categories.slice(0, 6).map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || "💰",
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight gradient-text">
          你好，{user?.nickname || "用户"}
        </h1>
        <p className="text-slate-400 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          {formatDate(new Date())}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expense */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              本月总支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-rose-400 tabular-nums">
              {isLoading ? "-" : formatCurrency(stats?.totalExpense || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              本月总收入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-emerald-400 tabular-nums">
              {isLoading ? "-" : formatCurrency(stats?.totalIncome || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-400" />
              </div>
              本月余额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-blue-400 tabular-nums">
              {isLoading ? "-" : formatCurrency(stats?.balance || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Expense */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">今日支出</p>
              <p className="text-xl font-bold text-rose-400 tabular-nums mt-1">
                {isLoading ? "-" : formatCurrency(stats?.todayExpense || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">今日收入</p>
              <p className="text-xl font-bold text-emerald-400 tabular-nums mt-1">
                {isLoading ? "-" : formatCurrency(stats?.todayIncome || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Section */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-slate-200">快速记一笔</CardTitle>
            <Link
              href="/records/add"
              className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              更多
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {getQuickCategories().map((cat) => (
              <Link
                key={cat.id}
                href={`/records/add?category=${cat.id}&type=expense`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200 hover:border-blue-500/20"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-slate-400">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Records */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-200">最近记录</CardTitle>
            <Link
              href="/records"
              className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              查看全部 →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-white/[0.04] rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>暂无记录</p>
              <Link
                href="/records/add"
                className="text-blue-400 hover:underline mt-2 inline-block"
              >
                记一笔
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-lg">
                      {record.categoryIcon || "💰"}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{record.categoryName || "未分类"}</p>
                      <p className="text-sm text-slate-500">
                        {record.note || "无备注"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold tabular-nums ${
                        record.type === "income"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {record.type === "income" ? "+" : "-"}
                      {formatCurrency(record.amount)}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1 bg-white/[0.06] text-slate-400 border-white/[0.06]">
                      {record.userNickname}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
