/**
 * Represents a single validation issue detail.
 */
export interface ValidationIssue {
  field: string;
  issue: string;
}

/**
 * Error thrown when YAML data validation fails.
 * Used by both pages and projects for YAML parsing/validation errors.
 */
export class InvalidYamlError extends Error {
  public readonly details: ValidationIssue[];

  constructor(message = "Invalid YAML syntax", details: ValidationIssue[] = []) {
    super(message);
    this.name = "InvalidYamlError";
    this.details = details;
  }
}
