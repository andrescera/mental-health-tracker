"use client";

import { useState } from "react";

import { format } from "date-fns";
import { CalendarDays, Lightbulb } from "lucide-react";

import { AIRecommendationFormatter } from "~/components/ai-recommendation-formatter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { getMoodEmoji } from "~/lib/contants";

import { api } from "~/trpc/react";

export default function AIRecommendationsPage() {
  const [timeFilter, setTimeFilter] = useState<"all" | "recent">("all");

  const { data: logs, isLoading } = api.log.getAll.useQuery();

  // Filter logs with AI recommendations
  const filteredLogs = logs?.filter(
    (log) => log.artificialIntelligenceTip && log.artificialIntelligenceTip.trim() !== ""
  );

  // Sort logs by date (newest first)
  const sortedLogs = filteredLogs?.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Apply time filter
  const displayedLogs = timeFilter === "recent" ? sortedLogs?.slice(0, 10) : sortedLogs;

  // Format date
  const formatDate = (date: Date | string) => format(new Date(date), "MMMM d, yyyy");

  return (
    <div className="container mx-auto space-y-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="text-2xl">AI Recommendations</CardTitle>
              <CardDescription>
                Personalized recommendations based on your mood and mental health data
              </CardDescription>
            </div>
            <Tabs
              defaultValue="all"
              onValueChange={(v) => setTimeFilter(v as "all" | "recent")}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
                <TabsTrigger value="all">All Recommendations</TabsTrigger>
                <TabsTrigger value="recent">Recent (10)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
            </div>
          ) : !displayedLogs?.length ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold">No AI Recommendations Yet</h2>
                <p className="mb-4 text-gray-500">
                  There are no AI recommendations available. Add an AI recommendation to your
                  entries to see them here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {displayedLogs.map((log) => (
                <Card key={log.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex flex-col items-center justify-center bg-blue-50 p-4 md:w-56">
                      <div className="text-5xl">{getMoodEmoji(log.moodRating)}</div>
                      <div className="mt-2 text-lg font-semibold">{log.moodRating}/10</div>
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <CalendarDays size={14} />
                        <span>{formatDate(log.date)}</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 text-lg font-medium text-blue-700">
                        <Lightbulb size={20} />
                        AI Recommendation
                      </div>
                      <Separator className="my-3" />
                      <div className="prose max-w-none text-gray-700">
                        <AIRecommendationFormatter
                          recommendation={log.artificialIntelligenceTip ?? ""}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
