export const AUTH_KEY = "auth-store";
export const DATA_KEY = "app-data";

export function databaseUrl() {
  return String(
    process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || ""
  ).trim();
}

export function hasDatabase() {
  return Boolean(databaseUrl());
}
