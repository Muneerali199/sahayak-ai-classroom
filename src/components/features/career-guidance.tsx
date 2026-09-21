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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";
import {
  getCareerGuidance,
  type GetCareerGuidanceOutput,
} from "@/ai/flows/career-guidance";
import { Compass, GraduationCap, IndianRupee, Target } from "lucide-react";

const formSchema = z.object({
  gradeLevel: z.string().min(1, "Please enter a grade level."),
  interests: z.string().min(5, "Tell us a little about the student's interests."),
  strengths: z.string().min(3, "Mention at least one strength."),
  localLanguage: z.string().min(1, "Please select a language."),
});

type FormValues = z.infer<typeof formSchema>;

export default function CareerGuidance() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<GetCareerGuidanceOutput | null>(
    null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gradeLevel: "",
      interests: "",
      strengths: "",
      localLanguage: "English",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await getCareerGuidance(values);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate career guidance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Compass className="w-5 h-5 text-violet-400" />
                Career Guidance
              </CardTitle>
              <CardDescription>
                Practical, India-specific career paths for a student based on
                their interests and strengths.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 9th Grade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Loves drawing, fixing things around the house, watching science videos..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="strengths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strengths</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Strong in maths, good at explaining"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardContent>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader className="mr-2" />}
                Get Career Guidance
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Loader size="lg" className="mb-4" />
            <p className="text-muted-foreground">
              Mapping career paths... this may take a moment.
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <Card className="border-violet-500/30 bg-violet-500/5">
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed text-violet-100">
                {result.summary}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            {result.careers.map((career, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Compass className="w-4 h-4 text-violet-400 shrink-0" />
                    {career.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {career.whyItFits}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm flex-1">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-violet-300" />
                      Focus subjects
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {career.subjectsToFocus.map((s, si) => (
                        <Badge key={si} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-violet-300" />
                      After school
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {career.pathAfterSchool}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-violet-300" />
                      Starting salary
                    </h4>
                    <p className="text-muted-foreground">{career.salaryRange}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Next steps</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {career.nextSteps.map((step, si) => (
                        <li key={si}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
