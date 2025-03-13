import { z } from "zod";

// Define ActivityCategory enum values based on Prisma schema
export const ActivityCategoryEnum = z.enum([
  "WALKING", "RUNNING", "CYCLING", "SWIMMING", "HIKING", 
  "GYM_WORKOUT", "YOGA", "PILATES", "DANCING", "MARTIAL_ARTS", 
  "TEAM_SPORTS", "RACQUET_SPORTS", "WATER_SPORTS", "WINTER_SPORTS", 
  "HOME_WORKOUT", "CALISTHENICS", "WEIGHTLIFTING", "CROSSFIT", 
  "BOXING", "CLIMBING", "SKATEBOARDING", "ROWING", "OTHER", "NONE"
]);

// Define log input schema for reuse
export const logFormSchema = z.object({
  date: z.union([z.date(), z.string()]).transform(val => new Date(val)),
  moodRating: z.number().min(1).max(10),
  anxietyLevel: z.number().min(1).max(10),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10),
  physicalActivity: ActivityCategoryEnum,
  activityDuration: z.number().min(0),
  socialInteraction: z.number().min(1).max(10),
  depressionSymptoms: z.boolean(),
  anxietySymptoms: z.boolean(),
  depresionSymptomSeverity: z.number().min(0).max(10),
  axtientySymptomSeverity: z.number().min(0).max(10),
  notes: z.string().optional(),
});

// Export type to use in both frontend and backend
export type LogFormValues = z.infer<typeof logFormSchema>;