/**
 * Error thrown when attempting to create a page for a user who already has one.
 * Users can only have one page (one-to-one relationship).
 */
export class PageAlreadyExistsError extends Error {
  constructor(message = "A page already exists for this user") {
    super(message);
    this.name = "PageAlreadyExistsError";
  }
}

/**
 * Error thrown when attempting to create a page with a URL that's already taken.
 * Page URLs must be unique across all users.
 */
export class UrlAlreadyTakenError extends Error {
  constructor(message = "This URL is already in use") {
    super(message);
    this.name = "UrlAlreadyTakenError";
  }
}

/**
 * Error thrown when attempting to access, update, or delete a page that doesn't exist.
 */
export class PageNotFoundError extends Error {
  constructor(message = "No page found for this user") {
    super(message);
    this.name = "PageNotFoundError";
  }
}

/**
 * Error thrown when attempting to use a reserved URL.
 * Reserved URLs are protected system paths that cannot be used for page URLs.
 */
export class ReservedUrlError extends Error {
  constructor(message = "This URL is reserved and cannot be used") {
    super(message);
    this.name = "ReservedUrlError";
  }
}
