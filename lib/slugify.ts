// Pure string helpers - no DB import, safe to use from client components
// (unlike lib/slug.ts, which pulls in the Postgres driver for uniqueness checks).

function normalize(input: string, separator: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`(^\\${separator}|\\${separator}$)`, 'g'), '')
}

/** kebab-case, for form URL slugs ("registro-voluntarios"). */
export function slugify(input: string) {
  return normalize(input, '-')
}

/** snake_case, for question keys ("nombre_completo"), matching the existing convention. */
export function keyify(input: string) {
  return normalize(input, '_')
}
