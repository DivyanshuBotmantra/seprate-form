import { format, parse } from "date-fns";

export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date));
  } catch (_err) {
    return "";
  }
}

/**
 * Formats a date-time string from "YYYY-MM-DD HH:mm:ss" to "dd/MM/yy HH:mm:ss"
 * @param dateTimeString - The date-time string to format
 * @returns The formatted date-time string
 */
export function formatDateTime(dateTimeString: string): string {
  if (!dateTimeString) return dateTimeString;

  try {
    // Parse the date string in format "yyyy-MM-dd HH:mm:ss"
    const date = parse(dateTimeString, "yyyy-MM-dd HH:mm:ss", new Date());

    // Format as "dd/MM/yy HH:mm:ss"
    return format(date, "dd/MM/yy HH:mm:ss");
  } catch (error) {
    // If parsing fails, return the original string
    return dateTimeString;
  }
}
