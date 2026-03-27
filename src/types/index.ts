// 通用类型定义

export type RecordType = "income" | "expense";

export interface Category {
  id: number;
  name: string;
  type: RecordType;
  icon: string | null;
}

export interface RecordItem {
  id: number;
  userId: number;
  type: RecordType;
  amount: number;
  categoryId: number | null;
  category?: Category;
  note: string | null;
  date: string;
  createdAt: Date;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  createdAt: Date;
}

export interface Budget {
  id: number;
  categoryId: number | null;
  category?: Category;
  amount: number;
  month: string;
  createdAt: Date;
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 统计类型
export interface StatisticsSummary {
  totalIncome: string;
  totalExpense: string;
  balance: string;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  total: string;
  count: number;
}

export interface MonthlyStatistics {
  month: string;
  income: string;
  expense: string;
}
