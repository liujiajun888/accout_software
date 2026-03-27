"use client";

import { useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api";
import type { Category, RecordType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, MoreVertical, Edit, Trash2, Loader2 } from "lucide-react";

const EXPENSE_ICONS = [
  "🍔", "🚗", "🏠", "🛍️", "📱", "🎮", "💊", "📚",
  "✈️", "🎁", "💄", "⚽", "🐱", "🌿", "🔧", "☕",
  "🍺", "🎬", "🎵", "👶", "🚲", "🚕", "🏥", "🏦",
];

const INCOME_ICONS = [
  "💰", "💼", "📈", "🏆", "🎁", "💵", "🏠", "💳",
  "🤑", "🧧", "💎", "🏅",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<RecordType>("expense");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch {
      toast.error("获取分类失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(
    (cat) => cat.type === activeTab
  );

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setSelectedIcon(category.icon || "");
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setSelectedIcon("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setCategoryName("");
    setSelectedIcon("");
  };

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      toast.error("请输入分类名称");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        name: categoryName.trim(),
        type: activeTab,
        icon: selectedIcon || undefined,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success("分类更新成功");
      } else {
        await createCategory(data);
        toast.success("分类创建成功");
      }

      handleCloseDialog();
      fetchCategories();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "操作失败"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`确定要删除分类"${category.name}"吗？`)) return;

    try {
      await deleteCategory(category.id);
      toast.success("删除成功");
      fetchCategories();
    } catch {
      toast.error("删除失败");
    }
  };

  const iconPool = activeTab === "income" ? INCOME_ICONS : EXPENSE_ICONS;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          分类管理
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3"
          >
            <Plus className="w-4 h-4" />
            添加分类
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "编辑分类" : "添加分类"}
              </DialogTitle>
              <DialogDescription>
                {activeTab === "expense" ? "支出" : "收入"}分类用于归类您的记账记录
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">分类名称</Label>
                <Input
                  id="name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="例如：餐饮、交通"
                />
              </div>

              <div className="space-y-2">
                <Label>选择图标</Label>
                <div className="grid grid-cols-6 gap-2">
                  {iconPool.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        selectedIcon === icon
                          ? activeTab === "income"
                            ? "bg-emerald-100 ring-2 ring-emerald-500"
                            : "bg-rose-100 ring-2 ring-rose-500"
                          : "bg-muted hover:bg-accent"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as RecordType)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger
            value="expense"
            className="text-base data-[state=active]:bg-rose-500 data-[state=active]:text-white"
          >
            支出分类
          </TabsTrigger>
          <TabsTrigger
            value="income"
            className="text-base data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
          >
            收入分类
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Categories List */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">
            {activeTab === "expense" ? "支出" : "收入"}分类列表
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-muted rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>暂无{classifyType(activeTab)}分类</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加{classifyType(activeTab)}分类
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
                      {category.icon || "💰"}
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground h-9 w-9 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleOpenDialog(category)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(category)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function classifyType(type: RecordType): string {
  return type === "expense" ? "支出" : "收入";
}
