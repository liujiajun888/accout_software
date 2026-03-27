// API 调用封装
import type { Category, RecordItem, User, RecordType } from "@/types";

const API_BASE = "/api";

// 通用请求函数
async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }

  return data;
}

// ==================== 认证 ====================

export interface LoginData {
  username: string;
  password: string;
}

export async function login(
  username: string,
  password: string
): Promise<{ user: User }> {
  return request(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function getCurrentUser(): Promise<{ user: User } | null> {
  try {
    return await request(`${API_BASE}/auth/me`);
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

// ==================== 记录 ====================

export interface RecordQueryParams {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  userId?: number;
  page?: number;
  pageSize?: number;
}

export interface RecordsResponse {
  data: Array<{
    id: number;
    userId: number;
    type: RecordType;
    amount: number;
    categoryId: number | null;
    note: string | null;
    date: string;
    createdAt: string;
    userNickname: string;
    categoryName: string;
    categoryIcon: string | null;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function getRecords(
  params: RecordQueryParams = {}
): Promise<RecordsResponse> {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.categoryId) searchParams.set("categoryId", params.categoryId.toString());
  if (params.userId) searchParams.set("userId", params.userId.toString());
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());

  const queryString = searchParams.toString();
  return request(`${API_BASE}/records${queryString ? `?${queryString}` : ""}`);
}

export interface CreateRecordData {
  type: RecordType;
  amount: number;
  categoryId?: number;
  note?: string;
  date: string;
}

export interface UpdateRecordData {
  type: RecordType;
  amount: number;
  categoryId?: number;
  note?: string;
  date: string;
}

export async function createRecord(
  data: CreateRecordData
): Promise<{ data: RecordItem }> {
  return request(`${API_BASE}/records`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRecord(
  id: number,
  data: UpdateRecordData
): Promise<{ data: RecordItem }> {
  return request(`${API_BASE}/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRecord(id: number): Promise<{ message: string }> {
  return request(`${API_BASE}/records/${id}`, {
    method: "DELETE",
  });
}

export async function getRecordById(id: number): Promise<{ data: RecordItem }> {
  return request(`${API_BASE}/records/${id}`);
}

// ==================== 分类 ====================

export interface CategoriesResponse {
  data: Category[];
}

export async function getCategories(
  type?: "income" | "expense"
): Promise<CategoriesResponse> {
  const searchParams = new URLSearchParams();
  if (type) searchParams.set("type", type);

  const queryString = searchParams.toString();
  return request(
    `${API_BASE}/categories${queryString ? `?${queryString}` : ""}`
  );
}

export interface CreateCategoryData {
  name: string;
  type: RecordType;
  icon?: string;
}

export interface UpdateCategoryData {
  name: string;
  type: RecordType;
  icon?: string;
}

export async function createCategory(
  data: CreateCategoryData
): Promise<{ data: Category }> {
  return request(`${API_BASE}/categories`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: number,
  data: UpdateCategoryData
): Promise<{ data: Category }> {
  return request(`${API_BASE}/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: number): Promise<{ message: string }> {
  return request(`${API_BASE}/categories/${id}`, {
    method: "DELETE",
  });
}

// ==================== 统计 ====================

export interface StatisticsParams {
  type?: "summary" | "trend" | "category";
  month?: string; // 格式: 2026-03
  year?: string; // 格式: 2026
  userId?: number;
}

export interface SummaryStatistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  todayExpense: number;
  todayIncome: number;
}

export interface TrendData {
  date: string;
  income: number;
  expense: number;
}

export interface CategoryStatisticsData {
  categoryId: number;
  categoryName: string;
  amount: number;
  percentage: number;
}

export async function getStatistics(
  params: StatisticsParams
): Promise<SummaryStatistics | { data: TrendData[] } | { data: CategoryStatisticsData[] }> {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set("type", params.type);
  if (params.month) searchParams.set("month", params.month);
  if (params.year) searchParams.set("year", params.year);
  if (params.userId) searchParams.set("userId", params.userId.toString());

  const queryString = searchParams.toString();
  return request(`${API_BASE}/statistics?${queryString}`);
}

// ==================== 预算 ====================

export interface Budget {
  id: number;
  categoryId: number | null;
  category?: Category;
  amount: string;
  month: string;
  createdAt: string;
}

export interface BudgetsResponse {
  data: Budget[];
}

export async function getBudgets(month: string): Promise<BudgetsResponse> {
  return request(`${API_BASE}/budgets?month=${month}`);
}

export interface SaveBudgetData {
  categoryId?: number;
  amount: number;
  month: string;
}

export async function saveBudget(
  data: SaveBudgetData
): Promise<{ data: Budget }> {
  return request(`${API_BASE}/budgets`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
