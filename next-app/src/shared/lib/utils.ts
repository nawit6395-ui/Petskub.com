import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

const getRuntimeEnv = (key: string): string | undefined => {
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const importMetaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
  return importMetaEnv?.[key];
};

export const getAppBaseUrl = () => {
  const envUrl =
    getRuntimeEnv("NEXT_PUBLIC_SITE_URL") ??
    getRuntimeEnv("VITE_SITE_URL") ??
    getRuntimeEnv("SITE_URL");

  if (envUrl) {
    return trimTrailingSlash(envUrl.toString().trim());
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return "";
};

export const buildAppUrl = (path = "/") => {
  const base = getAppBaseUrl();
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";

  if (!base) {
    return normalizedPath || "/";
  }

  return `${base}${normalizedPath}`;
};
