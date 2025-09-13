import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Type guard to filter out null and undefined values
 * @param value - The value to check
 * @returns true if the value is not null or undefined
 */
export function NotNullish<T>(value: T | null | undefined): value is T {
  return value != null;
}
