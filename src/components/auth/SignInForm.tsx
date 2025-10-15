import { useState, useRef, type FormEvent } from "react";
import { signInSchema } from "@/lib/validators/auth.validators.ts";
import type { SignInCommand, ErrorResponse } from "@/types.ts";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate with Zod
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errors);

      // Focus first invalid field
      if (errors.email) {
        emailInputRef.current?.focus();
      } else if (errors.password) {
        passwordInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: result.data.email,
          password: result.data.password,
        } satisfies SignInCommand),
      });

      if (response.ok) {
        // Success - navigate to dashboard
        window.location.href = "/app";
        return;
      }

      // Handle error responses
      if (response.status === 401) {
        setError("Invalid email or password");
      } else if (response.status === 500) {
        setError("An unexpected error occurred. Please try again.");
      } else {
        // Try to parse error response
        try {
          const errorData: ErrorResponse = await response.json();
          setError(errorData.error.message);
        } catch {
          setError("An unexpected error occurred. Please try again.");
        }
      }
    } catch {
      // Network error
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { email: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <div role="tabpanel" id="signin-panel" aria-labelledby="signin-tab" aria-busy={isSubmitting}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            ref={emailInputRef}
            id="signin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            disabled={isSubmitting}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "signin-email-error" : undefined}
            className={fieldErrors.email ? "border-red-500" : ""}
          />
          {fieldErrors.email && (
            <p id="signin-email-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signin-password">Password</Label>
          <Input
            ref={passwordInputRef}
            id="signin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            disabled={isSubmitting}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? "signin-password-error" : undefined}
            className={fieldErrors.password ? "border-red-500" : ""}
          />
          {fieldErrors.password && (
            <p id="signin-password-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20" role="alert" aria-live="polite">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full" aria-busy={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </div>
  );
}
