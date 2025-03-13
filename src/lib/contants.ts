import { Bot, Brain, ChartColumnDecreasing, Logs } from "lucide-react";

export const companyInfo = {
  name: "Mental Health Tracker",
  logo: Brain,
  plan: "Daily Tracker",
};

export const navigation = [
  {
    title: "Tracker",
    url: "tracker",
    icon: Logs,
    isActive: true,
    items: [
      {
        title: "Daily Tracker",
        url: "daily-tracker",
      },
      {
        title: "History",
        url: "history",
      },
    ],
  },
  {
    title: "Statistics",
    url: "statistics",
    icon: ChartColumnDecreasing,
    items: [
      {
        title: "Global",
        url: "global",
      },
    ],
  },
  {
    title: "Recomendations",
    url: "recommendations",
    icon: Bot,
    items: [
      {
        title: "AI Recomendations",
        url: "ai-recomendations",
      },
    ],
  },
];
