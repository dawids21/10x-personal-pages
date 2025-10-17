import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploadButton } from "@/components/shared/FileUploadButton";
import { ErrorList } from "@/components/shared/ErrorList";
import { useFileUpload } from "@/components/dashboard/hooks/useFileUpload";
import type { UpdatePageDataCommand } from "@/types";
import { useToast } from "@/components/dashboard/hooks/useToast.ts";

export function PageContentCard() {
  const uploadApiCall = async (fileContent: string) => {
    return fetch("/api/pages/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: fileContent } as UpdatePageDataCommand),
    });
  };

  const {
    upload: handleUploadYaml,
    isUploading,
    errors: uploadErrors,
    clearErrors,
  } = useFileUpload(uploadApiCall, "Page data updated successfully", "Failed to upload page data. Please try again.");
  const { showError } = useToast();

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/templates/page");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Failed to download template" } }));
        const message = errorData.error?.message || "Failed to download template";

        if (response.status === 401) {
          // Authentication error - user should re-login
          window.location.href = "/";
          return;
        }

        // eslint-disable-next-line no-console
        console.error("Error downloading template:", message);
        showError(message);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "page-template.yaml";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error("Error downloading template:", error);
      showError(error instanceof Error ? error.message : "Failed to download template. Please try again.");
    }
  };

  const handleDownloadCurrentYaml = async () => {
    try {
      const response = await fetch("/api/pages/data");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Failed to download page data" } }));
        const message = errorData.error?.message || "Failed to download page data";

        if (response.status === 401) {
          // Authentication error - user should re-login
          window.location.href = "/";
          return;
        }

        if (response.status === 404) {
          // Page not found or no data
          showError("No page data available to download. Please upload content first.");
          return;
        }

        // eslint-disable-next-line no-console
        console.error("Error downloading current YAML:", message);
        showError(message);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "page-data.yaml";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error downloading current YAML:", error);
      alert(error instanceof Error ? error.message : "Failed to download page data. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Content</CardTitle>
        <CardDescription>
          Manage your page content using YAML files. Download the template to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            Download Template
          </Button>
          <Button variant="outline" onClick={handleDownloadCurrentYaml}>
            Download Current YAML
          </Button>
          <div data-testid="upload-page-yaml-button">
            <FileUploadButton onUpload={handleUploadYaml} accept=".yaml,.yml" disabled={isUploading}>
              Upload YAML
            </FileUploadButton>
          </div>
        </div>

        {uploadErrors && uploadErrors.length > 0 && <ErrorList errors={uploadErrors} onClear={clearErrors} />}

        <p className="text-sm text-muted-foreground">
          Edit your YAML file offline and upload it here to update your page content. All changes will be reflected on
          your public page immediately.
        </p>
      </CardContent>
    </Card>
  );
}
