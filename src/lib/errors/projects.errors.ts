/**
 * Error thrown when attempting to access, update, or delete a project that doesn't exist.
 */
export class ProjectNotFoundError extends Error {
  constructor(message = "Project not found") {
    super(message);
    this.name = "ProjectNotFoundError";
  }
}
