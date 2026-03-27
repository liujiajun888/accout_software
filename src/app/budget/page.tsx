"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
} from "@/lib/echarts-theme";
import {
  Plus,
  Calendar,
  Wallet,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  PiggyBank,
} from "lucide-react";
import { Category } from "@/types";
import { toast } from "sonner";

// 预算数据类型
interface BudgetItem {
  id: number;
  categoryId: number | null;
  categoryName: string;
  categoryIcon: string | null;
  amount: number;
  month: string;
  actualExpense: number;
  remaining: number;
  percentage: number;
}

export default function BudgetPage() {
  // 状态管理
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // 表单状态
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [budgetAmount, setBudgetAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  
  // 编辑状态
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

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

  // 获取预算列表
  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${selectedMonth}`);
      if (res.ok) {
        const result = await res.json();
        setBudgets(result.data || []);
      }
    } catch (error) {
      console.error("获取预算失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 获取支出分类列表
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?type=expense");
      if (res.ok) {
        const result = await res.json();
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error("获取分类失败:", error);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // 计算总预算和总支出
  const totals = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalExpense = budgets.reduce((sum, b) => sum + b.actualExpense, 0);
    const totalRemaining = totalBudget - totalExpense;
    const overallPercentage = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;
    return { totalBudget, totalExpense, totalRemaining, overallPercentage };
  }, [budgets]);

  // 添加预算
  const handleAddBudget = async () => {
    if (!selectedCategory || !budgetAmount) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: parseInt(selectedCategory),
          amount: parseFloat(budgetAmount),
          month: selectedMonth,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        setSelectedCategory("");
        setBudgetAmount("");
        fetchBudgets();
        toast.success("预算添加成功");
      } else {
        const error = await res.json();
        toast.error(error.error || "添加预算失败");
      }
    } catch (error) {
      console.error("添加预算失败:", error);
      toast.error("添加预算失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 更新预算
  const handleUpdateBudget = async () => {
    if (!editingBudget || !editAmount) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editingBudget.categoryId,
          amount: parseFloat(editAmount),
          month: selectedMonth,
        }),
      });

      if (res.ok) {
        setEditingBudget(null);
        setEditAmount("");
        fetchBudgets();
        toast.success("预算更新成功");
      } else {
        const error = await res.json();
        toast.error(error.error || "更新预算失败");
      }
    } catch (error) {
      console.error("更新预算失败:", error);
      toast.error("更新预算失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 获取进度条颜色
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-rose-500";
    if (percentage >= 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // 获取状态图标和文字
  const getStatusInfo = (percentage: number) => {
    if (percentage >= 100) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-rose-500" />,
        text: "已超支",
        className: "text-rose-600",
      };
    }
    if (percentage >= 80) {
      return {
        icon: <TrendingDown className="h-4 w-4 text-amber-500" />,
        text: "即将超支",
        className: "text-amber-600",
      };
    }
    return {
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      text: "正常",
      className: "text-emerald-600",
    };
  };

  // 获取可用分类（排除已有预算的分类）
  const availableCategories = useMemo(() => {
    const usedCategoryIds = budgets.map((b) => b.categoryId);
    return categories.filter((c) => !usedCategoryIds.includes(c.id));
  }, [categories, budgets]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* 页面标题和月份选择 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1a1a1a]">预算管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              设置月度预算，掌控支出
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(value || "")}>
              <SelectTrigger className="w-[160px] bg-white">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
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
          </div>
        </div>

        {/* 总预算概览卡片 */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-3">
              {/* 预算总额 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PiggyBank className="h-4 w-4" />
                  本月预算总额
                </div>
                {loading ? (
                  <div className="h-9 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="text-3xl font-semibold tabular-nums text-[#1a1a1a]">
                    {formatCurrency(totals.totalBudget)}
                  </div>
                )}
              </div>

              {/* 实际支出 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingDown className="h-4 w-4" />
                  实际支出
                </div>
                {loading ? (
                  <div className="h-9 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="text-3xl font-semibold tabular-nums text-rose-600">
                    {formatCurrency(totals.totalExpense)}
                  </div>
                )}
              </div>

              {/* 剩余可用 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  剩余可用
                </div>
                {loading ? (
                  <div className="h-9 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <div
                    className={`text-3xl font-semibold tabular-nums ${
                      totals.totalRemaining >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatCurrency(totals.totalRemaining)}
                  </div>
                )}
              </div>
            </div>

            {/* 总体进度条 */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">总体预算使用进度</span>
                <span
                  className={`font-medium ${
                    totals.overallPercentage >= 100
                      ? "text-rose-600"
                      : totals.overallPercentage >= 80
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {totals.overallPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-500 ${getProgressColor(
                    totals.overallPercentage
                  )}`}
                  style={{
                    width: `${Math.min(totals.overallPercentage, 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 分类预算列表 */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-medium">分类预算</CardTitle>
              <CardDescription>点击预算金额可快速编辑</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={availableCategories.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  添加预算
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>添加预算</DialogTitle>
                  <DialogDescription>
                    为支出分类设置月度预算金额
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">选择分类</label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => setSelectedCategory(value || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            <span className="flex items-center gap-2">
                              {category.icon && (
                                <span>{category.icon}</span>
                              )}
                              {category.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">预算金额</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ¥
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={budgetAmount}
                        onChange={(e) => setBudgetAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddBudget();
                        }}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleAddBudget}
                    disabled={!selectedCategory || !budgetAmount || submitting}
                  >
                    {submitting ? "保存中..." : "保存"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-2 w-full animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : budgets.length > 0 ? (
              <div className="space-y-5">
                {budgets.map((budget) => {
                  const status = getStatusInfo(budget.percentage);
                  const isEditing = editingBudget?.id === budget.id;

                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{budget.categoryIcon || "📁"}</span>
                          <span className="font-medium">{budget.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  ¥
                                </span>
                                <Input
                                  type="number"
                                  className="h-8 w-28 pl-5 text-right"
                                  value={editAmount}
                                  autoFocus
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdateBudget();
                                    if (e.key === "Escape") {
                                      setEditingBudget(null);
                                      setEditAmount("");
                                    }
                                  }}
                                  onBlur={() => {
                                    // 延迟关闭，让点击事件先触发
                                    setTimeout(() => {
                                      if (editingBudget?.id === budget.id) {
                                        setEditingBudget(null);
                                        setEditAmount("");
                                      }
                                    }, 200);
                                  }}
                                />
                              </div>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                onClick={handleUpdateBudget}
                                disabled={submitting}
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingBudget(budget);
                                setEditAmount(budget.amount.toString());
                              }}
                              className="text-sm tabular-nums text-muted-foreground hover:text-foreground"
                            >
                              {formatCurrency(budget.actualExpense)} /{" "}
                              <span className="font-medium text-foreground">
                                {formatCurrency(budget.amount)}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full transition-all duration-500 ${getProgressColor(
                              budget.percentage
                            )}`}
                            style={{
                              width: `${Math.min(budget.percentage, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-xs">
                          <span className={status.className}>
                            <span className="flex items-center gap-1">
                              {status.icon}
                              {status.text}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            剩余 {formatCurrency(budget.remaining)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <PiggyBank className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium">暂无预算设置</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  点击右上角按钮添加分类预算
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
