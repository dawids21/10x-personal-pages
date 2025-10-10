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
 * Error thrown when YAML data validation fails.
 * This will be used when YAML validation is implemented in the future.
 */
export class InvalidYamlError extends Error {
  constructor(message = "Invalid YAML syntax") {
    super(message);
    this.name = "InvalidYamlError";
  }
}
