'use server';

/**
 * AI-powered quiz generator, via Groq.
 */

import {groqJson} from '@/ai/groq';
import {z} from 'zod';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz.'),
  gradeLevel: z.string().describe('The grade level for the quiz.'),
  numberOfQuestions: z.number().describe('How many questions to generate.'),
  difficulty: z.string().describe('easy, medium or hard'),
  localLanguage: z.string().describe('The language for the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).describe('Exactly four answer options.'),
  correctIndex: z.number().describe('Index (0-3) of the correct option.'),
  explanation: z.string().describe('Why the correct answer is right.'),
});

const GenerateQuizOutputSchema = z.object({
  title: z.string().describe('The quiz title.'),
  questions: z.array(QuizQuestionSchema).describe('The generated questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return groqJson({
    system: 'You are an expert teacher creating classroom quizzes for Indian schools.',
    prompt:
      `Create a ${input.difficulty} quiz with ${input.numberOfQuestions} multiple-choice questions in ${input.localLanguage} (native script) for:\n` +
      `Topic: ${input.topic}\nGrade: ${input.gradeLevel}\n\n` +
      'Each question must have exactly 4 plausible options, one correct answer, and a one-sentence explanation. ' +
      'Return JSON: {"title": string, "questions": [{"question": string, "options": [string, string, string, string], "correctIndex": number, "explanation": string}]}',
    schema: GenerateQuizOutputSchema,
    maxTokens: 3000,
  });
}
