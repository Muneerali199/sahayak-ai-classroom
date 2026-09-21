"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";
import {
  generateQuiz,
  type GenerateQuizOutput,
} from "@/ai/flows/quiz-generator";
import { recordResult } from "@/lib/progress-store";
import { CheckCircle2, XCircle, ListChecks, RotateCcw } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters."),
  gradeLevel: z.string().min(1, "Please enter a grade level."),
  numberOfQuestions: z.string().min(1, "Choose how many questions."),
  difficulty: z.string().min(1, "Choose a difficulty."),
  localLanguage: z.string().min(1, "Please select a language."),
});

type FormValues = z.infer<typeof formSchema>;

export default function QuizGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [quiz, setQuiz] = React.useState<GenerateQuizOutput | null>(null);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      gradeLevel: "",
      numberOfQuestions: "5",
      difficulty: "medium",
      localLanguage: "English",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    try {
      const response = await generateQuiz({
        topic: values.topic,
        gradeLevel: values.gradeLevel,
        numberOfQuestions: Number(values.numberOfQuestions),
        difficulty: values.difficulty,
        localLanguage: values.localLanguage,
      });
      setQuiz(response);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate the quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const score = quiz
    ? quiz.questions.reduce(
        (s, q, i) => s + (answers[i] === q.correctIndex ? 1 : 0),
        0
      )
    : 0;

  function handleSubmit() {
    if (!quiz) return;
    setSubmitted(true);
    const values = form.getValues();
    recordResult({
      subject: values.topic,
      kind: "quiz",
      score,
      total: quiz.questions.length,
      label: `${values.topic} · ${values.difficulty} quiz`,
    });
    toast({
      title: `Score: ${score}/${quiz.questions.length}`,
      description: "Saved to the Student Progress Dashboard.",
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-violet-400" />
                AI Quiz Generator
              </CardTitle>
              <CardDescription>
                Generate a classroom-ready multiple-choice quiz in seconds, then
                project it and let students answer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Fractions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5th Grade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Questions</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["3", "5", "8", "10"].map((n) => (
                            <SelectItem key={n} value={n}>
                              {n} questions
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="localLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Marathi">Marathi</SelectItem>
                        <SelectItem value="Bengali">Bengali</SelectItem>
                        <SelectItem value="Tamil">Tamil</SelectItem>
                        <SelectItem value="Telugu">Telugu</SelectItem>
                        <SelectItem value="Gujarati">Gujarati</SelectItem>
                        <SelectItem value="Kannada">Kannada</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader className="mr-2" />}
                Generate Quiz
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Loader size="lg" className="mb-4" />
            <p className="text-muted-foreground">
              Writing questions... this may take a moment.
            </p>
          </CardContent>
        </Card>
      )}

      {quiz && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="font-headline">{quiz.title}</CardTitle>
                <CardDescription>
                  {quiz.questions.length} questions
                  {submitted && ` · Score: ${score}/${quiz.questions.length}`}
                </CardDescription>
              </div>
              {submitted && (
                <Badge
                  variant={score / quiz.questions.length >= 0.6 ? "default" : "destructive"}
                >
                  {Math.round((score / quiz.questions.length) * 100)}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.questions.map((q, i) => {
              const chosen = answers[i];
              const isCorrect = submitted && chosen === q.correctIndex;
              return (
                <div key={i} className="rounded-lg border border-white/10 p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-xs font-semibold text-violet-300 pt-0.5">
                      Q{i + 1}
                    </span>
                    <p className="font-medium">{q.question}</p>
                    {submitted &&
                      (isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ))}
                  </div>
                  <RadioGroup
                    value={chosen !== undefined ? String(chosen) : undefined}
                    onValueChange={(v) =>
                      !submitted &&
                      setAnswers((a) => ({ ...a, [i]: Number(v) }))
                    }
                    className="space-y-2"
                  >
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={
                          "flex items-center gap-2 rounded-md px-2 py-1.5 " +
                          (submitted && oi === q.correctIndex
                            ? "bg-emerald-500/10 text-emerald-200"
                            : submitted && oi === chosen
                              ? "bg-rose-500/10 text-rose-200"
                              : "")
                        }
                      >
                        <RadioGroupItem value={String(oi)} id={`q${i}-o${oi}`} />
                        <label
                          htmlFor={`q${i}-o${oi}`}
                          className="text-sm cursor-pointer"
                        >
                          {opt}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                  {submitted && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
          <CardFooter className="gap-3">
            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < quiz.questions.length}
              >
                Submit Answers
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
