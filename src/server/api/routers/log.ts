import { z } from "zod";

import { logFormSchema } from "~/lib/schemas";

import { getMistralAdvice } from "~/server/ai/agent/mistral";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const logRouter = createTRPCRouter({
  // Get all logs for the current user
  getAll: protectedProcedure.query(async ({ ctx }) =>
    ctx.db.log.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { date: "desc" },
    })
  ),

  // Get a specific log by ID
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const log = await ctx.db.log.findFirst({
      where: {
        id: input.id,
        userId: ctx.session.user.id, // Ensure the log belongs to the current user
      },
    });

    if (!log) {
      throw new Error("Log not found or you don't have permission to view it");
    }

    return log;
  }),

  // Create a new log - ensure only one entry per day
  create: protectedProcedure.input(logFormSchema).mutation(async ({ ctx, input }) => {
    // Format input date to remove time component for comparison
    const inputDate = new Date(input.date);
    const dateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

    // Check if an entry already exists for this day
    const existingLog = await ctx.db.log.findFirst({
      where: {
        userId: ctx.session.user.id,
        date: {
          // Find entries that fall on the same day
          gte: dateOnly,
          lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000), // Add one day
        },
      },
    });

    if (existingLog) {
      throw new Error(
        "You already have an entry for this day. Please edit the existing entry instead."
      );
    }

    // Create new log if no existing entry
    return ctx.db.log.create({
      data: {
        moodRating: input.moodRating,
        anxietyLevel: input.anxietyLevel,
        sleepHours: input.sleepHours,
        sleepQuality: input.sleepQuality,
        stressLevel: input.stressLevel,
        physicalActivity: input.physicalActivity,
        activityDuration: input.activityDuration,
        socialInteraction: input.socialInteraction,
        depressionSymptoms: input.depressionSymptoms,
        anxietySymptoms: input.anxietySymptoms,
        depressionSymptomSeverity: input.depressionSymptomSeverity,
        anxietySymptomSeverity: input.anxietySymptomSeverity,
        notes: input.notes,
        userId: ctx.session.user.id,
        artificialIntelligenceTip: await getMistralAdvice(input),
      },
    });
  }),

  // Update an existing log
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: logFormSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First check if the log exists and belongs to the user
      const existingLog = await ctx.db.log.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!existingLog) {
        throw new Error("Log not found or you don't have permission to update it");
      }

      // Format date without time
      const inputDate = new Date(input.data.date);
      const dateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

      // Update the log
      return ctx.db.log.update({
        where: { id: input.id },
        data: {
          moodRating: input.data.moodRating,
          anxietyLevel: input.data.anxietyLevel,
          sleepHours: input.data.sleepHours,
          sleepQuality: input.data.sleepQuality,
          stressLevel: input.data.stressLevel,
          physicalActivity: input.data.physicalActivity,
          activityDuration: input.data.activityDuration,
          socialInteraction: input.data.socialInteraction,
          depressionSymptoms: input.data.depressionSymptoms,
          anxietySymptoms: input.data.anxietySymptoms,
          depressionSymptomSeverity: input.data.depressionSymptomSeverity,
          anxietySymptomSeverity: input.data.anxietySymptomSeverity,
          notes: input.data.notes,
          date: dateOnly, // Save with the date only (no time)
        },
      });
    }),

  // Delete a log
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First check if the log exists and belongs to the user
      const existingLog = await ctx.db.log.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!existingLog) {
        throw new Error("Log not found or you don't have permission to delete it");
      }

      // Delete the log
      return ctx.db.log.delete({
        where: { id: input.id },
      });
    }),
});
