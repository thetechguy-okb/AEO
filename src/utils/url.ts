export function prepareDocumentUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) return "";

  if (/[?&]download=1(?:&|$)/i.test(trimmed)) {
    return trimmed;
  }

  if (/[?&]download=[^&]*/i.test(trimmed)) {
    return trimmed.replace(
      /([?&])download=[^&]*/i,
      "$1download=1"
    );
  }

  return trimmed.includes("?")
    ? `${trimmed}&download=1`
    : `${trimmed}?download=1`;
}

export function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getItemSlug(item: { slug?: string; title: string; id?: string }): string {
  if (item.slug && item.slug.trim()) {
    return generateSlug(item.slug);
  }
  return generateSlug(item.title) || item.id || '';
}

