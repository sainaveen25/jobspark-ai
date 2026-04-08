import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateRange(start: string, end?: string | null) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric"
  });

  const startValue = formatter.format(new Date(start));
  const endValue = end ? formatter.format(new Date(end)) : "Present";
  return `${startValue} - ${endValue}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
