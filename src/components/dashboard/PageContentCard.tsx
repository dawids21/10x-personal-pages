import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploadButton } from "@/components/shared/FileUploadButton";
import { ErrorList } from "@/components/shared/ErrorList";
import { useFileUpload } from "@/components/dashboard/hooks/useFileUpload";
import type { UpdatePageDataCommand } from "@/types";

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

  const handleDownloadTemplate = () => {
    window.location.href = "/api/templates/page";
  };

  const handleDownloadCurrentYaml = () => {
    window.location.href = "/api/pages/data";
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
          <FileUploadButton onUpload={handleUploadYaml} accept=".yaml,.yml" disabled={isUploading}>
            Upload YAML
          </FileUploadButton>
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
