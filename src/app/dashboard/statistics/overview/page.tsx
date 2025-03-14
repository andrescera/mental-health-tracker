"use client";

import { useState, useMemo } from "react";
import { format, subDays, subYears, isWithinInterval } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from "recharts";

export default function StatisticsOverviewPage() {
  const [period, setPeriod] = useState("week");
  const { data: logs, isLoading } = api.log.getAll.useQuery();

  // Function to get date range based on selected period
  const getDateRange = () => {
    const today = new Date();
    switch (period) {
      case "week":
        return {
          start: subDays(today, 7),
          end: today,
          title: "Last 7 Days"
        };
      case "month":
        return {
          start: subDays(today, 30),
          end: today,
          title: "Last 30 Days"
        };
      case "year":
        return {
          start: subYears(today, 1),
          end: today,
          title: "Last 365 Days"
        };
      default:
        return {
          start: subDays(today, 7),
          end: today,
          title: "Last 7 Days"
        };
    }
  };

  // Filter logs based on selected period
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    const { start, end } = getDateRange();

    return logs.filter(log => {
      const logDate = new Date(log.date);
      return isWithinInterval(logDate, { start, end });
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [getDateRange, logs]);

  // Format data for charts
  const chartData = useMemo(() => {
    return filteredLogs.map(log => ({
      date: format(new Date(log.date), "MMM dd"),
      mood: log.moodRating,
      anxiety: log.anxietyLevel,
      sleep: log.sleepHours,
      sleepQuality: log.sleepQuality,
      stress: log.stressLevel,
      social: log.socialInteraction,
    }));
  }, [filteredLogs]);

  // Calculate averages and symptom statistics
  const statistics = useMemo(() => {
    if (filteredLogs.length === 0) return null;

    const sum = filteredLogs.reduce((acc, log) => {
      return {
        moodRating: acc.moodRating + log.moodRating,
        anxietyLevel: acc.anxietyLevel + log.anxietyLevel,
        sleepHours: acc.sleepHours + log.sleepHours,
        sleepQuality: acc.sleepQuality + log.sleepQuality,
        stressLevel: acc.stressLevel + log.stressLevel,
        socialInteraction: acc.socialInteraction + log.socialInteraction,
        activityDuration: acc.activityDuration + log.activityDuration,
      };
    }, {
      moodRating: 0,
      anxietyLevel: 0,
      sleepHours: 0,
      sleepQuality: 0,
      stressLevel: 0,
      socialInteraction: 0,
      activityDuration: 0,
    });

    const count = filteredLogs.length;

    // Calculate depression and anxiety symptom statistics
    const depressionCount = filteredLogs.filter(log => log.depressionSymptoms).length;
    const anxietyCount = filteredLogs.filter(log => log.anxietySymptoms).length;

    const depressionSeveritySum = filteredLogs
      .filter(log => log.depressionSymptoms)
      .reduce((sum, log) => sum + log.depresionSymptomSeverity, 0);

    const anxietySeveritySum = filteredLogs
      .filter(log => log.anxietySymptoms)
      .reduce((sum, log) => sum + log.axtientySymptomSeverity, 0);

    // Calculate activity with duration > 0
    const activeEntries = filteredLogs.filter(log => log.activityDuration > 0).length;

    return {
      // Averages
      moodRating: (sum.moodRating / count).toFixed(1),
      anxietyLevel: (sum.anxietyLevel / count).toFixed(1),
      sleepHours: (sum.sleepHours / count).toFixed(1),
      sleepQuality: (sum.sleepQuality / count).toFixed(1),
      stressLevel: (sum.stressLevel / count).toFixed(1),
      socialInteraction: (sum.socialInteraction / count).toFixed(1),
      activityDuration: (sum.activityDuration / count).toFixed(0),

      // Activity stats
      activePercentage: Math.round((activeEntries / count) * 100),

      // Depression stats
      depressionPercentage: Math.round((depressionCount / count) * 100),
      depressionSeverity: depressionCount ? (depressionSeveritySum / depressionCount).toFixed(1) : "0.0",

      // Anxiety stats
      anxietyPercentage: Math.round((anxietyCount / count) * 100),
      anxietySeverity: anxietyCount ? (anxietySeveritySum / anxietyCount).toFixed(1) : "0.0",
    };
  }, [filteredLogs]);

  const { title } = getDateRange();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Statistics & Trends</CardTitle>
              <CardDescription>Visualize and track patterns in your mental health data</CardDescription>
            </div>
            <Tabs
              defaultValue="week"
              onValueChange={setPeriod}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                <TabsTrigger value="week">Last 7 Days</TabsTrigger>
                <TabsTrigger value="month">Last 30 Days</TabsTrigger>
                <TabsTrigger value="year">Last 365 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          ) : !filteredLogs.length ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
                <p className="text-gray-500 mb-4">
                  There are no entries for the selected period. Add entries to see statistics.
                </p>
                <Button onClick={() => window.location.href = "/dashboard/tracker/daily-tracker"}>
                  Add New Entry
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{statistics?.moodRating} / 10</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Sleep</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{statistics?.sleepHours} hours</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Stress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{statistics?.stressLevel} / 10</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Daily Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{statistics?.activityDuration} min</div>
                    <div className="text-xs text-gray-500 mt-1">{statistics?.activePercentage}% of days active</div>
                  </CardContent>
                </Card>
              </div>

              {/* Symptom Overview */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Depression Symptoms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{statistics?.depressionPercentage}% of days</div>
                    {Number(statistics?.depressionPercentage) > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Average severity: {statistics?.depressionSeverity}/10
                      </div>
                    )}
                    <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-600"
                        style={{ width: `${statistics?.depressionPercentage}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Anxiety Symptoms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{statistics?.anxietyPercentage}% of days</div>
                    {Number(statistics?.anxietyPercentage) > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Average severity: {statistics?.anxietySeverity}/10
                      </div>
                    )}
                    <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500"
                        style={{ width: `${statistics?.anxietyPercentage}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mood & Anxiety Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mood & Anxiety Trends</CardTitle>
                  <CardDescription>
                    Tracking your mood and anxiety levels over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="mood"
                          name="Mood Rating"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="anxiety"
                          name="Anxiety Level"
                          stroke="#ff8042"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sleep Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sleep Patterns</CardTitle>
                  <CardDescription>
                    Hours of sleep and sleep quality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="sleep"
                          name="Sleep Hours"
                          stroke="#8884d8"
                          fill="#8884d8"
                          opacity={0.8}
                        />
                        <Area
                          type="monotone"
                          dataKey="sleepQuality"
                          name="Sleep Quality"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          opacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Stress & Social Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stress & Social Interaction</CardTitle>
                  <CardDescription>
                    Compare stress levels with social activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="stress"
                          name="Stress Level"
                          fill="#ff8042"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="social"
                          name="Social Interaction"
                          fill="#82ca9d"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Period Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{title} Summary</CardTitle>
                  <CardDescription>
                    Overview of your mental health during this period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Mood Rating</h3>
                      <p className="text-2xl font-semibold">{statistics?.moodRating}</p>
                      <p className="text-xs text-gray-500">Average (1-10)</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Anxiety Level</h3>
                      <p className="text-2xl font-semibold">{statistics?.anxietyLevel}</p>
                      <p className="text-xs text-gray-500">Average (1-10)</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Sleep Hours</h3>
                      <p className="text-2xl font-semibold">{statistics?.sleepHours}</p>
                      <p className="text-xs text-gray-500">Average per night</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Sleep Quality</h3>
                      <p className="text-2xl font-semibold">{statistics?.sleepQuality}</p>
                      <p className="text-xs text-gray-500">Average (1-10)</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Stress Level</h3>
                      <p className="text-2xl font-semibold">{statistics?.stressLevel}</p>
                      <p className="text-xs text-gray-500">Average (1-10)</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">Social</h3>
                      <p className="text-2xl font-semibold">{statistics?.socialInteraction}</p>
                      <p className="text-xs text-gray-500">Average (1-10)</p>
                    </div>
                  </div>
                  <div className="mt-6 text-center text-gray-500">
                    <p>Based on {filteredLogs.length} entries</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
