/**
 * Error thrown when YAML data validation fails.
 * Used by both pages and projects for YAML parsing/validation errors.
 */
export class InvalidYamlError extends Error {
  constructor(message = "Invalid YAML syntax") {
    super(message);
    this.name = "InvalidYamlError";
  }
}
