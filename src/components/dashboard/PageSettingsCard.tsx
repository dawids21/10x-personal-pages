import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/dashboard/hooks/useToast";
import type { PageSettingsCardProps } from "@/components/dashboard/dashboard.types";
import type { UpdatePageUrlCommand, UpdatePageThemeCommand } from "@/types";

const AVAILABLE_THEMES = [
  { value: "ocean", label: "Ocean" },
  { value: "earth", label: "Earth" },
];

export function PageSettingsCard({ page: initialPage, baseUrl }: PageSettingsCardProps) {
  const [page, setPage] = useState(initialPage);
  const [url, setUrl] = useState(page.url);
  const [theme, setTheme] = useState(page.theme);
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fullUrl = `${baseUrl}/page/${page.url}`;

  const handleUrlUpdate = async () => {
    if (url === page.url) return;

    try {
      setIsUpdatingUrl(true);
      setUrlError(null);

      const response = await fetch("/api/pages/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url } as UpdatePageUrlCommand),
      });

      if (!response.ok) {
        const errorData = await response.json();
        switch (errorData.error?.code) {
          case "VALIDATION_ERROR":
            setUrlError("Invalid URL format");
            break;
          case "URL_ALREADY_TAKEN":
            setUrlError("This URL is already in use");
            break;
          case "RESERVED_URL":
            setUrlError("This URL is reserved and cannot be used");
            break;
          default:
            setUrlError(errorData.error?.message || "Failed to update URL");
        }
        return;
      }

      const result = await response.json();
      setPage({ ...page, url: result.url });
      showSuccess("URL updated successfully");
    } catch (err) {
      showError("Failed to update URL. Please try again.");
      //eslint-disable-next-line no-console
      console.error("URL update error:", err);
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  const handleThemeUpdate = async () => {
    if (theme === page.theme) return;

    try {
      setIsUpdatingTheme(true);
      setThemeError(null);

      const response = await fetch("/api/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme } as UpdatePageThemeCommand),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setThemeError(errorData.error?.message || "Failed to update theme");
        return;
      }

      const updatedPage = await response.json();
      setPage({ ...page, theme: updatedPage.theme });
      showSuccess("Theme updated successfully");
    } catch (err) {
      showError("Failed to update theme. Please try again.");
      //eslint-disable-next-line no-console
      console.error("Theme update error:", err);
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Settings</CardTitle>
        <CardDescription>Configure your page URL and theme</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Section */}
        <div className="space-y-2">
          <label htmlFor="page-url" className="text-sm font-medium">
            Page URL
          </label>
          <div className="flex gap-2">
            <Input
              id="page-url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              placeholder="your-page-url"
              className={urlError ? "border-destructive" : ""}
              data-testid="url-input"
            />
            <Button
              onClick={handleUrlUpdate}
              disabled={isUpdatingUrl || url === page.url}
              data-testid="update-url-button"
            >
              {isUpdatingUrl ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating...
                </>
              ) : (
                "Update URL"
              )}
            </Button>
          </div>
          {urlError && (
            <p className="text-sm text-destructive" role="alert" data-testid="url-error">
              {urlError}
            </p>
          )}
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
            data-testid="public-page-link"
          >
            {fullUrl}
          </a>
        </div>

        {/* Theme Section */}
        <div className="space-y-2">
          <label htmlFor="page-theme" className="text-sm font-medium">
            Theme
          </label>
          <div className="flex gap-2">
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="page-theme" className="flex-1" data-testid="theme-select">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_THEMES.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    {theme.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleThemeUpdate}
              disabled={isUpdatingTheme || theme === page.theme}
              data-testid="save-theme-button"
            >
              {isUpdatingTheme ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                "Save Theme"
              )}
            </Button>
          </div>
          {themeError && (
            <p className="text-sm text-destructive" role="alert" data-testid="theme-error">
              {themeError}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
