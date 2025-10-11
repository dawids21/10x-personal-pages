import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/dashboard/hooks/useToast";
import type { CreateProjectModalProps } from "@/components/dashboard/dashboard.types";
import type { CreateProjectCommand } from "@/types";

export function CreateProjectModal({ isOpen, maxDisplayOrder, onClose, onCreate }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setProjectName("");
      setError(null);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const displayOrder = maxDisplayOrder + 1;

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName.trim(),
          display_order: displayOrder,
        } as CreateProjectCommand),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error?.message || "Failed to create project");
        return;
      }

      const newProject = await response.json();
      onCreate(newProject);
      showSuccess("Project created successfully");
      onClose();
    } catch (err) {
      showError("Failed to create project. Please try again.");
      //eslint-disable-next-line no-console
      console.error("Project creation error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a name for your new project. The display order will be set automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <label htmlFor="project-name" className="text-sm font-medium">
            Project Name
          </label>
          <Input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="My Awesome Project"
            maxLength={100}
            disabled={isCreating}
            className={error ? "border-destructive" : ""}
          />
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
