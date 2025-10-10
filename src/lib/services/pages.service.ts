import type { CreatePageCommand, PageCreateResponseDto, PageDto, UpdatePageThemeCommand } from "@/types.ts";
import { PageAlreadyExistsError, PageNotFoundError, UrlAlreadyTakenError } from "../errors/pages.errors";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a new page for a user.
 * Enforces one-to-one relationship (one page per user) and URL uniqueness.
 *
 * @throws {PageAlreadyExistsError} If user already has a page
 * @throws {UrlAlreadyTakenError} If URL is already taken by another user
 * @throws {Error} For other database errors
 */
export async function createPage(
  supabase: SupabaseClient,
  userId: string,
  command: CreatePageCommand
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
