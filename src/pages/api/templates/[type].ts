import type { APIRoute } from "astro";
import { getTemplate } from "@/lib/services/template.service.ts";

// Enable static generation for this endpoint
export const prerender = true;

/**
 * Define static paths for template types
 * Generates routes at build time for 'page' and 'project' templates
 */
export function getStaticPaths() {
  return [{ params: { type: "page" } }, { params: { type: "project" } }];
}

/**
 * GET handler for downloading YAML templates
 * Returns a downloadable YAML file with appropriate headers
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    // Extract type parameter (guaranteed to be 'page' or 'project' due to getStaticPaths)
    const { type } = params;

    // Get template content
    const templateContent = getTemplate(type as "page" | "project");

    // Set response headers for file download
    const headers = new Headers({
      "Content-Type": "application/x-yaml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-template.yaml"`,
    });

    // Return response with template content
    return new Response(templateContent, {
      status: 200,
      headers,
    });
  } catch (error) {
    // Handle build-time errors (should rarely occur)
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: `Failed to generate template file: ${error}`,
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
