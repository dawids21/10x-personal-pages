import { Button } from "@/components/ui/button";

export function AppHeader() {
  const handleLogout = async () => {
    //TODO logout
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background" role="banner">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="/" className="text-xl font-bold">
          Personal Pages
        </a>
        <Button variant="outline" onClick={handleLogout}>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </Button>
      </div>
    </header>
  );
}
