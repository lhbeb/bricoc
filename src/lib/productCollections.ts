export const PRODUCT_COLLECTION_OPTIONS = [
  { value: 'lawn-garden', label: 'Lawn & Garden' },
  { value: 'power-tools', label: 'Power Tools & Equipment' },
  { value: 'electronics', label: 'Electronics' },
] as const;

export function getCollectionsForCategory(category: string): string[] {
  const normalized = category.toLowerCase().trim();

  if (
    /mower|bike|bicycle|ebike|e-bike|scooter|tent|pool|swimming|trimmer|blower/.test(
      normalized,
    )
  ) {
    return ['lawn-garden'];
  }

  if (/pressure washer|vacuum|power|generator|tool|hardware/.test(normalized)) {
    return ['power-tools'];
  }

  if (/console|electronic|camera/.test(normalized)) {
    return ['electronics'];
  }

  return ['lawn-garden'];
}
