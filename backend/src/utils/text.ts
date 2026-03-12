export function normalizeTopic(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function toSlug(value: string): string {
  return normalizeTopic(value)
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function cleanSummary(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}
