"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2Icon, LogInIcon, UserPlusIcon } from "lucide-react";

type AuthMode = "signin" | "signup";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, signInWithGoogle, signInWithGitHub } = useAuth();

  const nextPath = searchParams.get("next") ?? "/";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(
    callbackError === "auth_callback_failed"
      ? "Sign in failed. Please try again."
      : "",
  );
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    const { error: googleError } = await signInWithGoogle(nextPath);
    if (googleError) {
      setError(googleError.message);
      setGoogleLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setError("");
    setGithubLoading(true);
    const { error: githubError } = await signInWithGitHub(nextPath);
    if (githubError) {
      setError(githubError.message);
      setGithubLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (mode === "signin") {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message);
        setSubmitting(false);
        return;
      }
      router.push(nextPath);
      router.refresh();
    } else {
      const { error: signUpError, session } = await signUp(
        email,
        password,
        fullName,
      );
      if (signUpError) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }
      if (session) {
        router.push(nextPath);
        router.refresh();
      } else {
        setSuccess(
          "Check your email for a confirmation link to activate your account.",
        );
        setEmail("");
        setPassword("");
        setFullName("");
        setSubmitting(false);
      }
    }
  };

  const isLoading = submitting || googleLoading || githubLoading;

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl">
          {mode === "signin" ? "Welcome back" : "Create an account"}
        </CardTitle>
        <CardDescription className="text-base">
          {mode === "signin"
            ? "Sign in to track prices and save wishlists"
            : "Join Thamani to compare prices across retailers"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-medium shadow-sm hover:shadow-md transition-shadow"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
        >
          {googleLoading ? (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-medium shadow-sm hover:shadow-md transition-shadow"
          disabled={isLoading}
          onClick={handleGitHubSignIn}
        >
          {githubLoading ? (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GitHubIcon className="mr-2 h-4 w-4" />
          )}
          Continue with GitHub
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full name
              </label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={isLoading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              required
              minLength={mode === "signup" ? 8 : 6}
              disabled={isLoading}
              className="h-11"
            />
            {mode === "signup" && (
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            )}
          </div>

          {error && (
            <p
              className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
              role="alert"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              className="text-sm text-green-600 dark:text-green-400 bg-green-600/10 p-3 rounded-lg"
              role="status"
            >
              {success}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-11 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            disabled={isLoading}
          >
            {submitting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </>
            ) : mode === "signin" ? (
              <>
                <LogInIcon className="mr-2 h-4 w-4" />
                Sign in
              </>
            ) : (
              <>
                <UserPlusIcon className="mr-2 h-4 w-4" />
                Create account
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-border/50 bg-transparent pt-6">
        <p className="text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link
                href={`/register${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
                className="font-medium text-foreground underline-offset-4 hover:underline hover:text-primary transition-colors"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href={`/login${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
                className="font-medium text-foreground underline-offset-4 hover:underline hover:text-primary transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}
