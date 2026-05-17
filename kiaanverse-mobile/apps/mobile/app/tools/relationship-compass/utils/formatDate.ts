/**
 * Hermes-safe date formatters for the Relationship Compass.
 *
 * Why this file exists
 * --------------------
 * `new Intl.DateTimeFormat('en-IN', …)` and `Date.prototype.toLocaleDateString`
 * are technically supported by Hermes on Android, but in Hermes builds shipped
 * with React Native 0.74.5 (Expo SDK 51) calling them on the UI thread inside
 * a useMemo / render path can throw `ReferenceError: Intl is not defined` or
 * `RangeError: Invalid time value` when:
 *   • the bundled ICU data does not carry the requested locale
 *   • R8 has stripped `com.facebook.hermes.intl.*`
 *   • the Date is invalid (sealedAt missing / malformed)
 *
 * On a release AAB any of those throws inside render unwinds straight past
 * the JS exception handler and aborts the process — the user sees the app
 * "shut down" the moment the Compass Seal chamber mounts. To remove the
 * entire risk we format dates with explicit string concatenation here. No
 * locale support, but the Compass UI only ever needs `25 April 2026` and a
 * 24-hour clock.
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

/** Coerce input into a valid Date, falling back to "now" on garbage input. */
function safeDate(input: string | number | Date | null | undefined): Date {
  if (input instanceof Date && !isNaN(input.getTime())) return input;
  if (input === null || input === undefined || input === '') return new Date();
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

/** "25 April 2026" — used by the Compass Seal summary card. */
export function formatLongDate(input: string | number | Date | null | undefined): string {
  const d = safeDate(input);
  const month = MONTHS[d.getMonth()] ?? '';
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}

/** "25/04/2026, 14:32" — used by the Gita Counsel transmission timestamp. */
export function formatShortDateTime(
  input: string | number | Date | null | undefined
): string {
  const d = safeDate(input);
  const date = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return `${date}, ${time}`;
}
