import type { PageCreateResponseDto, PageData, PageDto, UpdatePageThemeCommand } from "@/types.ts";
import {
  PageAlreadyExistsError,
  PageNotFoundError,
  ReservedUrlError,
  UrlAlreadyTakenError,
} from "../errors/pages.errors";
import { InvalidYamlError } from "../errors/shared.errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import { load, dump } from "js-yaml";
import { pageDataSchema } from "../validators/pages.validators";
import { z } from "zod";

/**
 * Creates a new page for a user.
 * Enforces one-to-one relationship (one page per user) and URL uniqueness.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param command - Page creation command (url, theme, and optional PageData object)
 * @throws {PageAlreadyExistsError} If user already has a page
 * @throws {UrlAlreadyTakenError} If URL is already taken by another user
 * @throws {Error} For other database errors
 */
export async function createPage(
  supabase: SupabaseClient,
  userId: string,
  command: { url: string; theme: string; data?: PageData }
): Promise<PageCreateResponseDto> {
  // Attempt to insert the new page
  const { data, error } = await supabase
    .from("pages")
    .insert({
      user_id: userId,
      url: command.url,
      theme: command.theme,
      data: command.data || null,
    })
    .select("user_id, url, theme")
    .single();

  if (error) {
    // Check if error is due to primary key violation (user already has a page)
    if (error.code === "23505" && error.message.includes("pages_pkey")) {
      throw new PageAlreadyExistsError();
    }
    // Check if error is due to unique constraint violation on URL
    if (error.code === "23505" && error.message.includes("pages_url_idx")) {
      throw new UrlAlreadyTakenError();
    }
    throw new Error(`Database error while creating page: ${error.message}`);
  }

  return data;
}

/**
 * Retrieves a user's page configuration (excludes YAML data field for performance).
 *
 * @throws {PageNotFoundError} If user has no page
 * @throws {Error} For other database errors
 * @returns Page data
 */
export async function getPageByUserId(supabase: SupabaseClient, userId: string): Promise<PageDto> {
  const { data, error } = await supabase
    .from("pages")
    .select("user_id, url, theme, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while fetching page: ${error.message}`);
  }

  if (!data) {
    throw new PageNotFoundError();
  }

  return data;
}

/**
 * Updates the theme of a user's page.
 *
 * @throws {PageNotFoundError} If user has no page to update
 * @throws {Error} For other database errors
 */
export async function updatePageTheme(
  supabase: SupabaseClient,
  userId: string,
  command: UpdatePageThemeCommand
): Promise<PageCreateResponseDto> {
  const { data, error } = await supabase
    .from("pages")
    .update({
      theme: command.theme,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("user_id, url, theme")
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while updating page theme: ${error.message}`);
  }

  if (!data) {
    throw new PageNotFoundError();
  }

  return data;
}

/**
 * Deletes a user's page.
 * This will cascade to delete all associated projects due to foreign key constraint.
 *
 * @throws {PageNotFoundError} If user has no page to delete
 * @throws {Error} For other database errors
 */
export async function deletePage(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await supabase.from("pages").delete().eq("user_id", userId).select("user_id").maybeSingle();

  if (error) {
    throw new Error(`Database error while deleting page: ${error.message}`);
  }

  if (!data) {
    throw new PageNotFoundError();
  }
}

/**
 * List of reserved URLs that cannot be used for page URLs.
 * These are protected system paths.
 */
const RESERVED_URLS = [
  "api",
  "admin",
  "auth",
  "dashboard",
  "static",
  "assets",
  "public",
  "docs",
  "help",
  "terms",
  "privacy",
];

/**
 * Checks if a URL is reserved and throws an error if it is.
 *
 * @param url - The URL to check
 * @throws {ReservedUrlError} If URL is reserved
 */
export function checkReservedUrl(url: string): void {
  if (RESERVED_URLS.includes(url.toLowerCase())) {
    throw new ReservedUrlError();
  }
}

/**
 * Checks if a URL is available for use by a specific user.
 * URL must be unique across all users, excluding the current user.
 *
 * @throws {UrlAlreadyTakenError} If URL is already taken by another user
 * @throws {Error} For database errors
 */
export async function checkUrlAvailability(supabase: SupabaseClient, url: string, userId: string): Promise<void> {
  const { data, error } = await supabase.from("pages").select("user_id").eq("url", url).maybeSingle();

  if (error) {
    throw new Error(`Database error while checking URL availability: ${error.message}`);
  }

  // URL is taken if it exists and belongs to a different user
  if (data && data.user_id !== userId) {
    throw new UrlAlreadyTakenError();
  }
}

/**
 * Updates a user's page URL.
 *
 * @throws {PageNotFoundError} If user has no page to update
 * @throws {UrlAlreadyTakenError} If URL is already taken
 * @throws {Error} For other database errors
 */
export async function updatePageUrl(supabase: SupabaseClient, userId: string, url: string): Promise<void> {
  const { data, error } = await supabase
    .from("pages")
    .update({
      url: url,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();

  if (error) {
    // Check if error is due to unique constraint violation on URL
    if (error.code === "23505" && error.message.includes("pages_url_idx")) {
      throw new UrlAlreadyTakenError();
    }
    throw new Error(`Database error while updating page URL: ${error.message}`);
  }

  if (!data) {
    throw new PageNotFoundError();
  }
}

/**
 * Parses YAML string and validates it against the page data schema.
 *
 * @param yamlString - The YAML string to parse and validate
 * @returns Validated page data object
 * @throws {InvalidYamlError} If YAML parsing or validation fails
 */
export async function parseAndValidateYaml(yamlString: string): Promise<PageData> {
  try {
    // Parse YAML using safe load
    const parsed = load(yamlString);

    // Validate against schema and return
    return pageDataSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod validation errors into detailed issues array
      const details = error.issues.map((e) => ({
        field: e.path.join(".") || "root",
        issue: e.message,
      }));
      throw new InvalidYamlError("The provided data is invalid.", details);
    }
    // Handle YAML parsing errors
    throw new InvalidYamlError(`Failed to parse YAML: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Updates a user's page data.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param data - Validated page data object
 * @throws {PageNotFoundError} If user has no page to update
 * @throws {Error} For database errors
 */
export async function updatePageData(supabase: SupabaseClient, userId: string, data: PageData): Promise<void> {
  const { data: result, error } = await supabase
    .from("pages")
    .update({
      data: data,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while updating page data: ${error.message}`);
  }

  if (!result) {
    throw new PageNotFoundError();
  }
}

/**
 * Retrieves a user's page data.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Page data object or null if no data exists
 * @throws {PageNotFoundError} If user has no page
 * @throws {Error} For database errors
 */
export async function getPageData(supabase: SupabaseClient, userId: string): Promise<PageData> {
  const { data, error } = await supabase.from("pages").select("data").eq("user_id", userId).maybeSingle();

  if (error) {
    throw new Error(`Database error while fetching page data: ${error.message}`);
  }

  if (!data || !data.data) {
    throw new PageNotFoundError();
  }

  return data.data;
}

/**
 * Converts a page data object to YAML string.
 *
 * @param data - Page data object
 * @returns YAML string representation
 */
export function convertToYaml(data: PageData): string {
  return dump(data);
}
