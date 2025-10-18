import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  AuthServiceError,
  EmailNotConfirmedError,
} from "@/lib/errors/auth.errors";

type SupabaseServerClient = SupabaseClient<Database>;

/**
 * Sign up a new user with email and password.
 * Throws EmailAlreadyRegisteredError if email is already in use.
 * Throws AuthServiceError for other Supabase errors.
 */
export async function signUp(supabase: SupabaseServerClient, email: string, password: string, emailRedirectTo: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    // Check if an email is already registered
    if (error.message.includes("already registered") || error.message.includes("User already registered")) {
      throw new EmailAlreadyRegisteredError();
    }
    throw new AuthServiceError(error.message);
  }

  return data;
}

/**
 * Sign in an existing user with email and password.
 * Throws EmailNotConfirmedError if email is not confirmed.
 * Throws InvalidCredentialsError if credentials are invalid.
 * Throws AuthServiceError for other Supabase errors.
 */
export async function signIn(supabase: SupabaseServerClient, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Check if email is not confirmed
    if (error.message.includes("Email not confirmed")) {
      throw new EmailNotConfirmedError();
    }
    // Invalid credentials or other auth errors
    throw new InvalidCredentialsError();
  }

  if (!data.user) {
    throw new InvalidCredentialsError();
  }

  return data;
}

/**
 * Resend verification email to the current session's user.
 * Throws AuthServiceError if resend fails.
 */
export async function resendVerification(supabase: SupabaseServerClient) {
  // Get current user's email from session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new AuthServiceError("No authenticated user found");
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
  });

  if (error) {
    throw new AuthServiceError(error.message);
  }
}

/**
 * Sign out the current user.
 * Throws AuthServiceError if sign-out fails.
 */
export async function signOut(supabase: SupabaseServerClient) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthServiceError(error.message);
  }
}
