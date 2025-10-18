import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploadButton } from "@/components/shared/FileUploadButton";
import { ErrorList } from "@/components/shared/ErrorList";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { useToast } from "@/components/dashboard/hooks/useToast";
import { isErrorResponse, getValidationErrors } from "@/components/dashboard/dashboard.types";
import type { CreatePageCommand, ErrorResponse, ValidationErrorDetail, Theme } from "@/types";
import { Toaster } from "sonner";
import { downloadFile } from "@/lib/download-helper";

interface InitialPageSetupProps {
  baseUrl: string;
}

interface FormState {
  url: string;
  theme: Theme;
  yamlContent: string;
}

interface SubmissionState {
  isSubmitting: boolean;
  serverErrors: ValidationErrorDetail[] | null;
  urlError: string | null;
  generalError: string | null;
}

const AVAILABLE_THEMES = [
  { value: "ocean", label: "Ocean" },
  { value: "earth", label: "Earth" },
];

export function InitialPageSetup({ baseUrl }: InitialPageSetupProps) {
  const [formState, setFormState] = useState<FormState>({
    url: "",
    theme: "ocean",
    yamlContent: "",
  });

  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    serverErrors: null,
    urlError: null,
    generalError: null,
  });

  const { showSuccess, showError } = useToast();

  const fullUrl = `${baseUrl}/page/${formState.url || "{your-url}"}`;

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, url: e.target.value }));
    // Clear errors on input
    setSubmissionState((prev) => ({
      ...prev,
      urlError: null,
      serverErrors: null,
      generalError: null,
    }));
  };

  const handleThemeChange = (value: string) => {
    setFormState((prev) => ({ ...prev, theme: value as Theme }));
  };

  const handleYamlUpload = async (fileContent: string) => {
    setFormState((prev) => ({ ...prev, yamlContent: fileContent }));
    setSubmissionState((prev) => ({ ...prev, serverErrors: null }));
  };

  const handleDownloadTemplate = async () => {
    await downloadFile("/api/templates/page", "page-template.yaml", showError);
  };

  const clearErrors = () => {
    setSubmissionState((prev) => ({ ...prev, serverErrors: null }));
  };

  const handleCreatePage = async () => {
    // Basic empty check
    if (!formState.url.trim()) {
      setSubmissionState((prev) => ({
        ...prev,
        urlError: "Please enter a URL for your page",
      }));
      return;
    }

    setSubmissionState((prev) => ({ ...prev, isSubmitting: true }));

    const command: CreatePageCommand = {
      url: formState.url,
      theme: formState.theme,
      ...(formState.yamlContent && { data: formState.yamlContent }),
    };

    try {
      const response = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();

        // Handle URL conflicts
        if (errorData.error.code === "URL_ALREADY_TAKEN" || errorData.error.code === "RESERVED_URL") {
          setSubmissionState((prev) => ({
            ...prev,
            isSubmitting: false,
            urlError: errorData.error.message,
          }));
          return;
        }

        // Handle YAML validation errors
        if (response.status === 400 && isErrorResponse(errorData)) {
          if (errorData.error.code === "INVALID_YAML" || errorData.error.code === "VALIDATION_ERROR") {
            setSubmissionState((prev) => ({
              ...prev,
              isSubmitting: false,
              serverErrors: getValidationErrors(errorData),
            }));
            showError(errorData.error.message || "Failed to create page. Please fix the errors and try again.");
            return;
          }
        }

        // General error
        setSubmissionState((prev) => ({
          ...prev,
          isSubmitting: false,
          generalError: errorData.error.message,
        }));
        showError(errorData.error.message || "Failed to create page. Please try again.");
        return;
      }

      // Success
      await response.json();
      showSuccess("Your page has been created successfully!");

      // Navigate to dashboard after delay
      setTimeout(() => {
        window.location.href = "/app";
      }, 1500);
    } catch (err) {
      setSubmissionState((prev) => ({
        ...prev,
        isSubmitting: false,
        generalError: "Network error. Please check your connection.",
      }));
      showError("Failed to create page. Please try again.");
      // eslint-disable-next-line no-console
      console.error("Page creation error:", err);
    }
  };

  return (
    <>
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Create Your Personal Page</CardTitle>
            <CardDescription>
              Set up your page URL and theme. You can optionally upload your YAML content now or add it later from the
              dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* URL Section */}
            <div className="space-y-2">
              <Label htmlFor="page-url">Page URL</Label>
              <Input
                id="page-url"
                type="text"
                value={formState.url}
                onChange={handleUrlChange}
                placeholder="your-page-url"
                className={submissionState.urlError ? "border-destructive" : ""}
                disabled={submissionState.isSubmitting}
                aria-invalid={!!submissionState.urlError}
                aria-describedby={submissionState.urlError ? "url-error" : "url-preview"}
                data-testid="url-input"
              />
              {submissionState.urlError && (
                <p id="url-error" className="text-sm text-destructive" role="alert" data-testid="url-error">
                  {submissionState.urlError}
                </p>
              )}
              <p id="url-preview" className="text-sm text-muted-foreground">
                Your page will be available at: <span className="font-medium text-foreground">{fullUrl}</span>
              </p>
            </div>

            {/* Theme Section */}
            <div className="space-y-2">
              <Label htmlFor="page-theme">Theme</Label>
              <Select value={formState.theme} onValueChange={handleThemeChange} disabled={submissionState.isSubmitting}>
                <SelectTrigger id="page-theme" aria-describedby="theme-description" data-testid="theme-select">
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
              <p id="theme-description" className="text-sm text-muted-foreground">
                Choose a visual theme for your page
              </p>
            </div>

            {/* YAML Upload Section */}
            <div className="space-y-2">
              <Label>Page Content (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Upload your YAML file now or skip this step and add it later from the dashboard.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  disabled={submissionState.isSubmitting}
                >
                  Download Template
                </Button>
                <div data-testid="upload-page-yaml-button">
                  <FileUploadButton
                    onUpload={handleYamlUpload}
                    accept=".yaml,.yml"
                    disabled={submissionState.isSubmitting}
                  >
                    Upload YAML
                  </FileUploadButton>
                </div>
              </div>
              {formState.yamlContent && (
                <p className="text-sm text-muted-foreground" role="status">
                  ✓ YAML file loaded ({formState.yamlContent.length} characters)
                </p>
              )}
            </div>

            {/* Validation Errors */}
            {submissionState.serverErrors && submissionState.serverErrors.length > 0 && (
              <ErrorList errors={submissionState.serverErrors} onClear={clearErrors} />
            )}
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleCreatePage}
              disabled={submissionState.isSubmitting || !formState.url.trim()}
              className="w-full"
              data-testid="create-page-button"
            >
              {submissionState.isSubmitting ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Page"
              )}
            </Button>
          </CardFooter>
        </Card>
      </main>
      <Toaster position="bottom-right" />
    </>
  );
}
