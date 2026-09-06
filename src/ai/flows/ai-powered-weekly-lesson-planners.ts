'use server';

/**
 * AI-powered weekly lesson planner, via Groq.
 */

import {groqJson} from '@/ai/groq';
import {z} from 'zod';

const CreateWeeklyLessonPlanInputSchema = z.object({
  topic: z.string().describe('The topic for the weekly lesson plan.'),
  gradeLevel: z.string().describe('The grade level for the lesson plan.'),
  learningObjectives: z.string().describe('The learning objectives for the week.'),
  localLanguage: z.string().describe('The local language for the lesson plan.'),
});
export type CreateWeeklyLessonPlanInput = z.infer<typeof CreateWeeklyLessonPlanInputSchema>;

const DailyPlanSchema = z.object({
  day: z.string().describe('The day of the week (e.g., Monday).'),
  topic: z.string().describe('The topic to be covered on this day.'),
  activities: z.array(z.string()).describe('A list of activities for the day.'),
  assessment: z.string().describe("How students will be assessed for the day's learning."),
  resources: z.array(z.string()).describe('A list of resources needed for the day.'),
});

const CreateWeeklyLessonPlanOutputSchema = z.object({
  title: z.string().describe('The title of the weekly lesson plan.'),
  summary: z.string().describe('A brief summary of the weekly lesson plan.'),
  dailyPlans: z.array(DailyPlanSchema).describe('A list of daily lesson plans for a 5-day week.'),
});
export type CreateWeeklyLessonPlanOutput = z.infer<typeof CreateWeeklyLessonPlanOutputSchema>;

export async function createWeeklyLessonPlan(input: CreateWeeklyLessonPlanInput): Promise<CreateWeeklyLessonPlanOutput> {
  return groqJson({
    system: 'You are an expert curriculum designer for Indian classrooms with limited resources.',
    prompt:
      `Create a detailed weekly lesson plan in ${input.localLanguage} (native script) for:\n` +
      `Topic: ${input.topic}\nGrade: ${input.gradeLevel}\nLearning objectives: ${input.learningObjectives}\n\n` +
      'Structure: title, summary, and 5 daily plans (Monday–Friday), each with day, topic, 2-4 engaging low-resource activities, an assessment method, and resources. ' +
      'Return JSON: {"title": string, "summary": string, "dailyPlans": [{"day": string, "topic": string, "activities": [string], "assessment": string, "resources": [string]}]}',
    schema: CreateWeeklyLessonPlanOutputSchema,
    maxTokens: 3000,
  });
}
