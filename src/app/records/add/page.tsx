"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createRecord,
  updateRecord,
  getCategories,
  getRecordById,
} from "@/lib/api";
import type { Category, RecordType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Loader2, Check } from "lucide-react";

const EXPENSE_ICONS = [
  "🍔", "🚗", "🏠", "🛍️", "📱", "🎮", "💊", "📚",
  "✈️", "🎁", "💄", "⚽", "🐱", "🌿", "🔧", "☕",
];

const INCOME_ICONS = [
  "💰", "💼", "📈", "🏆", "🎁", "💵", "🏠", "💳",
];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getIconFromPool(name: string, type: RecordType): string {
  const pool = type === "income" ? INCOME_ICONS : EXPENSE_ICONS;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return pool[Math.abs(hash) % pool.length];
}

function AddRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get("id");
  const urlCategoryId = searchParams.get("category");
  const urlType = searchParams.get("type") as RecordType | null;
  const isEditing = !!recordId;

  const [type, setType] = useState<RecordType>(urlType === "income" ? "income" : "expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(urlCategoryId ? parseInt(urlCategoryId) : null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories(type);
        setCategories(res.data);
        // Auto select first category if none selected and no URL param
        if (!categoryId && res.data.length > 0) {
          setCategoryId(res.data[0].id);
        }
      } catch {
        toast.error("获取分类失败");
      }
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Fetch record data if editing
  useEffect(() => {
    if (!recordId) return;

    const fetchRecord = async () => {
      setIsFetching(true);
      try {
        const res = await getRecordById(parseInt(recordId));
        const record = res.data;
        setType(record.type);
        setAmount(record.amount.toString());
        setCategoryId(record.categoryId);
        setNote(record.note || "");
        setDate(record.date);
      } catch {
        toast.error("获取记录失败");
        router.push("/records");
      } finally {
        setIsFetching(false);
      }
    };
    fetchRecord();
  }, [recordId, router]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("请输入金额");
      return;
    }
    if (!categoryId) {
      toast.error("请选择分类");
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        type,
        amount: parseFloat(amount),
        categoryId,
        note: note || undefined,
        date,
      };

      if (isEditing && recordId) {
        await updateRecord(parseInt(recordId), data);
        toast.success("更新成功");
      } else {
        await createRecord(data);
        toast.success("添加成功");
      }

      router.push("/records");
    } catch {
      toast.error(isEditing ? "更新失败" : "添加失败");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">
          {isEditing ? "编辑记录" : "记一笔"}
        </h1>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6 space-y-8">
          {/* Type Tabs */}
          <Tabs
            value={type}
            onValueChange={(v) => setType(v as RecordType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger
                value="expense"
                className="text-base data-[state=active]:bg-rose-500 data-[state=active]:text-white"
              >
                支出
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="text-base data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                收入
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Amount Input */}
          <div className="text-center space-y-2">
            <Label className="text-muted-foreground">金额</Label>
            <div className="relative">
              <span className="absolute left-1/2 -translate-x-[4rem] top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground">
                ¥
              </span>
              <Input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="text-center text-4xl md:text-5xl font-bold h-20 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 tabular-nums"
              />
            </div>
          </div>

          {/* Category Grid */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">分类</Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                const icon = cat.icon || getIconFromPool(cat.name, type);

                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? type === "income"
                          ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500"
                          : "bg-rose-100 text-rose-700 ring-2 ring-rose-500"
                        : "bg-muted hover:bg-accent"
                    }`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-medium truncate w-full text-center">
                      {cat.name}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-3">
            <Label htmlFor="note" className="text-muted-foreground">
              备注
            </Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注（选填）"
              className="h-12"
            />
          </div>

          {/* Date Input */}
          <div className="space-y-3">
            <Label htmlFor="date" className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              日期
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full h-12 text-base font-medium ${
              type === "income"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AddRecordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function AddRecordPage() {
  return (
    <Suspense fallback={<AddRecordLoading />}>
      <AddRecordContent />
    </Suspense>
  );
}
