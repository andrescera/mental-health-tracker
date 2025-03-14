"use client";

import React, { useState, useEffect, useCallback } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Log } from "@prisma/client";
import { format, parse, isValid } from "date-fns";
import { ChevronDown, Plus, Moon, Brain, Heart, AlertCircle, Pencil, Trash2, Lightbulb } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import { Calendar } from "~/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { Textarea } from "~/components/ui/textarea";

import { getMoodEmoji } from "~/lib/contants";
import { ActivityCategoryValues, logFormSchema, type LogFormValues } from "~/lib/schemas";

import { api } from "~/trpc/react";

export default function DailyTrackerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get date from URL or use today's date as default
  const getInitialDate = (): Date => {
    const dateParam = searchParams.get("date");

    if (dateParam) {
      // Try to parse the date from URL (format: YYYY-MM-DD)
      const parsedDate = parse(dateParam, "yyyy-MM-dd", new Date());

      // Make sure the date is valid and not in the future
      if (isValid(parsedDate)) {
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        // If the parsed date is in the future, use today instead
        if (parsedDate > today) {
          console.warn("Future date detected in URL, defaulting to today");

          return today;
        }

        return parsedDate;
      }
    }

    return new Date();
  };

  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLogDate, setSelectedLogDate] = useState<Date | null>(getInitialDate());
  const [viewingLog, setViewingLog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Update URL when selected date changes
  const updateUrlWithDate = useCallback(
    (date: Date | null) => {
      if (!date) {
        return;
      }

      // Create new URLSearchParams object based on the current URL search parameters
      const params = new URLSearchParams(searchParams.toString());

      // Add or update the date parameter
      params.set("date", format(date, "yyyy-MM-dd"));

      // Replace the current URL with the new one including updated search parameters
      // Use replace to avoid adding to the history stack for every date change
      router.replace(`${window.location.pathname}?${params.toString()}`);
    },
    [router, searchParams]
  );

  // tRPC queries and mutations
  const {
    data: logs,
    isLoading,
    error: _error,
    refetch,
  } = api.log.getAll.useQuery(undefined, {
    // Enable refetching on window focus and on mount
    refetchOnWindowFocus: true,
    retry: 3,
  });

  console.log(logs);

  // Handle errors for the query
  useEffect(() => {
    if (_error) {
      console.error("Error fetching logs:", _error);
      toast.error("Failed to load your entries. Please try again.");
    }
  }, [_error]);
  const createLog = api.log.create.useMutation({
    onSuccess: () => {
      void refetch();
      toast.success("Your log has been saved.");
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateLog = api.log.update.useMutation({
    onSuccess: () => {
      void refetch();
      toast.success("Your log has been updated.");
      setIsFormOpen(false);
      setIsEditing(false);
      form.reset();
    },
  });

  const deleteLog = api.log.delete.useMutation({
    onSuccess: () => {
      void refetch();
      toast.info("Your log entry has been deleted.");
      setViewingLog(false);
      setSelectedLog(null);
    },
  });

  // React Hook Form setup
  const form = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      date: new Date(),
      moodRating: 5,
      anxietyLevel: 5,
      sleepHours: 8,
      sleepQuality: 5,
      stressLevel: 5,
      physicalActivity: "NONE", // Default to NONE
      activityDuration: 0, // Default to 0 to match NONE activity
      socialInteraction: 5,
      depressionSymptoms: false,
      anxietySymptoms: false,
      depressionSymptomSeverity: 0,
      anxietySymptomSeverity: 0,
      notes: "",
      artificialIntelligenceTip: "",
    },
  });

  // Update disabled dates when logs change
  useEffect(() => {
    if (logs) {
      const datesWithLogs = logs.map((log) => new Date(log.date));

      setDisabledDates(datesWithLogs);
    }
  }, [logs]);

  // Effect to sync the URL date parameter with the component state
  useEffect(() => {
    const dateParam = searchParams.get("date");

    if (dateParam) {
      // Try to parse the date from URL (format: YYYY-MM-DD)
      const parsedDate = parse(dateParam, "yyyy-MM-dd", new Date());

      if (isValid(parsedDate)) {
        // Set the date without updating the URL (to avoid infinite loop)
        setSelectedLogDate(parsedDate);
      }
    } else {
      // If no date in URL, set to today and update URL
      const today = new Date();

      setSelectedLogDate(today);
      updateUrlWithDate(today);
    }
  }, [searchParams, updateUrlWithDate]);

  // Find log for selected date
  useEffect(() => {
    if (selectedLogDate && logs) {
      const formattedSelectedDate = format(selectedLogDate, "yyyy-MM-dd");

      const log = logs.find((log) => {
        const formattedLogDate = format(new Date(log.date), "yyyy-MM-dd");

        return formattedLogDate === formattedSelectedDate;
      });

      if (log) {
        setSelectedLog(log);
        setViewingLog(true);
      } else {
        setViewingLog(false);
        setSelectedLog(null);
        form.setValue("date", selectedLogDate);
      }
    }
  }, [selectedLogDate, logs, form]);

  // Handle form submission
  function onSubmit(data: LogFormValues) {
    if (isEditing && selectedLog) {
      updateLog.mutate({
        id: selectedLog.id,
        data,
      });
    } else {
      createLog.mutate(data);
    }
  }

  // Handle date selection
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Check if the date is today or in the past
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const selectedDate = new Date(newDate);

      selectedDate.setHours(0, 0, 0, 0);

      // Prevent selection of future dates
      if (selectedDate > today) {
        toast.error("Cannot select future dates for tracking");

        return;
      }

      setSelectedLogDate(selectedDate);

      // Update URL with the new date
      updateUrlWithDate(selectedDate);

      // Check if this date already has a log
      const formattedNewDate = format(selectedDate, "yyyy-MM-dd");
      const dateHasLog = disabledDates.some(
        (disabledDate) => format(disabledDate, "yyyy-MM-dd") === formattedNewDate
      );

      if (dateHasLog) {
        // If there's an existing log for this date, find and view it
        const existingLog = logs?.find(
          (log) => format(new Date(log.date), "yyyy-MM-dd") === formattedNewDate
        );

        if (existingLog) {
          setSelectedLog(existingLog);
          setViewingLog(true);
          setIsFormOpen(false);
        }
      } else {
        // No log for this date, open the form to create a new one
        setViewingLog(false);
        setSelectedLog(null);
        setIsEditing(false);
        setIsFormOpen(true);
      }
    }
  };

  // Handle opening the form for a new log - always uses today's date
  const handleAddNewLog = () => {
    const today = new Date();

    // Remove time component for accurate comparison
    today.setHours(0, 0, 0, 0);
    const formattedToday = format(today, "yyyy-MM-dd");

    // Update URL with today's date
    updateUrlWithDate(today);

    // Check if there's an entry for today already
    const hasEntryForToday = logs?.some(
      (log) => format(new Date(log.date), "yyyy-MM-dd") === formattedToday
    );

    if (hasEntryForToday) {
      // Find and display today's entry instead of creating a new one
      const todayEntry = logs?.find(
        (log) => format(new Date(log.date), "yyyy-MM-dd") === formattedToday
      );

      if (todayEntry) {
        setSelectedLog(todayEntry);
        setViewingLog(true);
        setSelectedLogDate(today);
        toast.info("You already have an entry for today. Viewing your existing entry.");
      }
    } else {
      // No entry for today, proceed with creating a new one
      setViewingLog(false);
      setSelectedLog(null);
      setIsEditing(false);
      setSelectedLogDate(today);
      form.reset({
        ...form.getValues(),
        date: today,
      });
      setIsFormOpen(true);
    }
  };

  // Handle editing an existing log
  const handleEditLog = (log: Log) => {
    setViewingLog(false);
    setIsEditing(true);

    // Populate form with existing log data
    form.reset({
      date: new Date(log.date),
      moodRating: log.moodRating,
      anxietyLevel: log.anxietyLevel,
      sleepHours: log.sleepHours,
      sleepQuality: log.sleepQuality,
      stressLevel: log.stressLevel,
      physicalActivity: log.physicalActivity,
      activityDuration: log.activityDuration,
      socialInteraction: log.socialInteraction,
      depressionSymptoms: log.depressionSymptoms,
      anxietySymptoms: log.anxietySymptoms,
      depressionSymptomSeverity: log.depressionSymptomSeverity,
      anxietySymptomSeverity: log.anxietySymptomSeverity,
      notes: log.notes ?? "",
      artificialIntelligenceTip: log.artificialIntelligenceTip ?? "",
    });

    setIsFormOpen(true);
  };

  // Handle deleting a log
  const handleDeleteLog = (id: string) => {
    deleteLog.mutate({ id });
  };

  // Create custom modifiers for the calendar - using useEffect to update when dependencies change
  const [hasLogDates, setHasLogDates] = useState<Date[]>(disabledDates);

  // Update hasLogDates whenever selectedLogDate or disabledDates change
  useEffect(() => {
    // Filter out the currently selected date from the hasLog modifier
    if (selectedLogDate) {
      const filteredDates = disabledDates.filter(
        (date) => format(date, "yyyy-MM-dd") !== format(selectedLogDate, "yyyy-MM-dd")
      );

      setHasLogDates(filteredDates);
    } else {
      setHasLogDates(disabledDates);
    }
  }, [selectedLogDate, disabledDates]);

  // Apply the modifiers object
  const modifiers = {
    hasLog: hasLogDates,
  };

  // Custom styles for calendar using Tailwind classes
  const modifierClassNames = {
    hasLog: "bg-gray-200 text-gray-700 font-medium rounded-md",
    selected:
      "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground focus:!bg-primary focus:!text-primary-foreground font-bold",
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Daily Mood Tracker</CardTitle>
              <CardDescription>
                Track your mental health journey with one entry per day
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-1/3">
            <div className="rounded-lg bg-white p-4 shadow">
              <Calendar
                mode="single"
                selected={selectedLogDate ?? undefined}
                onSelect={handleDateSelect}
                modifiers={modifiers}
                modifiersClassNames={modifierClassNames}
                className="w-full"
                // Disable future dates since we can't log for future
                disabled={(date) => {
                  const today = new Date();

                  today.setHours(0, 0, 0, 0);
                  date.setHours(0, 0, 0, 0);

                  return date > today;
                }}
                // Allow selecting dates from 2023 up to today
                fromMonth={new Date(2023, 0, 1)}
                toMonth={new Date()}
              />
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="h-4 w-4 rounded-full bg-gray-200" />
                  <span>Dates with entries</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="h-4 w-4 rounded-full bg-primary" />
                  <span>Selected date</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  You can add entries for today and past dates only.
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            {isLoading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
              </div>
            ) : viewingLog ? (
              <>
                {/* Check if this is not today's entry and there's no entry for today */}
                {selectedLog &&
                  format(new Date(selectedLog.date), "yyyy-MM-dd") !==
                    format(new Date(), "yyyy-MM-dd") &&
                  !logs?.some(
                    (log) =>
                      format(new Date(log.date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                  ) && (
                    <div className="mb-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddNewLog}
                        className="flex items-center gap-1"
                      >
                        <Plus size={16} /> Add Today&apos;s Entry
                      </Button>
                    </div>
                  )}
                {selectedLog && (
                  <ViewLogCard
                    log={selectedLog}
                    _onAddNew={handleAddNewLog}
                    onEdit={handleEditLog}
                    onDelete={handleDeleteLog}
                  />
                )}
              </>
            ) : isFormOpen ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {isEditing ? "Edit your entry" : "How are you feeling today?"}
                      </CardTitle>
                      <CardDescription>
                        {selectedLogDate ? format(selectedLogDate, "EEEE, MMMM d, yyyy") : "Today"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <input
                        type="hidden"
                        {...form.register("date", {
                          valueAsDate: true,
                          value: selectedLogDate ?? new Date(),
                        })}
                      />

                      {/* Mood & Anxiety Section */}
                      <div className="space-y-3">
                        <h3 className="flex items-center gap-2 text-lg font-medium">
                          <Brain size={20} /> Mood & Anxiety
                        </h3>
                        <Separator />

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="moodRating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mood (1-10)</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Slider
                                      min={1}
                                      max={10}
                                      step={1}
                                      value={[field.value]}
                                      onValueChange={(value) => field.onChange(value[0])}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Very Low</span>
                                      <span>Very High</span>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="anxietyLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Anxiety Level (1-10)</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Slider
                                      min={1}
                                      max={10}
                                      step={1}
                                      value={[field.value]}
                                      onValueChange={(value) => field.onChange(value[0])}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Very Low</span>
                                      <span>Very High</span>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Sleep Section */}
                      <div className="space-y-3">
                        <h3 className="flex items-center gap-2 text-lg font-medium">
                          <Moon size={20} /> Sleep
                        </h3>
                        <Separator />

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="sleepHours"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hours of Sleep</FormLabel>
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={24}
                                      step={0.5}
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                    />
                                    <span>hours</span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="sleepQuality"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sleep Quality (1-10)</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Slider
                                      min={1}
                                      max={10}
                                      step={1}
                                      value={[field.value]}
                                      onValueChange={(value) => field.onChange(value[0])}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Very Poor</span>
                                      <span>Excellent</span>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Stress & Activity Section */}
                      <div className="space-y-3">
                        <h3 className="flex items-center gap-2 text-lg font-medium">
                          <Heart size={20} /> Stress & Activity
                        </h3>
                        <Separator />

                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={form.control}
                            name="stressLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stress Level (1-10)</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Slider
                                      min={1}
                                      max={10}
                                      step={1}
                                      value={[field.value]}
                                      onValueChange={(value) => field.onChange(value[0])}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Very Low</span>
                                      <span>Very High</span>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="physicalActivity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Physical Activity</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      // If NONE is selected, set activityDuration to 0
                                      if (value === "NONE") {
                                        form.setValue("activityDuration", 0);
                                      }
                                    }}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select activity type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {/* Use SelectGroup to group options with label */}
                                      <SelectGroup>
                                        {/* No Activity option */}
                                        <SelectItem value="NONE">No Activity</SelectItem>
                                      </SelectGroup>

                                      {/* Activities group with label */}
                                      <SelectGroup>
                                        <SelectLabel>Activities</SelectLabel>
                                        {ActivityCategoryValues.filter(
                                          (value) => value !== "NONE"
                                        ).map((value) => (
                                          <SelectItem value={value} key={value}>
                                            {value
                                              .toLowerCase()
                                              .split("_")
                                              .map(
                                                (word) =>
                                                  word.charAt(0).toUpperCase() + word.slice(1)
                                              )
                                              .join(" ")}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="activityDuration"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Activity Duration</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min={0}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        disabled={form.watch("physicalActivity") === "NONE"}
                                      />
                                      <span>minutes</span>
                                    </div>
                                  </FormControl>
                                  {form.watch("physicalActivity") === "NONE" && (
                                    <FormDescription className="text-xs">
                                      Duration automatically set to 0 when no activity is selected
                                    </FormDescription>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="socialInteraction"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Social Interaction (1-10)</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Slider
                                      min={1}
                                      max={10}
                                      step={1}
                                      value={[field.value]}
                                      onValueChange={(value) => field.onChange(value[0])}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>None</span>
                                      <span>Very High</span>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Symptoms Section */}
                      <div className="space-y-3">
                        <h3 className="flex items-center gap-2 text-lg font-medium">
                          <AlertCircle size={20} /> Symptoms
                        </h3>
                        <Separator />

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name="depressionSymptoms"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Depression Symptoms</FormLabel>
                                    <FormDescription>
                                      Experiencing symptoms of depression today?
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            {form.watch("depressionSymptoms") && (
                              <FormField
                                control={form.control}
                                name="depressionSymptomSeverity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Severity (1-10)</FormLabel>
                                    <FormControl>
                                      <div className="space-y-2">
                                        <Slider
                                          min={0}
                                          max={10}
                                          step={1}
                                          value={[field.value]}
                                          onValueChange={(value) => field.onChange(value[0])}
                                        />
                                        <div className="flex justify-between text-xs text-gray-500">
                                          <span>Mild</span>
                                          <span>Severe</span>
                                        </div>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>

                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name="anxietySymptoms"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Anxiety Symptoms</FormLabel>
                                    <FormDescription>
                                      Experiencing symptoms of anxiety today?
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            {form.watch("anxietySymptoms") && (
                              <FormField
                                control={form.control}
                                name="anxietySymptomSeverity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Severity (1-10)</FormLabel>
                                    <FormControl>
                                      <div className="space-y-2">
                                        <Slider
                                          min={0}
                                          max={10}
                                          step={1}
                                          value={[field.value]}
                                          onValueChange={(value) => field.onChange(value[0])}
                                        />
                                        <div className="flex justify-between text-xs text-gray-500">
                                          <span>Mild</span>
                                          <span>Severe</span>
                                        </div>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Notes Section */}
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Any additional notes about your day..."
                                  className="h-24"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* AI Tip Section */}
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="artificialIntelligenceTip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>AI Recommendation</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter an AI recommendation or leave blank..."
                                  className="h-24"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                An AI-generated or manually entered recommendation based on your mood data
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createLog.isPending || updateLog.isPending}>
                        {createLog.isPending || updateLog.isPending
                          ? "Saving..."
                          : isEditing
                            ? "Update Entry"
                            : "Save Entry"}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </Form>
            ) : (
              <div className="flex h-96 flex-col items-center justify-center space-y-4">
                <div className="text-center">
                  <h2 className="mb-2 text-2xl font-bold">Track Your Mental Health</h2>
                  <p className="mb-4 text-gray-500">
                    Select a date on the calendar to add an entry or view past entries
                  </p>

                  <div className="flex flex-col items-center gap-3">
                    {selectedLogDate &&
                    format(selectedLogDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd") ? (
                      <>
                        <Button
                          onClick={() => {
                            // Create entry for selected date
                            setViewingLog(false);
                            setSelectedLog(null);
                            setIsEditing(false);
                            setIsFormOpen(true);
                          }}
                        >
                          <Plus size={16} className="mr-2" /> Create Entry for{" "}
                          {format(selectedLogDate, "MMM d")}
                        </Button>

                        {/* Only show "Add Today's Entry" if there isn't already an entry for today */}
                        {!logs?.some(
                          (log) =>
                            format(new Date(log.date), "yyyy-MM-dd") ===
                            format(new Date(), "yyyy-MM-dd")
                        ) && (
                          <Button variant="outline" onClick={handleAddNewLog}>
                            <Plus size={16} className="mr-2" /> Add Today&apos;s Entry
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button onClick={handleAddNewLog}>
                        <Plus size={16} className="mr-2" /> Add Today&apos;s Entry
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component to view a log entry
function ViewLogCard({
  log,
  // onAddNew is defined but never used
  _onAddNew,
  onEdit,
  onDelete,
}: {
  log: Log;
  _onAddNew: () => void;
  onEdit: (log: Log) => void;
  onDelete: (id: string) => void;
}) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    return format(dateObj, "EEEE, MMMM d, yyyy");
  };

  const getRatingColor = (rating: number, inverse = false) => {
    const colors = inverse
      ? ["bg-red-100", "bg-orange-100", "bg-yellow-100", "bg-green-100", "bg-emerald-100"]
      : ["bg-emerald-100", "bg-green-100", "bg-yellow-100", "bg-orange-100", "bg-red-100"];

    const index = Math.floor((rating - 1) / 2);

    return colors[Math.min(index, colors.length - 1)];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Entry</CardTitle>
            <CardDescription>{formatDate(log.date)}</CardDescription>
          </div>
          <div className="flex gap-2">
            {/* This will be passed down from the parent component */}

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => onEdit(log)}
            >
              <Pencil size={16} /> Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 border-red-200 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={16} /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your log entry from{" "}
                    {formatDate(log.date)}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(log.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="mb-2 text-3xl">{getMoodEmoji(log.moodRating)}</div>
            <div className="text-sm font-medium">Mood</div>
            <div className="text-lg">{log.moodRating}/10</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="mb-2 text-3xl">💤</div>
            <div className="text-sm font-medium">Sleep</div>
            <div className="text-lg">{log.sleepHours} hours</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="mb-2 text-3xl">🧠</div>
            <div className="text-sm font-medium">Stress</div>
            <div className="text-lg">{log.stressLevel}/10</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="mb-2 text-3xl">🏃</div>
            <div className="text-sm font-medium">Activity</div>
            <div className="text-lg">{log.activityDuration} min</div>
          </div>
        </div>

        {/* This functionality is now handled at the parent component level */}

        {/* Detailed Sections */}
        <Collapsible className="w-full">
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-medium">
            <span>View Details</span>
            <ChevronDown size={16} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
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
                    style={{ width: `${log.anxietyLevel * 10}%` }}
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
                    style={{ width: `${(log.sleepHours / 12) * 100}%` }}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Sleep Quality</span>
                    <span className="font-medium">{log.sleepQuality}/10</span>
                  </div>
                  <div
                    className={`h-2 rounded-full ${getRatingColor(log.sleepQuality)}`}
                    style={{ width: `${log.sleepQuality * 10}%` }}
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
                    style={{ width: `${log.stressLevel * 10}%` }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-sm">Physical Activity</div>
                    <div className="font-medium">
                      {log.physicalActivity === "NONE"
                        ? "No Activity"
                        : log.physicalActivity
                            .toLowerCase()
                            .split("_")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm">Activity Duration</div>
                    <div className="font-medium">{log.activityDuration} minutes</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Social Interaction</span>
                    <span className="font-medium">{log.socialInteraction}/10</span>
                  </div>
                  <div
                    className={`h-2 rounded-full ${getRatingColor(log.socialInteraction)}`}
                    style={{ width: `${log.socialInteraction * 10}%` }}
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
                <div className="rounded-lg bg-gray-50 p-3">{log.notes}</div>
              </div>
            )}
            
            {/* AI Recommendation */}
            {log.artificialIntelligenceTip && (
              <div className="space-y-2">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Lightbulb size={18} />
                  AI Recommendation
                </h3>
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-blue-800">
                  {log.artificialIntelligenceTip?.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
