// Retail price rule shared by the check scripts (the site uses src/lib/catalog-store.ts — keep both the same):
// retail = the larger of source × markup (rounded to the penny) and source + minimum markup amount (default £3).
export function markupFor(p, s) {
  return s.markup?.byBrand?.[p.brand] ?? s.markup?.byCategory?.[p.category] ?? s.markup?.default ?? 1.15;
}

export function retailFor(p, sourcePence, s) {
  return Math.max(Math.round(sourcePence * markupFor(p, s)), sourcePence + (s.markup?.minAmount ?? 300));
}
