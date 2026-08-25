const COUNTRY_RULES: Array<{ names: string[]; code: string; digits: number[] }> = [
  { names: ["india", "in"], code: "91", digits: [10] },
  { names: ["italy", "it"], code: "39", digits: [9, 10] },
  { names: ["united kingdom", "uk", "gb", "england"], code: "44", digits: [10] },
  { names: ["united states", "usa", "us", "canada", "ca"], code: "1", digits: [10] },
  { names: ["uae", "united arab emirates", "ae", "dubai"], code: "971", digits: [9] },
];

export function validateInternationalPhone(phone: string | undefined, country: string | undefined) {
  if (!phone?.trim()) return null;
  const normalized = phone.replace(/[\s().-]/g, "");
  if (!/^\+\d{8,15}$/.test(normalized)) return "Enter a phone number with country code, for example +39 02 555 0101.";
  const rule = COUNTRY_RULES.find((candidate) => candidate.names.includes((country || "").trim().toLowerCase()));
  if (!rule) return null;
  if (!normalized.startsWith(`+${rule.code}`)) return `Use the international country code for ${country}.`;
  const nationalDigits = normalized.slice(rule.code.length + 1).length;
  return rule.digits.includes(nationalDigits) ? null : `Check the number of digits for ${country}.`;
}
