"use client";

import { useState, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  morandiColors,
  incomeColor,
  expenseColor,
  incomeColorLight,
  expenseColorLight,
  formatCurrency,
  formatCompactCurrency,
} from "@/lib/echarts-theme";
import { TrendingUp, TrendingDown, Wallet, Users } from "lucide-react";

// 用户类型
interface User {
  id: number;
  username: string;
  nickname: string;
}

// 统计数据类型
interface StatisticsSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  todayIncome?: number;
  todayExpense?: number;
}

interface TrendData {
  date: string;
  income: number;
  expense: number;
}

interface CategoryData {
  categoryId: number;
  categoryName: string;
  amount: number;
  percentage: number;
}

export default function StatisticsPage() {
  // 状态管理
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [chartType, setChartType] = useState<"expense" | "income">("expense");
  const [, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取月份选项（最近12个月）
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      options.push({ value, label });
    }
    return options;
  }, []);

  // 获取用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          // 这里简化处理，实际应该有一个获取所有用户的接口
          // 暂时使用硬编码
          setUsers([
            { id: 1, username: "xiaoming", nickname: "小明" },
            { id: 2, username: "xiaohong", nickname: "小红" },
          ]);
        }
      } catch (error) {
        console.error("获取用户列表失败:", error);
      }
    };
    fetchUsers();
  }, []);

  // 获取统计数据
  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const userParam = selectedUser !== "all" ? `&userId=${selectedUser}` : "";

        // 并行获取三种统计数据
        const [summaryRes, trendRes, categoryRes] = await Promise.all([
          fetch(`/api/statistics?type=summary&month=${selectedMonth}${userParam}`),
          fetch(`/api/statistics?type=trend&month=${selectedMonth}${userParam}`),
          fetch(`/api/statistics?type=category&month=${selectedMonth}${userParam}`),
        ]);

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData);
        }

        if (trendRes.ok) {
          const trendResult = await trendRes.json();
          setTrendData(trendResult.data || []);
        }

        if (categoryRes.ok) {
          const categoryResult = await categoryRes.json();
          setCategoryData(categoryResult.data || []);
        }
      } catch (error) {
        console.error("获取统计数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [selectedMonth, selectedUser]);

  // 饼图配置
  const pieChartOption = useMemo(() => {
    const data = categoryData.map((item) => ({
      name: item.categoryName,
      value: item.amount,
    }));

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params: { name: string; value: number; percent: number }) => {
          return `${params.name}<br/>${formatCurrency(params.value)} (${params.percent}%)`;
        },
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "transparent",
        borderWidth: 0,
        textStyle: { color: "#e2e8f0", fontSize: 13 },
        extraCssText:
          "box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 12px 16px; backdrop-filter: blur(10px);",
      },
      legend: {
        orient: "vertical",
        right: "5%",
        top: "center",
        itemGap: 12,
        textStyle: { color: "#94a3b8", fontSize: 12 },
        formatter: (name: string) => {
          const item = categoryData.find((d) => d.categoryName === name);
          return item ? `${name}  ${item.percentage}%` : name;
        },
      },
      series: [
        {
          name: "分类占比",
          type: "pie",
          radius: ["45%", "70%"],
          center: ["35%", "50%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: "rgba(15, 23, 42, 0.8)",
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 500,
              formatter: "{b}\n{d}%",
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.1)",
            },
          },
          labelLine: {
            show: false,
          },
          data,
          color: morandiColors,
        },
      ],
      graphic: [
        {
          type: "text",
          left: "26%",
          top: "45%",
          style: {
            text: chartType === "expense" ? "总支出" : "总收入",
            textAlign: "center",
            fill: "#94a3b8",
            fontSize: 13,
          },
        },
        {
          type: "text",
          left: "23%",
          top: "52%",
          style: {
            text: formatCompactCurrency(total),
            textAlign: "center",
            fill: "#e2e8f0",
            fontSize: 18,
            fontWeight: 600,
          },
        },
      ],
    };
  }, [categoryData, chartType]);

  // 趋势图配置
  const trendChartOption = useMemo(() => {
    const dates = trendData.map((item) => {
      const day = item.date.split("-")[2];
      return `${parseInt(day)}日`;
    });
    const incomes = trendData.map((item) => item.income);
    const expenses = trendData.map((item) => item.expense);

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "line",
          lineStyle: { color: "rgba(255, 255, 255, 0.1)", type: "dashed" },
        },
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "transparent",
        borderWidth: 0,
        textStyle: { color: "#e2e8f0", fontSize: 13 },
        extraCssText:
          "box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 12px 16px; backdrop-filter: blur(10px);",
        formatter: (params: { name: string; value: number; seriesName: string; marker?: string }[]) => {
          let result = params[0].name + "<br/>";
          params.forEach((param) => {
            result += `${param.marker || "●"} ${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ["收入", "支出"],
        right: 0,
        top: 0,
        itemGap: 20,
        textStyle: { color: "#94a3b8", fontSize: 13 },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: dates,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748b", fontSize: 12 },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#64748b",
          fontSize: 12,
          formatter: (value: number) => formatCompactCurrency(value),
        },
        splitLine: {
          lineStyle: { color: "rgba(255, 255, 255, 0.06)", type: "dashed" },
        },
      },
      series: [
        {
          name: "收入",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { width: 3, color: incomeColor },
          itemStyle: { color: incomeColor },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: incomeColorLight },
                { offset: 1, color: "rgba(16, 185, 129, 0)" },
              ],
            },
          },
          data: incomes,
        },
        {
          name: "支出",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { width: 3, color: expenseColor },
          itemStyle: { color: expenseColor },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: expenseColorLight },
                { offset: 1, color: "rgba(244, 63, 94, 0)" },
              ],
            },
          },
          data: expenses,
        },
      ],
    };
  }, [trendData]);

  // 分类排行柱状图配置
  const rankChartOption = useMemo(() => {
    const sortedData = [...categoryData]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "transparent",
        borderWidth: 0,
        textStyle: { color: "#e2e8f0", fontSize: 13 },
        extraCssText:
          "box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 12px 16px; backdrop-filter: blur(10px);",
        formatter: (params: { name: string; value: number }[]) => {
          return `${params[0].name}<br/>${formatCurrency(params[0].value)}`;
        },
      },
      grid: {
        left: "3%",
        right: "8%",
        bottom: "3%",
        top: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category",
        data: sortedData.map((item) => item.categoryName).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#e2e8f0", fontSize: 12 },
      },
      series: [
        {
          type: "bar",
          data: sortedData.map((item) => item.amount).reverse(),
          barWidth: 16,
          itemStyle: {
            borderRadius: [0, 8, 8, 0],
            color: (params: { dataIndex: number }) => {
              return morandiColors[params.dataIndex % morandiColors.length];
            },
          },
          label: {
            show: true,
            position: "right",
            formatter: (params: { value: number }) => formatCompactCurrency(params.value),
            color: "#94a3b8",
            fontSize: 11,
          },
        },
      ],
    };
  }, [categoryData]);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 页面标题和筛选器 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold gradient-text">统计分析</h1>
            <p className="mt-1 text-sm text-slate-400">
              查看收支趋势与分类占比
            </p>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {/* 月份选择器 */}
            <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(value || "")}>
              <SelectTrigger className="w-[140px] flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 用户筛选 */}
            <Tabs value={selectedUser} onValueChange={setSelectedUser}>
              <TabsList className="bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
                <TabsTrigger value="all" className="gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  全部
                </TabsTrigger>
                <TabsTrigger value="1">小明</TabsTrigger>
                <TabsTrigger value="2">小红</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* 汇总卡片 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 总收入 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                本月总收入
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-32" />
              ) : (
                <div className="text-3xl font-semibold tabular-nums text-emerald-400">
                  {formatCurrency(summary?.totalIncome || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 总支出 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                </div>
                本月总支出
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-32" />
              ) : (
                <div className="text-3xl font-semibold tabular-nums text-rose-400">
                  {formatCurrency(summary?.totalExpense || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 结余 */}
          <Card className="rounded-xl shadow-sm sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Wallet className="h-4 w-4 text-blue-400" />
                </div>
                本月结余
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-32" />
              ) : (
                <div
                  className={`text-3xl font-semibold tabular-nums ${
                    (summary?.balance || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatCurrency(summary?.balance || 0)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 分类占比饼图 */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">分类占比</CardTitle>
              <Tabs
                value={chartType}
                onValueChange={(v) => setChartType(v as "expense" | "income")}
              >
                <TabsList className="h-7 bg-white/[0.04]">
                  <TabsTrigger value="expense" className="text-xs">
                    支出
                  </TabsTrigger>
                  <TabsTrigger value="income" className="text-xs">
                    收入
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : categoryData.length > 0 ? (
                <ReactECharts
                  option={pieChartOption}
                  style={{ height: "300px" }}
                  opts={{ renderer: "svg" }}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center text-slate-500">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* 分类排行 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">分类排行</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : categoryData.length > 0 ? (
                <ReactECharts
                  option={rankChartOption}
                  style={{ height: "300px" }}
                  opts={{ renderer: "svg" }}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center text-slate-500">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 收支趋势 */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">收支趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : trendData.length > 0 ? (
              <ReactECharts
                option={trendChartOption}
                style={{ height: "320px" }}
                opts={{ renderer: "svg" }}
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
