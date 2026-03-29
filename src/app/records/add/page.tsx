
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

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function AddRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get("id");
  const urlCategoryId = searchParams.get("category");
  const urlType = searchParams.get("type") as RecordType | null;
  const isEditing = !!recordId;

  const [type, setType] = useState<RecordType>(
    urlType === "income" ? "income" : "expense"
  );
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(
    urlCategoryId ? parseInt(urlCategoryId) : null
  );
  const [note, setNote] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories(type);
        setCategories(res.data);
        if (!categoryId && res.data.length > 0) {
          setCategoryId(res.data[0].id);
        }
      } catch {
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

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
        toast.error("Failed to load record");
        router.push("/records");
      } finally {
        setIsFetching(false);
      }
    };
    fetchRecord();
  }, [recordId, router]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setAmount(val);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter amount");
      return;
    }
    if (!categoryId) {
      toast.error("Please select category");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        categoryId,
        note: note || undefined,
        date,
      };
      if (isEditing && recordId) {
        await updateRecord(parseInt(recordId), payload);
        toast.success("Updated");
      } else {
        await createRecord(payload);
        toast.success("Created");
      }
      router.push("/records");
    } catch {
      toast.error(isEditing ? "Update failed" : "Create failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold gradient-text">
          {isEditing ? "Edit Record" : "New Record"}
        </h1>
      </div>

      <Card className="glass-card">
        <CardContent className="p-6 space-y-8">
          <Tabs
            value={type}
            onValueChange={(v) => setType(v as RecordType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-12 bg-white/[0.04] border border-white/[0.06]">
              <TabsTrigger
                value="expense"
                className="text-base text-slate-400 data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400 data-[state=active]:border data-[state=active]:border-rose-500/30"
              >
                Expense
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="text-base text-slate-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/30"
              >
                Income
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="text-center space-y-2">
            <Label className="text-slate-400">Amount</Label>
            <div className="relative">
              <span className="absolute left-1/2 -translate-x-[4rem] top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-500">
                $
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

          <div className="space-y-3">
            <Label className="text-slate-400">Category</Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                const icon = cat.icon || "*";
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={[
                      "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 relative",
                      isSelected
                        ? type === "income"
                          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"
                          : "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/40"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 border border-white/[0.06]",
                    ].join(" ")}
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

          <div className="space-y-3">
            <Label htmlFor="note" className="text-slate-400">
              Note
            </Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="h-12"
            />
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="date"
              className="text-slate-400 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className={[
              "w-full h-12 text-base font-medium text-white border-0",
              type === "income"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20"
                : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/20",
            ].join(" ")}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save"
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
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
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
