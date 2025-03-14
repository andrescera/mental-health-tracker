import { Bot, Brain, ChartColumnDecreasing, Logs } from "lucide-react";

export const getMoodEmoji = (rating: number) => {
  if (rating >= 8) {
    return "😄";
  }
  if (rating >= 6) {
    return "🙂";
  }
  if (rating >= 4) {
    return "😐";
  }
  if (rating >= 2) {
    return "😔";
  }

  return "😢";
};
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
        title: "Overview",
        url: "overview",
      },
    ],
  },
  {
    title: "Recommendations",
    url: "recommendations",
    icon: Bot,
    items: [
      {
        title: "AI Recommendations",
        url: "ai-recommendations",
      },
    ],
  },
];
