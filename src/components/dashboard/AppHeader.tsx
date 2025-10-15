import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Redirect to landing page regardless of response status
      // (clear client state even if server-side logout fails)
      window.location.href = "/";
    } catch {
      // Network error - still redirect to clear client state
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background" role="banner">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="/" className="text-xl font-bold">
          Personal Pages
        </a>
        <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut} aria-busy={isLoggingOut}>
          {isLoggingOut ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Logging out...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
