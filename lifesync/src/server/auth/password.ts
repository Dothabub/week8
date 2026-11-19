import bcrypt from "bcryptjs";

const COST = 12;
// Pre-computed hash used to equalise timing when the e-mail does not exist.
const DUMMY_HASH = "$2b$12$TY1RFQEKUWelJm.A6rJ9neVioAvr9x9PhO5fmnI0eDmy5AN1Tjznm";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) {
    await bcrypt.compare(password, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(password, hash);
}
