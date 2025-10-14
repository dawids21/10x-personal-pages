import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // Auth API endpoints
  "/api/auth/sign-up",
  "/api/auth/sign-in",
  "/api/auth/resend-verification",
  "/api/auth/sign-out",
  // Add other public paths as needed (e.g., landing page, public pages)
  "/",
  "/page/*",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create a Supabase server instance with cookie support
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Make supabase available to all routes via locals
  locals.supabase = supabase;

  // Check if a path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => {
    if (path.endsWith("/*")) {
      return url.pathname.startsWith(path.slice(0, -2));
    }
    return url.pathname === path;
  });

  if (isPublicPath) {
    return next();
  }

  // Get user session for protected routes
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  } else {
    // Redirect to log in for protected routes
    return redirect("/auth/login");
  }

  return next();
});
