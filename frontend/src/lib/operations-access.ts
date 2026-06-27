/** Emails that may access live operations before manual provisioning (comma-separated). */
export function isDemoOperationsEmail(email: string): boolean {
  const raw = process.env.NEXT_PUBLIC_DEMO_OPERATIONS_EMAILS ?? "";
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
