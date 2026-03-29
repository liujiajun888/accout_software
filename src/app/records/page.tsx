"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getRecords, deleteRecord, getCategories } from "@/lib/api";
import { getMonthRange } from "@/lib/utils";
import type { RecordsResponse, CategoriesResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Filter,
  Loader2,
} from "lucide-react";

interface GroupedRecords {
  [date: string]: RecordsResponse["data"];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
}

function getMonthOptions(): { value: string; label: string }[] {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = i === 0 ? "本月" : `${d.getFullYear()}年${d.getMonth() + 1}月`;
    options.push({ value, label });
  }
  return options;
}

function RecordsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<RecordsResponse["data"]>([]);
  const [pagination, setPagination] = useState<RecordsResponse["pagination"] | null>(null);
  const [categories, setCategories] = useState<CategoriesResponse["data"]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(
    searchParams.get("month") || getMonthOptions()[0].value
  );
  const [selectedUser, setSelectedUser] = useState(
    searchParams.get("user") || "all"
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getMonthRange(selectedMonth);

      const [recordsRes, categoriesRes] = await Promise.all([
        getRecords({
          startDate,
          endDate,
          userId: selectedUser !== "all" ? parseInt(selectedUser) : undefined,
          categoryId: selectedCategory !== "all" ? parseInt(selectedCategory) : undefined,
          page: currentPage,
          pageSize: 20,
        }),
        getCategories(),
      ]);

      setRecords(recordsRes.data);
      setPagination(recordsRes.pagination);
      setCategories(categoriesRes.data);
    } catch {
      toast.error("获取记录失败");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedUser, selectedCategory, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这条记录吗？")) return;

    try {
      await deleteRecord(id);
      toast.success("删除成功");
      fetchData();
    } catch {
      toast.error("删除失败");
    }
  };

  // Group records by date
  const groupedRecords: GroupedRecords = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as GroupedRecords);

  // Calculate daily total
  const getDailyTotal = (dateRecords: RecordsResponse["data"]): number => {
    return dateRecords.reduce((sum, r) => {
      return r.type === "expense" ? sum - r.amount : sum + r.amount;
    }, 0);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight gradient-text">账单</h1>
        <Link href="/records/add">
          <Button className="hidden md:flex bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-2" />
            记一笔
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex items-center gap-2 text-slate-400 flex-shrink-0">
              <Filter className="w-4 h-4 text-blue-400" />
              <span className="text-sm">筛选</span>
            </div>

            <Select value={selectedMonth} onValueChange={(value) => value && setSelectedMonth(value)}>
              <SelectTrigger className="w-32 flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUser} onValueChange={(value) => value && setSelectedUser(value)}>
              <SelectTrigger className="w-28 flex-shrink-0">
                <SelectValue placeholder="记录人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="1">小明</SelectItem>
                <SelectItem value="2">小红</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={(value) => value && setSelectedCategory(value)}>
              <SelectTrigger className="w-32 flex-shrink-0">
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-4">
                  <div className="h-8 bg-white/[0.04] rounded animate-pulse mb-4" />
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-14 bg-white/[0.04] rounded animate-pulse" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : Object.keys(groupedRecords).length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <p className="text-slate-500">暂无记录</p>
              <Link href="/records/add">
                <Button variant="outline" className="mt-4 border-white/[0.1] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]">
                  <Plus className="w-4 h-4 mr-2" />
                  记一笔
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedRecords).map(([date, dateRecords]) => (
            <Card key={date} className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-slate-200">
                    {formatDate(date)}
                  </CardTitle>
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      getDailyTotal(dateRecords) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {getDailyTotal(dateRecords) >= 0 ? "+" : ""}
                    {formatCurrency(getDailyTotal(dateRecords))}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {dateRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-lg">
                          {record.categoryIcon || "💰"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">
                            {record.categoryName || "未分类"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {record.note || "无备注"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
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
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground h-9 w-9 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/records/add?id=${record.id}`)
                              }
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(record.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-400">
            {currentPage} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={currentPage === pagination.totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function RecordsLoading() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight gradient-text">账单</h1>
      </div>
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<RecordsLoading />}>
      <RecordsContent />
    </Suspense>
  );
}
