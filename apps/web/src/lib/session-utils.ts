import { randomBytes } from "crypto";

export function normalizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, "") // Remove protocol
    .replace(/\/$/, "") // Remove trailing slash
    .toLowerCase(); // Normalize case
}

export function generateSessionToken(): string {
  return `auth_session_${randomBytes(32).toString("hex")}`;
}
