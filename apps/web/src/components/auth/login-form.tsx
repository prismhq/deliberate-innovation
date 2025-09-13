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
import { signInWithEmail } from "~/lib/sign-in";
import { Input } from "@prism/ui/components/input";
import React from "react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(callbackUrl || undefined);
      // We'll identify the user after successful login in the auth callback
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleEmailSignIn = async (values: LoginFormValues) => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithEmail({
        ...values,
        callbackURL: callbackUrl || "/workspace",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-form">
      <CardHeader className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Choose your preferred sign in method
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form
          onSubmit={form.handleSubmit(handleEmailSignIn)}
          className="grid gap-4"
        >
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
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in with Email"}
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
          onClick={handleGoogleSignIn}
          className="w-full"
        >
          <FcGoogle className="mr-2 h-4 w-4" />
          Sign in with Google
        </Button>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup`}
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign Up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
