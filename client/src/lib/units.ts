export type DisplayUnit = "metric" | "imperial";

export function formatDimensionValue(value: string | null | undefined, unit: DisplayUnit) {
  if (!value || /request/i.test(value)) return "Available on request";
  if (unit === "metric") return value;
  return value.replace(/(\d+(?:\.\d+)?)\s*cm\b/gi, (_, amount: string) => `${(Number(amount) / 2.54).toFixed(1)} in`).replace(/(\d+(?:\.\d+)?)\s*mm\b/gi, (_, amount: string) => `${(Number(amount) / 25.4).toFixed(1)} in`);
}

export function formatWeightValue(value: number | null | undefined, unit: DisplayUnit) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Available on request";
  return unit === "metric" ? `${value} kg` : `${(value * 2.20462).toFixed(1)} lb`;
}

export function formatOptionalValue(value: string | number | boolean | null | undefined, fallback = "Available on request") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Available" : "Not specified";
  return String(value);
}
