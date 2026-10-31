import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function passwordStrengthIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push('رمز عبور باید حداقل ۸ کاراکتر باشد.');
  if (!/[A-Za-z]/.test(password)) issues.push('رمز عبور باید حداقل یک حرف انگلیسی داشته باشد.');
  if (!/[0-9]/.test(password)) issues.push('رمز عبور باید حداقل یک رقم داشته باشد.');
  return issues;
}
