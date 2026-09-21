'use server';

/**
 * AI-powered career guidance for students, via Groq.
 */

import {groqJson} from '@/ai/groq';
import {z} from 'zod';

const GetCareerGuidanceInputSchema = z.object({
  gradeLevel: z.string().describe('The student\'s current grade/class.'),
  interests: z.string().describe('What the student enjoys doing.'),
  strengths: z.string().describe('Subjects or skills the student is good at.'),
  localLanguage: z.string().describe('The language for the guidance.'),
});
export type GetCareerGuidanceInput = z.infer<typeof GetCareerGuidanceInputSchema>;

const CareerPathSchema = z.object({
  title: z.string().describe('Career or profession name.'),
  whyItFits: z.string().describe('Why this suits the student, referencing their interests/strengths.'),
  subjectsToFocus: z.array(z.string()).describe('School subjects to focus on now.'),
  pathAfterSchool: z.string().describe('Indian courses, entrance exams and degrees needed.'),
  salaryRange: z.string().describe('Typical starting salary range in India.'),
  nextSteps: z.array(z.string()).describe('3 concrete next steps for this student.'),
});

const GetCareerGuidanceOutputSchema = z.object({
  summary: z.string().describe('Encouraging overall guidance summary.'),
  careers: z.array(CareerPathSchema).describe('Three recommended career paths.'),
});
export type GetCareerGuidanceOutput = z.infer<typeof GetCareerGuidanceOutputSchema>;

export async function getCareerGuidance(input: GetCareerGuidanceInput): Promise<GetCareerGuidanceOutput> {
  return groqJson({
    system: 'You are a warm, practical career counsellor for Indian school students from diverse backgrounds.',
    prompt:
      `Give career guidance in ${input.localLanguage} (native script) for a student:\n` +
      `Grade: ${input.gradeLevel}\nInterests: ${input.interests}\nStrengths: ${input.strengths}\n\n` +
      'Recommend exactly 3 realistic career paths. For each: title, whyItFits (reference their interests), subjectsToFocus (3-5), ' +
      'pathAfterSchool (Indian courses/exams/degrees), salaryRange (INR starting range), nextSteps (3 concrete actions). ' +
      'Also give one encouraging summary paragraph. ' +
      'Return JSON: {"summary": string, "careers": [{"title": string, "whyItFits": string, "subjectsToFocus": [string], "pathAfterSchool": string, "salaryRange": string, "nextSteps": [string]}]}',
    schema: GetCareerGuidanceOutputSchema,
    maxTokens: 3000,
  });
}
