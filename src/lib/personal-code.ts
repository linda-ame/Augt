import bcrypt from "bcryptjs";

export async function hashPersonalCode(code: string): Promise<string> {
  return bcrypt.hash(code.trim(), 10);
}

export async function verifyPersonalCode(
  code: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(code.trim(), hash);
}
