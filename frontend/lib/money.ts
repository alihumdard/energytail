/**
 * Salary figures arrive as Postgres decimals, which PHP serialises as strings
 * ("90000.00") to avoid float rounding on the way out of the database.
 *
 * Math.round() coerces a numeric string quietly, so display code has worked
 * by accident; anything doing real arithmetic would not. Parsing in one place
 * keeps that accident from becoming a bug the first time someone adds two
 * salaries together.
 */
export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  const parsed = typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : null;
}
