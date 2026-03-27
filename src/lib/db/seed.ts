import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import { users, categories } from "./schema";

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("POSTGRES_URL or DATABASE_URL environment variable is not set");
}
const sql = neon(databaseUrl);
const db = drizzle(sql);

// 预设支出分类
const expenseCategories = [
  { name: "餐饮", type: "expense" as const, icon: "🍜" },
  { name: "交通", type: "expense" as const, icon: "🚗" },
  { name: "购物", type: "expense" as const, icon: "🛒" },
  { name: "住房", type: "expense" as const, icon: "🏠" },
  { name: "娱乐", type: "expense" as const, icon: "🎮" },
  { name: "医疗", type: "expense" as const, icon: "💊" },
  { name: "教育", type: "expense" as const, icon: "📚" },
  { name: "其他", type: "expense" as const, icon: "📦" },
];

// 预设收入分类
const incomeCategories = [
  { name: "工资", type: "income" as const, icon: "💰" },
  { name: "奖金", type: "income" as const, icon: "🎁" },
  { name: "投资", type: "income" as const, icon: "📈" },
  { name: "兼职", type: "income" as const, icon: "💼" },
  { name: "其他", type: "income" as const, icon: "📦" },
];

async function seed() {
  console.log("🌱 开始初始化数据...");

  try {
    // 创建用户
    const passwordHash = await bcrypt.hash("123456", 10);

    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log("👤 创建用户...");
      await db.insert(users).values([
        {
          username: "user1",
          passwordHash,
          nickname: "小明",
        },
        {
          username: "user2",
          passwordHash,
          nickname: "小红",
        },
      ]);
      console.log("✅ 用户创建成功");
    } else {
      console.log("⚠️ 用户已存在，跳过创建");
    }

    // 创建分类
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      console.log("📂 创建分类...");
      await db
        .insert(categories)
        .values([...expenseCategories, ...incomeCategories]);
      console.log("✅ 分类创建成功");
    } else {
      console.log("⚠️ 分类已存在，跳过创建");
    }

    console.log("🎉 数据初始化完成！");
    console.log("");
    console.log("登录信息：");
    console.log("  用户名: user1, 密码: 123456, 昵称: 小明");
    console.log("  用户名: user2, 密码: 123456, 昵称: 小红");
  } catch (error) {
    console.error("❌ 初始化失败:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
