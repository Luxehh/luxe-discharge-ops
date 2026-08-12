export function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

/**
 * Returns true when another item already uses the same name.
 * Optional matchFields require those fields to match as well
 * (e.g. same location for insurance/house duplicates).
 */
export function isDuplicateName(
  name,
  items = [],
  { excludeId = null, nameKey = 'name', matchFields = {} } = {}
) {
  const normalized = normalizeName(name)
  if (!normalized) return false

  return items.some((item) => {
    if (excludeId != null && String(item.id) === String(excludeId)) {
      return false
    }

    const fieldsMatch = Object.entries(matchFields).every(
      ([key, value]) => String(item[key] ?? '') === String(value ?? '')
    )
    if (!fieldsMatch) return false

    return normalizeName(item[nameKey]) === normalized
  })
}
