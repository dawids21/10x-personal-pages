/**
 * Error thrown when email is already registered during sign-up.
 */
export class EmailAlreadyRegisteredError extends Error {
  constructor(message = "Email already in use") {
    super(message);
    this.name = "EmailAlreadyRegisteredError";
  }
}

/**
 * Error thrown when sign-in credentials are invalid.
 */
export class InvalidCredentialsError extends Error {
  constructor(message = "Invalid credentials") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Error thrown when user tries to sign in with unconfirmed email.
 */
export class EmailNotConfirmedError extends Error {
  constructor(message = "Email not confirmed") {
    super(message);
    this.name = "EmailNotConfirmedError";
  }
}

/**
 * Error thrown when authentication is required but not provided.
 */
export class AuthenticationRequiredError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

/**
 * Error thrown when Supabase auth operation fails unexpectedly.
 */
export class AuthServiceError extends Error {
  constructor(message = "Authentication service error") {
    super(message);
    this.name = "AuthServiceError";
  }
}
