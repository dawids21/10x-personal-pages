import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Get the page template YAML content
 * @returns Page template as a string
 * @throws Error if template file cannot be read
 */
export function getPageTemplate(): string {
  try {
    const templatePath = join(process.cwd(), "src/assets/templates/page-template.yaml");
    return readFileSync(templatePath, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read page template file ${error}`);
  }
}

/**
 * Get the project template YAML content
 * @returns Project template as a string
 * @throws Error if template file cannot be read
 */
export function getProjectTemplate(): string {
  try {
    const templatePath = join(process.cwd(), "src/assets/templates/project-template.yaml");
    return readFileSync(templatePath, "utf-8");
  } catch (error) {
    throw new Error("Failed to read project template file");
  }
}

/**
 * Get a template by type
 * @param type - The template type ('page' or 'project')
 * @returns Template content as a string
 * @throws Error if template file cannot be read
 */
export function getTemplate(type: "page" | "project"): string {
  if (type === "page") {
    return getPageTemplate();
  }
  return getProjectTemplate();
}
