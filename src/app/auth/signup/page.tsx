"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  companyName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const isInvitation = callbackUrl?.includes("/invitations/accept");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // If coming from an invitation, skip company creation
      const requestBody: any = {
        name: data.name,
        email: data.email,
        password: data.password,
        country: "US",
        currency: "USD",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Only include companyName if provided and not from invitation
      if (data.companyName && !isInvitation) {
        requestBody.companyName = data.companyName;
      }

      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Registration failed");
      }

      // Registration successful
      if (callbackUrl) {
        // If there's a callback URL (like an invitation), redirect there
        router.push(callbackUrl);
      } else {
        // Otherwise, redirect to signin
        router.push("/auth/signin?registered=true");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-3 sm:px-4 py-6 sm:py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl font-bold">Create an account</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isInvitation
              ? "Create your account to accept the team invitation"
              : "Enter your information to create your account and company"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            {error && (
              <div className="bg-destructive/15 text-destructive text-xs sm:text-sm p-2.5 sm:p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-sm">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name")}
                disabled={isLoading}
                className="h-9 sm:h-10 text-sm"
              />
              {errors.name && (
                <p className="text-xs sm:text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                disabled={isLoading}
                className="h-9 sm:h-10 text-sm"
              />
              {errors.email && (
                <p className="text-xs sm:text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
                className="h-9 sm:h-10 text-sm"
              />
              {errors.password && (
                <p className="text-xs sm:text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                disabled={isLoading}
                className="h-9 sm:h-10 text-sm"
              />
              {errors.confirmPassword && (
                <p className="text-xs sm:text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {!isInvitation && (
              <div className="border-t pt-3 sm:pt-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="companyName" className="text-sm">Company Name</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Acme Gift Cards"
                    {...register("companyName")}
                    disabled={isLoading}
                    className="h-9 sm:h-10 text-sm"
                  />
                  {errors.companyName && (
                    <p className="text-xs sm:text-sm text-destructive">{errors.companyName.message}</p>
                  )}
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Your first company will be created automatically
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <Button type="submit" className="w-full h-9 sm:h-10 text-sm sm:text-base" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-xs sm:text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={callbackUrl ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/signin"}
                className="text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-3">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
