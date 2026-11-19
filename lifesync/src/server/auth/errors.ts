/** Errors whose message is safe to show to the user. */
export class AuthError extends Error {
  constructor(message: string, public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID" | "LOCKED" | "CONFLICT" = "INVALID") {
    super(message);
  }
}
