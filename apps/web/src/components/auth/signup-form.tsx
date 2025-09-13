"use client";

import { Suspense } from "react";
import { signInWithGoogle } from "~/lib/sign-in";
import { Button } from "@prism/ui/components/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@prism/ui/components/card";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpWithEmail } from "~/lib/sign-in";
import { Input } from "@prism/ui/components/input";
import React from "react";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignUpContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle(callbackUrl || undefined);

      // Wait a moment for the session to be updated
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get user info from the session
      const session = await fetch("/api/auth/session").then((res) =>
        res.json()
      );

      if (session?.user?.name && session?.user?.email) {
        console.log("Signed in successfully!");
      } else {
        console.error("Missing user data in session:", {
          session,
          hasName: !!session?.user?.name,
          hasEmail: !!session?.user?.email,
        });
        console.log(
          "Warning: Signed in successfully, but could not get your profile information."
        );
      }

      // Wait a moment to ensure the user sees any toast messages
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to the onboarding page
      window.location.href = "/onboarding";
    } catch (error) {
      console.error("Unexpected error during sign up:", error);
    }
  };

  const handleEmailSignUp = async (values: SignupFormValues) => {
    setError(null);
    setIsLoading(true);
    try {
      await signUpWithEmail({
        ...values,
        callbackURL: callbackUrl || "/onboarding",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-form">
      <CardHeader className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">
          Choose your preferred sign up method
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form
          onSubmit={form.handleSubmit(handleEmailSignUp)}
          className="grid gap-4"
        >
          <Input
            type="text"
            placeholder="Name"
            {...form.register("name")}
            disabled={isLoading}
            autoComplete="name"
          />
          <Input
            type="email"
            placeholder="Email"
            {...form.register("email")}
            disabled={isLoading}
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            {...form.register("password")}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing up..." : "Sign up with Email"}
          </Button>
          {error && <div className="text-sm text-red-500">{error}</div>}
        </form>
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleGoogleSignUp}
          className="w-full"
        >
          <FcGoogle className="mr-2 h-4 w-4" />
          Sign up with Google
        </Button>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/login`}
            className="text-primary underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function SignUpForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
