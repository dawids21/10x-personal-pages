import pageTemplateContent from "@/assets/templates/page-template.yaml?raw";
import projectTemplateContent from "@/assets/templates/project-template.yaml?raw";

/**
 * Get the page template YAML content
 * @returns Page template as a string
 */
export function getPageTemplate(): string {
  return pageTemplateContent;
}

/**
 * Get the project template YAML content
 * @returns Project template as a string
 */
export function getProjectTemplate(): string {
  return projectTemplateContent;
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
