"use client";

import { Fragment, useState } from "react";

import { useRouter } from "next/navigation";

import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Moon,
  Brain,
  Heart,
  AlertCircle,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  SortDesc,
  SortAsc,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

import { AIRecommendationFormatter } from "~/components/ai-recommendation-formatter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";

import { getMoodEmoji } from "~/lib/contants";

import { api } from "~/trpc/react";

// Reuse rendering functions from the daily tracker page

const getRatingColor = (rating: number, inverse = false) => {
  const colors = inverse
    ? ["bg-red-100", "bg-orange-100", "bg-yellow-100", "bg-green-100", "bg-emerald-100"]
    : ["bg-emerald-100", "bg-green-100", "bg-yellow-100", "bg-orange-100", "bg-red-100"];

  const index = Math.floor((rating - 1) / 2);

  return colors[Math.min(index, colors.length - 1)];
};

const formatActivityType = (type: string) => {
  if (type === "NONE") {
    return "No Activity";
  }

  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function HistoryPage() {
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // tRPC queries and mutations
  const { data: logs, isLoading, error: _error, refetch } = api.log.getAll.useQuery();

  const deleteLog = api.log.delete.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.info("Your log entry has been deleted.");
    },
  });

  // Handle deleting a log
  const handleDeleteLog = (id: string) => {
    deleteLog.mutate({ id });
  };

  // Handle editing a log (redirects to daily tracker page with selected date)
  const handleEditLog = (date: Date) => {
    router.push(`/dashboard/tracker/daily-tracker?date=${format(new Date(date), "yyyy-MM-dd")}`);
  };

  // Toggle expanded state for a row
  const toggleRowExpanded = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // Sort logs based on current sort order
  const sortedLogs = logs
    ? [...logs].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      })
    : [];

  // Format dates for display
  const formatDate = (dateString: string | Date) =>
    format(new Date(dateString), "EEEE, MMMM d, yyyy");

  const formatDateTime = (dateString: string | Date) =>
    format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");

  return (
    <div className="container mx-auto space-y-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">History</CardTitle>
              <CardDescription>View and manage all your mood tracker entries</CardDescription>
            </div>
            <Button variant="outline" onClick={toggleSortOrder} className="flex items-center gap-2">
              {sortOrder === "desc" ? (
                <>
                  <SortDesc size={16} />
                  Newest first
                </>
              ) : (
                <>
                  <SortAsc size={16} />
                  Oldest first
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold">No entries yet</h2>
                <p className="mb-4 text-gray-500">
                  You haven&apos;t created any mood tracker entries yet
                </p>
                <Button onClick={() => router.push("/dashboard/tracker/daily-tracker")}>
                  <Calendar size={16} className="mr-2" /> Add Your First Entry
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableCaption>A history of all your mood tracker entries.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead>Mood</TableHead>
                  <TableHead>Sleep</TableHead>
                  <TableHead>Stress</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLogs.map((log) => (
                  <Fragment key={log.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRowExpanded(log.id)}
                    >
                      <TableCell className="font-medium">{formatDate(log.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getMoodEmoji(log.moodRating)}</span>
                          <span>{log.moodRating}/10</span>
                        </div>
                      </TableCell>
                      <TableCell>{log.sleepHours} hrs</TableCell>
                      <TableCell>{log.stressLevel}/10</TableCell>
                      <TableCell>
                        {log.physicalActivity !== "NONE" ? (
                          <div className="flex flex-col">
                            <span>{formatActivityType(log.physicalActivity)}</span>
                            <span className="text-xs text-gray-500">
                              {log.activityDuration} min
                            </span>
                          </div>
                        ) : (
                          "None"
                        )}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock size={14} />
                                <span>{format(new Date(log.updatedAt), "MMM d, yyyy")}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Created: {formatDateTime(log.createdAt)}</p>
                              <p>Updated: {formatDateTime(log.updatedAt)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="space-x-1 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLog(log.date);
                          }}
                        >
                          <span className="sr-only">Edit</span>
                          <Pencil size={16} />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="sr-only">Delete</span>
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your log
                                entry from {formatDate(log.date)}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteLog(log.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpanded(log.id);
                          }}
                        >
                          <span className="sr-only">
                            {expandedRows[log.id] ? "Collapse" : "Expand"}
                          </span>
                          {expandedRows[log.id] ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {expandedRows[log.id] && (
                      <TableRow className="border-0 bg-gray-50">
                        <TableCell colSpan={7} className="p-4">
                          <div className="space-y-4">
                            {/* Mood & Anxiety */}
                            <div className="space-y-2">
                              <h3 className="text-md flex items-center gap-2 font-medium">
                                <Brain size={18} /> Mood & Anxiety
                              </h3>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>Mood Rating</span>
                                    <span className="font-medium">{log.moodRating}/10</span>
                                  </div>
                                  <div
                                    className={`h-2 rounded-full ${getRatingColor(log.moodRating)}`}
                                    style={{ width: `${log.moodRating * 10}%` }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>Anxiety Level</span>
                                    <span className="font-medium">{log.anxietyLevel}/10</span>
                                  </div>
                                  <div
                                    className={`h-2 rounded-full ${getRatingColor(log.anxietyLevel, true)}`}
                                    style={{
                                      width: `${log.anxietyLevel * 10}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Sleep */}
                            <div className="space-y-2">
                              <h3 className="text-md flex items-center gap-2 font-medium">
                                <Moon size={18} /> Sleep
                              </h3>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>Sleep Duration</span>
                                    <span className="font-medium">{log.sleepHours} hours</span>
                                  </div>
                                  <div
                                    className="h-2 rounded-full bg-blue-100"
                                    style={{
                                      width: `${(log.sleepHours / 12) * 100}%`,
                                    }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>Sleep Quality</span>
                                    <span className="font-medium">{log.sleepQuality}/10</span>
                                  </div>
                                  <div
                                    className={`h-2 rounded-full ${getRatingColor(log.sleepQuality)}`}
                                    style={{
                                      width: `${log.sleepQuality * 10}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Stress & Activity */}
                            <div className="space-y-2">
                              <h3 className="text-md flex items-center gap-2 font-medium">
                                <Heart size={18} /> Stress & Activity
                              </h3>
                              <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>Stress Level</span>
                                    <span className="font-medium">{log.stressLevel}/10</span>
                                  </div>
                                  <div
                                    className={`h-2 rounded-full ${getRatingColor(log.stressLevel, true)}`}
                                    style={{
                                      width: `${log.stressLevel * 10}%`,
                                    }}
                                  />
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  <div className="space-y-1">
                                    <div className="text-sm">Physical Activity</div>
                                    <div className="font-medium">
                                      {formatActivityType(log.physicalActivity)}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-sm">Activity Duration</div>
                                    <div className="font-medium">
                                      {log.activityDuration} minutes
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>Social Interaction</span>
                                    <span className="font-medium">{log.socialInteraction}/10</span>
                                  </div>
                                  <div
                                    className={`h-2 rounded-full ${getRatingColor(log.socialInteraction)}`}
                                    style={{
                                      width: `${log.socialInteraction * 10}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Symptoms */}
                            <div className="space-y-2">
                              <h3 className="text-md flex items-center gap-2 font-medium">
                                <AlertCircle size={18} /> Symptoms
                              </h3>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {log.depressionSymptoms && (
                                  <div className="space-y-1">
                                    <div className="text-sm">Depression Symptoms</div>
                                    <div className="font-medium">
                                      Yes (Severity: {log.depressionSymptomSeverity}/10)
                                    </div>
                                  </div>
                                )}
                                {log.anxietySymptoms && (
                                  <div className="space-y-1">
                                    <div className="text-sm">Anxiety Symptoms</div>
                                    <div className="font-medium">
                                      Yes (Severity: {log.anxietySymptomSeverity}/10)
                                    </div>
                                  </div>
                                )}
                                {!log.depressionSymptoms && !log.anxietySymptoms && (
                                  <div className="text-sm">No symptoms reported</div>
                                )}
                              </div>
                            </div>

                            {/* Notes */}
                            {log.notes && (
                              <div className="space-y-2">
                                <h3 className="text-md font-medium">Notes</h3>
                                <div className="rounded-lg border border-gray-100 bg-white p-3">
                                  {log.notes}
                                </div>
                              </div>
                            )}

                            {/* AI Recommendation */}
                            {log.artificialIntelligenceTip && (
                              <div className="space-y-2">
                                <h3 className="text-md flex items-center gap-2 font-medium">
                                  <Lightbulb size={18} />
                                  AI Recommendation
                                </h3>
                                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-800">
                                  <AIRecommendationFormatter
                                    recommendation={log.artificialIntelligenceTip || ""}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Timestamps */}
                            <div className="mt-4 border-t border-gray-200 pt-2 text-xs text-gray-500">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <span>Created:</span>
                                  <span>{formatDateTime(log.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>Last updated:</span>
                                  <span>{formatDateTime(log.updatedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
