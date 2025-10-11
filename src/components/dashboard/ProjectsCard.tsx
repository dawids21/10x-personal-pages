import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectListItem } from "@/components/dashboard/ProjectListItem";
import { CreateProjectModal } from "@/components/dashboard/CreateProjectModal";
import { useToast } from "@/components/dashboard/hooks/useToast";
import type { ProjectDto, ProjectCreateResponseDto } from "@/types";

export function ProjectsCard() {
  const [serverProjects, setServerProjects] = useState<ProjectDto[]>([]);
  const [localProjects, setLocalProjects] = useState<ProjectDto[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/projects");

      if (!response.ok) {
        setError("Failed to fetch projects");
        return;
      }

      const data = await response.json();
      setServerProjects(data);
      setLocalProjects(data);
      setError(null);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const moveUp = (index: number) => {
    if (index === 0) return;

    const newProjects = [...localProjects];
    [newProjects[index - 1], newProjects[index]] = [newProjects[index], newProjects[index - 1]];

    setLocalProjects(newProjects);
    setHasChanges(true);
  };

  const moveDown = (index: number) => {
    if (index === localProjects.length - 1) return;

    const newProjects = [...localProjects];
    [newProjects[index], newProjects[index + 1]] = [newProjects[index + 1], newProjects[index]];

    setLocalProjects(newProjects);
    setHasChanges(true);
  };

  const handleSaveOrder = async () => {
    try {
      setIsSavingOrder(true);

      const project_orders = localProjects.map((p, index) => ({
        project_id: p.project_id,
        display_order: index,
      }));

      const response = await fetch("/api/projects/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_orders }),
      });

      if (!response.ok) {
        showError("Failed to save project order. Please try again.");
        //eslint-disable-next-line no-console
        console.error("Save order error:", await response.json());
        return;
      }

      await fetchProjects();
      showSuccess("Project order saved successfully");
    } catch (err) {
      showError("Failed to save project order. Please try again.");
      //eslint-disable-next-line no-console
      console.error("Save order error:", err);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleReset = () => {
    setLocalProjects(serverProjects);
    setHasChanges(false);
  };

  const handleProjectCreate = (newProject: ProjectCreateResponseDto) => {
    const projectDto: ProjectDto = {
      user_id: newProject.user_id,
      project_id: newProject.project_id,
      project_name: newProject.project_name,
      display_order: newProject.display_order,
    };
    setServerProjects([...serverProjects, projectDto]);
    setLocalProjects([...localProjects, projectDto]);
  };

  const handleProjectUpdate = (updatedProject: ProjectDto) => {
    setServerProjects(serverProjects.map((p) => (p.project_id === updatedProject.project_id ? updatedProject : p)));
    setLocalProjects(localProjects.map((p) => (p.project_id === updatedProject.project_id ? updatedProject : p)));
  };

  const handleProjectDelete = (projectId: string) => {
    setServerProjects(serverProjects.filter((p) => p.project_id !== projectId));
    setLocalProjects(localProjects.filter((p) => p.project_id !== projectId));
  };

  const maxDisplayOrder = localProjects.length > 0 ? Math.max(...localProjects.map((p) => p.display_order)) : -1;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-destructive">Failed to load projects</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 text-sm text-primary hover:underline">
                Try again
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                {localProjects.length === 0
                  ? "No projects yet"
                  : `${localProjects.length} project${localProjects.length === 1 ? "" : "s"}`}
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>New Project</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {localProjects.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  No projects yet. Click &quot;New Project&quot; to get started.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {localProjects.map((project, index) => (
                  <ProjectListItem
                    key={project.project_id}
                    project={project}
                    canMoveUp={index > 0}
                    canMoveDown={index < localProjects.length - 1}
                    onReorderUp={() => moveUp(index)}
                    onReorderDown={() => moveDown(index)}
                    onUpdate={handleProjectUpdate}
                    onDelete={handleProjectDelete}
                  />
                ))}
              </div>

              {hasChanges && (
                <div className="flex gap-2 border-t pt-4">
                  <Button onClick={handleSaveOrder} disabled={isSavingOrder} className="flex-1">
                    {isSavingOrder ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving Order...
                      </>
                    ) : (
                      "Save Order"
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleReset} disabled={isSavingOrder}>
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        maxDisplayOrder={maxDisplayOrder}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleProjectCreate}
      />
    </>
  );
}
