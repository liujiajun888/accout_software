// ECharts 主题配置 - 极简高级风格
// 配色：中性色 + emerald + rose 为基础，辅助色用柔和莫兰迪色系

export const morandiColors = [
  '#E07A5F', // 暖橙
  '#81B29A', // 薄荷绿
  '#F2CC8F', // 暖黄
  '#A8DADC', // 浅蓝
  '#D4A5A5', // 玫瑰粉
  '#9B8AA6', // 淡紫
  '#B8C5D6', // 灰蓝
  '#C9ADA7', // 暖灰
  '#84A98C', // 草绿
  '#F4A261', // 橙黄
  '#2A9D8F', // 青绿
  '#E9C46A', // 金黄
  '#264653', // 深青
  '#E76F51', // 珊瑚
  '#9CAF88', // 橄榄绿
];

export const echartsTheme = {
  // 主色板
  color: morandiColors,

  // 背景色
  backgroundColor: 'transparent',

  // 文本样式
  textStyle: {
    fontFamily: 'var(--font-sans), system-ui, -apple-system, sans-serif',
    color: '#1a1a1a',
  },

  // 标题
  title: {
    textStyle: {
      color: '#1a1a1a',
      fontWeight: 500,
      fontSize: 16,
    },
    subtextStyle: {
      color: '#737373',
      fontSize: 13,
    },
  },

  // 图例
  legend: {
    textStyle: {
      color: '#1a1a1a',
      fontSize: 13,
    },
    pageTextStyle: {
      color: '#737373',
    },
  },

  // 提示框
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    textStyle: {
      color: '#1a1a1a',
      fontSize: 13,
    },
    extraCssText: 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border-radius: 12px; padding: 12px 16px;',
    padding: 12,
  },

  // 坐标轴
  categoryAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#737373',
      fontSize: 12,
    },
    splitLine: {
      show: false,
    },
  },

  valueAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#737373',
      fontSize: 12,
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#f0f0f0',
        type: 'dashed',
      },
    },
  },

  // 饼图
  pie: {
    itemStyle: {
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    label: {
      color: '#1a1a1a',
      fontSize: 13,
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // 折线图
  line: {
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      width: 3,
    },
    emphasis: {
      scale: 1.5,
    },
  },

  // 柱状图
  bar: {
    itemStyle: {
      borderRadius: [4, 4, 0, 0],
    },
  },

  // 雷达图
  radar: {
    axisLine: {
      lineStyle: {
        color: '#e5e5e5',
      },
    },
    splitLine: {
      lineStyle: {
        color: '#e5e5e5',
      },
    },
    splitArea: {
      areaStyle: {
        color: ['transparent'],
      },
    },
    axisName: {
      color: '#737373',
    },
  },
};

// 收入/支出专用颜色
export const incomeColor = '#10b981'; // emerald-500
export const expenseColor = '#f43f5e'; // rose-500
export const incomeColorLight = 'rgba(16, 185, 129, 0.15)';
export const expenseColorLight = 'rgba(244, 63, 94, 0.15)';

// 金额格式化
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// 简化金额显示（用于图表）
export function formatCompactCurrency(value: number): string {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(1)}万`;
  }
  return `¥${value.toFixed(0)}`;
}
