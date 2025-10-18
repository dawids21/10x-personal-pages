import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InlineEditText } from "@/components/shared/InlineEditText";
import { FileUploadButton } from "@/components/shared/FileUploadButton";
import { ErrorList } from "@/components/shared/ErrorList";
import { ReorderControls } from "@/components/shared/ReorderControls";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/dashboard/hooks/useToast";
import { useFileUpload } from "@/components/dashboard/hooks/useFileUpload";
import type { ProjectListItemProps } from "@/components/dashboard/dashboard.types";
import type { UpdateProjectNameCommand, UpdateProjectDataCommand } from "@/types";
import { downloadFile } from "@/lib/download-helper";

export function ProjectListItem({
  project,
  canMoveUp,
  canMoveDown,
  onReorderUp,
  onReorderDown,
  onUpdate,
  onDelete,
}: ProjectListItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSuccess, showError } = useToast();

  const uploadApiCall = async (fileContent: string) => {
    return fetch(`/api/projects/${project.project_id}/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: fileContent } as UpdateProjectDataCommand),
    });
  };

  const {
    upload: handleUploadYaml,
    isUploading,
    errors: uploadErrors,
    clearErrors,
  } = useFileUpload(
    uploadApiCall,
    "Project data updated successfully",
    "Failed to upload project data. Please try again."
  );

  const handleNameSave = async (newName: string) => {
    const response = await fetch(`/api/projects/${project.project_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_name: newName } as UpdateProjectNameCommand),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to update project name");
    }

    const updatedProject = await response.json();
    onUpdate(updatedProject);
    showSuccess("Project renamed successfully");
  };

  const handleDownloadTemplate = async () => {
    await downloadFile("/api/templates/project", "project-template.yaml", showError);
  };

  const handleDownloadYaml = async () => {
    await downloadFile(`/api/projects/${project.project_id}/data`, `${project.project_name}-data.yaml`, showError);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/projects/${project.project_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        showError("Failed to delete project. Please try again.");
        return;
      }

      onDelete(project.project_id);
      showSuccess("Project deleted successfully");
      setShowDeleteConfirm(false);
    } catch (err) {
      showError("Failed to delete project. Please try again.");
      //eslint-disable-next-line no-console
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card data-testid={`project-list-item-${project.project_id}`}>
        <CardContent className="pt-2">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <InlineEditText
                  value={project.project_name}
                  onSave={handleNameSave}
                  placeholder="Project name"
                  maxLength={100}
                  required
                  aria-label={`Edit project name: ${project.project_name}`}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="default" onClick={handleDownloadTemplate}>
                  Download Template
                </Button>
                <Button variant="outline" size="default" onClick={handleDownloadYaml}>
                  Download YAML
                </Button>
                <div data-testid="upload-project-yaml-button">
                  <FileUploadButton
                    onUpload={handleUploadYaml}
                    accept=".yaml,.yml"
                    disabled={isUploading}
                    className="h-9"
                  >
                    Upload YAML
                  </FileUploadButton>
                </div>
                <Button variant="destructive" size="default" onClick={() => setShowDeleteConfirm(true)}>
                  Delete
                </Button>
              </div>

              {uploadErrors && uploadErrors.length > 0 && (
                <div data-testid="project-validation-errors">
                  <ErrorList errors={uploadErrors} onClear={clearErrors} />
                </div>
              )}
            </div>

            <ReorderControls
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={onReorderUp}
              onMoveDown={onReorderDown}
              itemLabel={project.project_name}
            />
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={`Delete ${project.project_name}?`}
        message="This action cannot be undone. The project and all its data will be permanently deleted."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
